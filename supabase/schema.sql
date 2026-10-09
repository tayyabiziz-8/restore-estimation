-- Restore Estimation: orders backend.
-- Run once in Supabase > SQL Editor > New query > paste > Run.
-- Safe to re-run: everything is "if not exists" / "or replace".

-- ---------------------------------------------------------------- tables
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                       -- RE-yymmdd-XXXX, shown to customers
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'awaiting_payment' check (status in (
    'awaiting_payment', 'payment_processing', 'payment_failed', 'quote_requested',
    'paid', 'in_progress', 'delivered', 'cancelled', 'refunded')),
  name text not null,
  email text not null,
  address text not null,
  loss_type text not null,
  tier text not null,                             -- minor | total | roof | large | unsure
  urgency text not null,                          -- standard | rush
  extra_rooms int not null default 0,
  amount_cents int,                               -- null for quoted orders
  scope_notes text,
  photo_link text,
  details text,
  consent_at timestamptz not null,
  stripe_session_id text,
  stripe_payment_intent text,
  stripe_livemode boolean,
  paid_at timestamptz,
  admin_notes text
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('scope_notes', 'measurements', 'image')),
  path text not null unique,                      -- object path in the order-files bucket
  name text not null,                             -- original file name
  size bigint,
  content_type text,
  created_at timestamptz not null default now()
);
create index if not exists order_files_order_idx on public.order_files (order_id);

-- People allowed into /admin. Add a row after creating the user in Auth.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- security
-- The public website never talks to these tables directly: orders are
-- written by the server (/api, service role key, which bypasses RLS).
-- Signed-in admins can read everything and change status / notes only.
alter table public.orders enable row level security;
alter table public.order_files enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete orders" on public.orders;
create policy "admins delete orders" on public.orders
  for delete to authenticated using (public.is_admin());

drop policy if exists "admins read files" on public.order_files;
create policy "admins read files" on public.order_files
  for select to authenticated using (public.is_admin());

drop policy if exists "read own admin row" on public.admins;
create policy "read own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Admins may only edit the workflow columns, never prices or payment data.
revoke update on public.orders from anon, authenticated;
grant update (status, admin_notes) on public.orders to authenticated;
revoke all on public.orders, public.order_files, public.admins from anon;

-- ---------------------------------------------------------------- storage
-- Private bucket: files are only reachable through short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit)
values ('order-files', 'order-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "admins read order files" on storage.objects;
create policy "admins read order files" on storage.objects
  for select to authenticated using (bucket_id = 'order-files' and public.is_admin());
drop policy if exists "admins delete order files" on storage.objects;
create policy "admins delete order files" on storage.objects
  for delete to authenticated using (bucket_id = 'order-files' and public.is_admin());
