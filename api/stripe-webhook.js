import { getStripe, siteUrl } from './_lib/stripe.js'
import { getSupabaseAdmin } from './_lib/supabase.js'
import { sendAlert, adminLink } from './_lib/alert.js'
import { formatUSD } from '../src/data/pricing.js'

/**
 * POST /api/stripe-webhook
 * The only trustworthy "paid" signal. Updates the order in the database,
 * then emails the office. The status change doubles as de-duplication:
 * Stripe may deliver an event twice, but only the first one changes the
 * row, so only one alert goes out.
 */
export async function POST(request) {
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text() // raw text is required for the signature check

  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature check failed', err.message)
    return new Response('Invalid signature', { status: 400 })
  }

  const session = event.data.object
  const ref = session.client_reference_id || session.metadata?.order_ref
  let change = null

  switch (event.type) {
    case 'checkout.session.completed':
      change = session.payment_status === 'paid'
        ? { to: 'paid', from: ['awaiting_payment', 'payment_failed', 'payment_processing'], alert: 'PAID, start work' }
        : { to: 'payment_processing', from: ['awaiting_payment', 'payment_failed'], alert: null } // bank debit, clears later
      break
    case 'checkout.session.async_payment_succeeded':
      change = { to: 'paid', from: ['awaiting_payment', 'payment_processing', 'payment_failed'], alert: 'PAID (bank payment cleared), start work' }
      break
    case 'checkout.session.async_payment_failed':
      change = { to: 'payment_failed', from: ['awaiting_payment', 'payment_processing'], alert: 'Bank payment FAILED, contact the customer' }
      break
    default:
      return Response.json({ received: true, ignored: event.type })
  }
  if (!ref) return Response.json({ received: true, ignored: 'no order ref' })

  const update = { status: change.to, stripe_session_id: session.id, stripe_livemode: session.livemode }
  if (session.payment_intent) update.stripe_payment_intent = session.payment_intent
  if (change.to === 'paid') update.paid_at = new Date().toISOString()

  let rows
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .update(update)
      .eq('ref', ref)
      .in('status', change.from)
      .select('ref, name, email, address, amount_cents')
    if (error) throw error
    rows = data
  } catch (err) {
    // 500 makes Stripe retry later, so a database hiccup loses nothing.
    console.error('Order update failed', err)
    return new Response('Database update failed', { status: 500 })
  }

  if (rows.length && change.alert) {
    const o = rows[0]
    let base = ''
    try {
      base = siteUrl(request)
    } catch { /* link omitted */ }
    await sendAlert({
      subject: `${change.alert}: order ${o.ref}`,
      replyTo: o.email,
      message: [
        `Order ${o.ref}: ${change.alert}`,
        `Amount: ${formatUSD(session.amount_total ?? o.amount_cents ?? 0)}`,
        '',
        `Customer: ${o.name} (${o.email})`,
        `Property: ${o.address}`,
        '',
        base ? `Open in admin: ${adminLink(base, o.ref)}` : '',
      ].join('\n'),
    })
  }

  return Response.json({ received: true, updated: rows.length })
}
