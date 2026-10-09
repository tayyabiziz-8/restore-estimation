import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SITE } from '../siteConfig'
import { formatUSD } from '../data/pricing'
import usePageMeta from '../lib/usePageMeta'
import { clearPendingCheckout, startCheckout } from '../lib/checkout'

function Shell({ label, title, children }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center md:px-10 md:py-24">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-brass">{label}</p>
      <h1 className="mt-4 font-display text-3xl text-ink-heading md:text-4xl">{title}</h1>
      <div className="mt-5 space-y-4 text-ink-body">{children}</div>
    </div>
  )
}

const primary = 'inline-block bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-heading disabled:opacity-60'
const secondary = 'inline-block border border-line px-6 py-3 text-sm font-medium text-ink-body transition-colors hover:border-ink-heading hover:text-ink-heading'

/** /order/success?session_id=cs_... : confirms with Stripe before saying "paid". */
export function OrderSuccess() {
  usePageMeta({ title: 'Order confirmation', noindex: true })
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    if (!sessionId) {
      setState({ loading: false, error: true })
      return
    }
    fetch(`/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('status'))))
      .then((data) => {
        if (data.paymentStatus === 'paid') clearPendingCheckout()
        setState({ loading: false, ...data })
      })
      .catch(() => setState({ loading: false, error: true }))
  }, [sessionId])

  if (state.loading) {
    return <Shell label="Checking payment" title="One moment…"><p>Confirming your payment with Stripe.</p></Shell>
  }

  if (state.error) {
    return (
      <Shell label="Payment" title="We could not confirm this payment.">
        <p>
          If you were charged, you will get a Stripe receipt by email and we
          will confirm your order shortly. Questions? Email{' '}
          <a href={`mailto:${SITE.email}`} className="text-brass underline underline-offset-4">{SITE.email}</a>.
        </p>
      </Shell>
    )
  }

  if (state.paymentStatus === 'paid') {
    return (
      <Shell label={`Order ${state.orderRef}`} title="Payment received. We're on it.">
        <p>
          {formatUSD(state.amountTotal)} paid. Stripe has emailed your receipt,
          and an estimator will confirm your order within one business hour.
        </p>
        <p className="text-sm text-ink-dim">Keep your order reference, {state.orderRef}, for any questions.</p>
        <p className="pt-4"><Link to="/" className={secondary}>Back to home</Link></p>
      </Shell>
    )
  }

  // Bank payments (ACH) can take a few days to clear.
  return (
    <Shell label={`Order ${state.orderRef ?? ''}`} title="Payment is processing.">
      <p>
        Bank payments take a few business days to clear. We will email you
        when it goes through, and your turnaround starts then.
      </p>
    </Shell>
  )
}

/** /order/cancelled?ref=RE-... : the customer backed out of Stripe Checkout. */
export function OrderCancelled() {
  usePageMeta({ title: 'Payment not completed', noindex: true })
  const [params] = useSearchParams()
  const ref = params.get('ref') || ''
  // The server re-checks the order before reopening checkout, so a valid
  // looking ref is enough to offer the button (works from any device).
  const [pending] = useState(() => (/^RE-\d{6}-[A-Z0-9]{4}$/.test(ref) ? ref : null))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function retry() {
    setBusy(true)
    setError('')
    try {
      await startCheckout(pending)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Shell label={ref ? `Order ${ref}` : 'Checkout'} title="Payment not completed.">
      <p>
        You have not been charged. Your order and files are saved, but we
        only start work once the order is paid.
      </p>
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        {pending && (
          <button type="button" onClick={retry} disabled={busy} className={primary}>
            {busy ? 'Opening secure checkout…' : 'Return to payment'}
          </button>
        )}
        <a href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Order ${ref}`)}`} className={secondary}>
          {pending ? 'Email us instead' : 'Email us for a payment link'}
        </a>
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </Shell>
  )
}
