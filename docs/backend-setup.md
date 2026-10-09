# Backend setup: orders database, file storage, admin, emails

Everything below runs on free plans while testing.

How it fits together:

1. Customer submits the order form. `POST /api/orders` saves the order in
   Supabase and returns one-time upload links.
2. The browser uploads files straight into a **private** Supabase storage
   bucket (up to 50 MB per file, 40 images).
3. Payable orders go to Stripe Checkout. Quoted orders stop here and the
   office gets a "Quote request" email.
4. Stripe's webhook marks the order **Paid** and emails "PAID, start work"
   with a link to the order in `/admin`.
5. Staff sign in at `/admin`, view orders and files, set status and notes.

## 1. Supabase project

1. supabase.com > Sign up > **New project**. Name `restore-estimation`,
   a strong database password (save it in a password manager), region
   **East US** (or closest US region). Plan: Free.
2. **SQL Editor > New query**: paste all of `supabase/schema.sql`, click
   **Run**. It should finish with "Success. No rows returned". This
   creates the tables, security rules and the private `order-files` bucket.
3. **Authentication > Sign In / Providers > Email**: turn **off**
   "Allow new users to sign up" (only you create admin accounts).
   Keep Email provider enabled.
4. **Authentication > URL Configuration**: Site URL
   `https://restoreestimation.com`. Redirect URLs: add
   `https://restoreestimation.com/admin`,
   `https://<your-project>.vercel.app/admin` and
   `http://localhost:3000/admin` (used by "Forgot password").
5. **Authentication > Users > Add user > Create new user**: the admin's
   email and a strong password, tick **Auto Confirm User**.
6. Make that user an admin. SQL Editor, new query (change the email):

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'admin@restoreestimation.com';
   ```

   Repeat 5 and 6 for each staff member who needs access.
7. **Project Settings > API keys** (or "Data API"): copy the **Project
   URL**, the **anon / publishable** key and the **service_role / secret**
   key.

Free plan notes: about 500 MB database and 1 GB file storage, and the
project **pauses after 7 days with no activity**. While paused, orders
fail. Unpause from the dashboard, and move to Pro ($25/mo) before real
customers depend on it.

## 2. EmailJS (free plan: 2 templates, which is exactly what we need)

1. emailjs.com > **Email Services > Add New Service > Gmail** (Google
   Workspace) or Outlook 365, signed in as admin@restoreestimation.com.
   Copy the **Service ID**.
2. **Template 1, Contact** (Email Templates > Create New Template):
   - Subject `Website message from {{from_name}}`
   - To Email `admin@restoreestimation.com`, Reply To `{{from_email}}`
   - Content:
     ```
     Name: {{from_name}}
     Email: {{from_email}}

     {{message}}

     Consent to be contacted: {{consent}} at {{consent_at}}
     ```
3. **Template 2, Alert** (used by the server for quote requests and
   payments):
   - Subject `{{subject}}`
   - To Email `admin@restoreestimation.com`, Reply To `{{reply_to}}`
   - Content: `{{message}}`
4. **Account > General**: copy the **Public Key**.
   **Account > Security**: turn on **Allow EmailJS API for non-browser
   applications**, copy the **Private Key**. (Allowed-domains lists are a
   paid feature; not needed now.)

If EmailJS is not set up, nothing breaks: orders are still saved and
visible in `/admin`, the alert text just goes to the Vercel logs.

## 3. Environment variables (Vercel)

Vercel > Project > Settings > Environment Variables. Add for Production
and Preview (use the same values for now):

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key (**secret**) |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS Service ID |
| `VITE_EMAILJS_CONTACT_TEMPLATE_ID` | Contact template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS Public Key |
| `EMAILJS_SERVICE_ID` | same Service ID |
| `EMAILJS_ALERT_TEMPLATE_ID` | Alert template ID |
| `EMAILJS_PUBLIC_KEY` | same Public Key |
| `EMAILJS_PRIVATE_KEY` | EmailJS Private Key (**secret**) |

Already there from Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`SITE_URL`. Remove the old `VITE_EMAILJS_ORDER_TEMPLATE_ID`,
`VITE_EMAILJS_ATTACHMENT_LIMIT_KB` and `EMAILJS_PAYMENT_TEMPLATE_ID` if
you added them.

Then **redeploy** (VITE_ values are baked in at build time).

## 4. Test (Stripe test mode)

1. `/admin`: sign in. Empty list, no errors.
2. Order a **Total Loss** with 2 photos and a scope-notes PDF, pay with
   `4242 4242 4242 4242`. Expect: success page, "PAID, start work" email,
   order under **Needs action** in `/admin` with both photos previewing
   and the PDF downloading.
3. Order **Large Loss** with only a photo link. Expect: "quote request"
   page, "Quote request" email, order under **Needs action**.
4. Start an order, then press back on the Stripe page. Expect: the
   cancelled page, the order under **Unpaid**, and "Return to payment"
   working.
5. In `/admin`: change a status, add a note, save, refresh. Delete a test
   order: files and row disappear.
6. Sign out, open `/admin?order=...` from an alert email: it asks you to
   sign in, then opens that order.

## Security notes

- The public site never reads the database. Orders are written only by
  `/api` using the secret key; signed-in admins read them through
  row-level security (`supabase/schema.sql`).
- Admins can change only `status` and `admin_notes` (or delete), never
  prices or payment fields.
- Files are in a private bucket. Upload links are one-time; download
  links in `/admin` expire after an hour.
- `/admin` is excluded from search engines (robots.txt and noindex).
