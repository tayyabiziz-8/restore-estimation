import { getStripe, json, siteUrl, ORDER_REF_PATTERN } from './_lib/stripe.js'
import { getSupabaseAdmin } from './_lib/supabase.js'
import { buildLineItems } from '../src/data/pricing.js'

/**
 * POST /api/create-checkout-session
 * Body: { ref }   (the order must already exist, created by /api/orders)
 * Returns: { url } of a Stripe Checkout page.
 *
 * Everything that is charged comes from the saved order and
 * src/data/pricing.js, never from the browser.
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  const ref = String(body.ref ?? '').trim()
  if (!ORDER_REF_PATTERN.test(ref)) return json({ error: 'Invalid order reference.' }, 400)

  try {
    const supabase = getSupabaseAdmin()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, ref, status, name, email, address, tier, urgency, extra_rooms')
      .eq('ref', ref)
      .maybeSingle()
    if (error) throw error
    if (!order) return json({ error: 'Order not found.' }, 404)
    if (order.status === 'paid' || order.status === 'in_progress' || order.status === 'delivered') {
      return json({ error: 'This order is already paid.' }, 409)
    }
    if (!['awaiting_payment', 'payment_failed'].includes(order.status)) {
      return json({ error: 'This order cannot be paid online. Please email us.' }, 409)
    }

    const items = buildLineItems({ tierId: order.tier, rush: order.urgency === 'rush', extraRooms: order.extra_rooms })
    if (!items) return json({ error: 'This order is quoted and cannot be paid online.' }, 409)

    const metadata = { order_ref: order.ref, order_id: order.id, property_address: order.address.slice(0, 450) }
    const base = siteUrl(request)
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: order.email,
      client_reference_id: order.ref,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: { currency: 'usd', unit_amount: item.amount, product_data: { name: item.name } },
      })),
      metadata,
      payment_intent_data: {
        description: `Estimate order ${order.ref}, ${order.address}`.slice(0, 1000),
        metadata,
      },
      success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/order/cancelled?ref=${encodeURIComponent(order.ref)}`,
    })

    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)
    return json({ url: session.url })
  } catch (err) {
    console.error('Checkout session failed', err)
    return json({ error: 'Payment could not be started. Please try again.' }, 500)
  }
}
