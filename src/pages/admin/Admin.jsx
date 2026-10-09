import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import logoMark from '../../assets/logo-mark.png'
import { getSupabase, ORDER_BUCKET } from '../../lib/supabaseClient'
import usePageMeta from '../../lib/usePageMeta'
import { ORDER_STATUSES, statusLabel, FILE_FIELDS } from '../../data/orderOptions'
import { getTier, formatUSD } from '../../data/pricing'

/**
 * /admin: order management for Restore Estimation staff.
 * Sign-in is Supabase Auth (email + password). What a signed-in user can
 * read or change is enforced by row-level security in supabase/schema.sql:
 * only users listed in the `admins` table see anything, and they can only
 * change an order's status and internal notes (or delete it).
 */

const VIEWS = [
  { id: 'action', label: 'Needs action', statuses: ['paid', 'quote_requested'] },
  { id: 'progress', label: 'In progress', statuses: ['in_progress'] },
  { id: 'unpaid', label: 'Unpaid', statuses: ['awaiting_payment', 'payment_processing', 'payment_failed'] },
  { id: 'done', label: 'Delivered', statuses: ['delivered'] },
  { id: 'closed', label: 'Closed', statuses: ['cancelled', 'refunded'] },
  { id: 'all', label: 'All', statuses: null },
]

const TONES = {
  action: 'bg-brass/15 text-brass',
  progress: 'bg-ink-heading/10 text-ink-heading',
  done: 'bg-emerald-50 text-emerald-800',
  alert: 'bg-red-50 text-red-700',
  muted: 'bg-line-dim text-ink-dim',
}

const input =
  'w-full border border-line bg-white px-3 py-2.5 text-sm text-ink-heading outline-none transition-colors focus:border-brass'
const btnPrimary =
  'bg-brass px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-heading disabled:opacity-60'
const btnSecondary =
  'border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-body transition-colors hover:border-ink-heading hover:text-ink-heading disabled:opacity-60'

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '')

export default function Admin() {
  usePageMeta({ title: 'Admin', noindex: true })
  const [supabase, setSupabase] = useState(null)
  const [configError, setConfigError] = useState('')
  const [session, setSession] = useState(undefined) // undefined = still loading
  const [isAdmin, setIsAdmin] = useState(null)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    let unsub
    getSupabase()
      .then((client) => {
        setSupabase(client)
        client.auth.getSession().then(({ data }) => setSession(data.session))
        const { data } = client.auth.onAuthStateChange((event, s) => {
          if (event === 'PASSWORD_RECOVERY') setRecovering(true)
          setSession(s)
        })
        unsub = () => data.subscription.unsubscribe()
      })
      .catch((err) => setConfigError(err.message))
    return () => unsub?.()
  }, [])

  // Signed in is not enough: the account must also be listed in `admins`.
  useEffect(() => {
    if (!supabase || !session) {
      setIsAdmin(null)
      return
    }
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)))
  }, [supabase, session])

  if (configError) return <Centered title="Admin is not configured">{configError}</Centered>
  if (!supabase || session === undefined) return <Centered title="Loading…" />
  if (recovering && session) return <SetPassword supabase={supabase} onDone={() => setRecovering(false)} />
  if (!session) return <SignIn supabase={supabase} />
  if (isAdmin === null) return <Centered title="Checking access…" />
  if (!isAdmin) {
    return (
      <Centered title="No admin access">
        <p>{session.user.email} is signed in but is not an admin.</p>
        <button type="button" className={`${btnSecondary} mt-6`} onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </Centered>
    )
  }
  return <Dashboard supabase={supabase} session={session} />
}

/* ------------------------------------------------------------- sign in */

function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-site items-center gap-3 px-4 py-3 sm:px-6 md:px-10 xl:px-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoMark} alt="" className="h-8 w-auto" />
            <span className="font-logo text-sm font-bold tracking-tight text-ink-heading">Restore Estimation</span>
          </Link>
          <span className="text-sm text-ink-dim">/ Admin</span>
        </div>
      </header>
      {children}
    </div>
  )
}

function Centered({ title, children }) {
  return (
    <Shell>
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink-heading">{title}</h1>
        {children && <div className="mt-4 text-sm text-ink-body">{children}</div>}
      </div>
    </Shell>
  )
}

function SignIn({ supabase }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage({ error: true, text: 'Email or password is incorrect.' })
    setBusy(false)
  }

  async function forgot() {
    if (!email) {
      setMessage({ error: true, text: 'Enter your email first, then click "Forgot password".' })
      return
    }
    setBusy(true)
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin` })
    setMessage({ error: false, text: 'If that email is an admin account, a reset link is on its way.' })
    setBusy(false)
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-sm px-6 py-16 sm:py-24">
        <h1 className="font-display text-3xl text-ink-heading">Sign in</h1>
        <p className="mt-2 text-sm text-ink-dim">Orders dashboard for Restore Estimation staff.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-ink-heading">
            Email
            <input className={`${input} mt-2`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-ink-heading">
            Password
            <input className={`${input} mt-2`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {message && (
            <p className={`text-sm ${message.error ? 'text-red-700' : 'text-ink-body'}`} role="alert">{message.text}</p>
          )}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button type="button" onClick={forgot} disabled={busy} className="w-full text-sm text-brass underline underline-offset-4">
            Forgot password
          </button>
        </form>
      </div>
    </Shell>
  )
}

function SetPassword({ supabase, onDone }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (password.length < 10) {
      setError('Use at least 10 characters.')
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) setError(err.message)
    else onDone()
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-sm px-6 py-16 sm:py-24">
        <h1 className="font-display text-3xl text-ink-heading">Set a new password</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className={input} type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>Save password</button>
        </form>
      </div>
    </Shell>
  )
}

/* ------------------------------------------------------------- dashboard */

function Dashboard({ supabase, session }) {
  const [params, setParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState('action')
  const [query, setQuery] = useState('')
  const selectedRef = params.get('order')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_files(*)')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) setLoadError(error.message)
    else {
      setOrders(data)
      setLoadError('')
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 60000)
    return () => clearInterval(id)
  }, [load])

  // An emailed link (?order=REF) opens that order in the "All" view.
  useEffect(() => {
    if (selectedRef) setView((v) => (v === 'action' ? 'all' : v))
    // only on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const c = {}
    for (const v of VIEWS) c[v.id] = v.statuses ? orders.filter((o) => v.statuses.includes(o.status)).length : orders.length
    return c
  }, [orders])

  const visible = useMemo(() => {
    const v = VIEWS.find((x) => x.id === view)
    const q = query.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (!v.statuses || v.statuses.includes(o.status)) &&
        (!q || [o.ref, o.name, o.email, o.address].some((f) => f?.toLowerCase().includes(q))),
    )
  }, [orders, view, query])

  const selected = orders.find((o) => o.ref === selectedRef) || null
  const select = (ref) => setParams(ref ? { order: ref } : {})

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-site items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-10 xl:px-16">
          <div className="flex min-w-0 items-center gap-2">
            <img src={logoMark} alt="" className="h-8 w-auto shrink-0" />
            <span className="font-logo truncate text-sm font-bold tracking-tight text-ink-heading">Orders</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink-dim md:inline">{session.user.email}</span>
            <button type="button" onClick={load} className={btnSecondary} title="Refresh">
              Refresh
            </button>
            <button type="button" onClick={() => supabase.auth.signOut()} className={btnSecondary}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-site flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8 xl:px-16">
        <div className={`grid gap-8 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]' : ''}`}>
          {/* List: hidden on small screens while an order is open */}
          <section className={selected ? 'hidden lg:block' : ''}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setView(v.id)}
                    className={`shrink-0 border px-3 py-2 text-sm transition-colors ${
                      view === v.id ? 'border-ink-heading bg-ink-heading text-paper' : 'border-line bg-white text-ink-body hover:border-ink-heading'
                    }`}
                  >
                    {v.label}
                    <span className={`ml-2 tabular-nums ${view === v.id ? 'text-paper/70' : 'text-ink-dim'}`}>{counts[v.id]}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                placeholder="Search ref, name, email, address"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${input} xl:max-w-xs`}
              />
            </div>

            {loadError && <p className="mt-6 text-sm text-red-700">Could not load orders: {loadError}</p>}
            {loading ? (
              <p className="mt-10 text-sm text-ink-dim">Loading orders…</p>
            ) : visible.length === 0 ? (
              <p className="mt-10 border border-dashed border-line p-10 text-center text-sm text-ink-dim">
                No orders here{query ? ' match your search' : ''}.
              </p>
            ) : (
              <OrderList orders={visible} selectedRef={selectedRef} onSelect={select} />
            )}
          </section>

          {selected && (
            <OrderDetail
              key={selected.id}
              supabase={supabase}
              order={selected}
              onClose={() => select(null)}
              onChanged={load}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const tone = ORDER_STATUSES.find((s) => s.id === status)?.tone || 'muted'
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{statusLabel(status)}</span>
}

function tierName(id) {
  return getTier(id)?.name || 'Not sure yet'
}

function OrderList({ orders, selectedRef, onSelect }) {
  return (
    <>
      {/* Cards: phones and tablets */}
      <ul className="mt-6 space-y-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o.ref)}
              className="w-full border border-line bg-white p-4 text-left transition-colors hover:border-ink-heading"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium tabular-nums text-ink-heading">{o.ref}</span>
                <StatusPill status={o.status} />
              </div>
              <p className="mt-2 text-sm text-ink-heading">{o.name}</p>
              <p className="truncate text-sm text-ink-dim">{o.address}</p>
              <p className="mt-2 flex justify-between text-xs text-ink-dim">
                <span>{tierName(o.tier)}{o.urgency === 'rush' ? ', rush' : ''}</span>
                <span>{fmtDate(o.created_at)}</span>
              </p>
            </button>
          </li>
        ))}
      </ul>

      {/* Table: md and up */}
      <div className="mt-6 hidden overflow-x-auto border border-line bg-white md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-paper-alt text-xs uppercase tracking-wide text-ink-dim">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => onSelect(o.ref)}
                className={`cursor-pointer border-b border-line-dim last:border-0 transition-colors hover:bg-paper ${
                  o.ref === selectedRef ? 'bg-paper' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium tabular-nums text-ink-heading">
                  <button type="button" className="text-left" onClick={() => onSelect(o.ref)}>{o.ref}</button>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-dim">{fmtDate(o.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="block text-ink-heading">{o.name}</span>
                  <span className="block text-xs text-ink-dim">{o.email}</span>
                </td>
                <td className="max-w-[16rem] truncate px-4 py-3 text-ink-body">{o.address}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-body">
                  {tierName(o.tier)}
                  {o.urgency === 'rush' && <span className="ml-1 text-xs text-brass">rush</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink-heading">
                  {o.amount_cents ? formatUSD(o.amount_cents) : 'Quote'}
                </td>
                <td className="px-4 py-3"><StatusPill status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ------------------------------------------------------------- detail */

function OrderDetail({ supabase, order, onClose, onChanged }) {
  const [status, setStatus] = useState(order.status)
  const [notes, setNotes] = useState(order.admin_notes || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [links, setLinks] = useState({}) // path -> signed url | null (missing)

  const files = order.order_files || []
  const dirty = status !== order.status || notes !== (order.admin_notes || '')

  // Signed links (1 hour) for every file, for previews and downloads.
  useEffect(() => {
    if (!files.length) return
    supabase.storage
      .from(ORDER_BUCKET)
      .createSignedUrls(files.map((f) => f.path), 3600)
      .then(({ data }) => {
        const map = {}
        for (const item of data || []) map[item.path] = item.error ? null : item.signedUrl
        setLinks(map)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])

  async function save() {
    setSaving(true)
    setSaveMsg('')
    const { error } = await supabase.from('orders').update({ status, admin_notes: notes || null }).eq('id', order.id)
    setSaving(false)
    if (error) setSaveMsg(`Not saved: ${error.message}`)
    else {
      setSaveMsg('Saved')
      onChanged()
    }
  }

  async function remove() {
    if (!window.confirm(`Delete order ${order.ref} and all of its files? This cannot be undone.`)) return
    if (files.length) {
      const { error } = await supabase.storage.from(ORDER_BUCKET).remove(files.map((f) => f.path))
      if (error) {
        window.alert(`Files could not be deleted: ${error.message}`)
        return
      }
    }
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) {
      window.alert(`Order could not be deleted: ${error.message}`)
      return
    }
    onClose()
    onChanged()
  }

  const stripeUrl = order.stripe_payment_intent
    ? `https://dashboard.stripe.com/${order.stripe_livemode === false ? 'test/' : ''}payments/${order.stripe_payment_intent}`
    : null

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="border border-line bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <button type="button" onClick={onClose} className="mb-3 text-sm text-brass underline underline-offset-4 lg:hidden">
              ← All orders
            </button>
            <p className="text-xs uppercase tracking-wide text-ink-dim">Order</p>
            <h2 className="font-display text-2xl tabular-nums text-ink-heading">{order.ref}</h2>
            <p className="mt-1 text-xs text-ink-dim">Received {fmtDate(order.created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusPill status={order.status} />
            <button type="button" onClick={onClose} className="hidden text-sm text-ink-dim hover:text-ink-heading lg:block" aria-label="Close">
              Close ✕
            </button>
          </div>
        </div>

        <div className="max-h-none space-y-6 p-5 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
          {/* Workflow */}
          <div className="space-y-3 border border-line-dim bg-paper p-4">
            <label className="block text-sm font-medium text-ink-heading">
              Status
              <select className={`${input} mt-2`} value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-ink-heading">
              Internal notes
              <textarea className={`${input} mt-2 resize-y`} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only visible here" />
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} disabled={!dirty || saving} className={btnPrimary}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saveMsg && <span className="text-sm text-ink-dim">{saveMsg}</span>}
            </div>
          </div>

          <DetailGroup title="Customer">
            <Row label="Name">{order.name}</Row>
            <Row label="Email">
              <a className="text-brass underline underline-offset-4" href={`mailto:${order.email}?subject=${encodeURIComponent(`Your estimate order ${order.ref}`)}`}>
                {order.email}
              </a>
            </Row>
          </DetailGroup>

          <DetailGroup title="Order">
            <Row label="Property">{order.address}</Row>
            <Row label="Loss type">{order.loss_type}</Row>
            <Row label="Tier">{tierName(order.tier)}</Row>
            <Row label="Turnaround">{order.urgency === 'rush' ? 'Rush, same day' : 'Standard (48 hrs)'}</Row>
            {order.extra_rooms > 0 && <Row label="Extra rooms">{order.extra_rooms}</Row>}
            <Row label="Total">{order.amount_cents ? formatUSD(order.amount_cents) : 'Quoted'}</Row>
            {order.paid_at && <Row label="Paid">{fmtDate(order.paid_at)}</Row>}
            {stripeUrl && (
              <Row label="Stripe">
                <a className="text-brass underline underline-offset-4" href={stripeUrl} target="_blank" rel="noopener noreferrer">
                  View payment
                </a>
              </Row>
            )}
          </DetailGroup>

          {order.photo_link && (
            <DetailGroup title="Photo link">
              <a className="break-all text-sm text-brass underline underline-offset-4" href={order.photo_link} target="_blank" rel="noopener noreferrer">
                {order.photo_link}
              </a>
            </DetailGroup>
          )}
          {order.scope_notes && <TextBlock title="Scope notes" text={order.scope_notes} />}
          {order.details && <TextBlock title="Notes for the estimator" text={order.details} />}

          <DetailGroup title={`Files (${files.length})`}>
            {files.length === 0 ? (
              <p className="text-sm text-ink-dim">No files uploaded.</p>
            ) : (
              FILE_FIELDS.map((field) => {
                const group = files.filter((f) => f.kind === field.kind)
                if (!group.length) return null
                return (
                  <div key={field.kind} className="mb-4 last:mb-0">
                    <p className="mb-2 text-xs uppercase tracking-wide text-ink-dim">{field.label}</p>
                    {field.kind === 'image' ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {group.map((f) => (
                          <FileThumb key={f.id} file={f} url={links[f.path]} />
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {group.map((f) => (
                          <li key={f.id}><FileLink file={f} url={links[f.path]} /></li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })
            )}
          </DetailGroup>

          <p className="text-xs text-ink-dim">
            Terms accepted {fmtDate(order.consent_at)}. Last updated {fmtDate(order.updated_at)}.
          </p>

          <div className="border-t border-line pt-5">
            <button type="button" onClick={remove} className="text-sm text-red-700 underline underline-offset-4">
              Delete order and files
            </button>
            <p className="mt-1 text-xs text-ink-dim">For data deletion requests or spam. Cannot be undone.</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function DetailGroup({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-brass">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-ink-dim">{label}</span>
      <span className="break-words text-ink-heading">{children}</span>
    </div>
  )
}

function TextBlock({ title, text }) {
  return (
    <DetailGroup title={title}>
      <p className="whitespace-pre-wrap border border-line-dim bg-paper p-3 text-sm leading-relaxed text-ink-body">{text}</p>
    </DetailGroup>
  )
}

function downloadUrl(url, name) {
  return `${url}&download=${encodeURIComponent(name)}`
}

function FileLink({ file, url }) {
  const size = file.size ? ` (${Math.max(1, Math.round(file.size / 1024))} KB)` : ''
  if (url === null) return <span className="text-sm text-ink-dim">{file.name}{size}, not uploaded</span>
  if (!url) return <span className="text-sm text-ink-dim">{file.name}{size}</span>
  return (
    <a className="text-sm text-brass underline underline-offset-4" href={downloadUrl(url, file.name)}>
      {file.name}{size}
    </a>
  )
}

function FileThumb({ file, url }) {
  if (url === null) {
    return (
      <div className="flex aspect-square items-center justify-center border border-dashed border-line p-1 text-center text-[10px] text-ink-dim">
        Not uploaded
      </div>
    )
  }
  if (!url) return <div className="aspect-square animate-pulse bg-line-dim" />
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden border border-line bg-paper-alt" title={file.name}>
      <img src={url} alt={file.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
    </a>
  )
}
