import { getStripe, json, siteUrl, ORDER_REF_PATTERN } from './_lib/stripe.js'
import { buildLineItems, isPayableTier, MAX_EXTRA_ROOMS } from '../src/data/pricing.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clip = (value, max) => String(value ?? '').trim().slice(0, max)

/**
 * POST /api/create-checkout-session
 * Body: { orderRef, tierId, rush, extraRooms, name, email, address }
 * Returns: { url } to redirect the browser to Stripe Checkout.
 *
 * Prices are rebuilt here from src/data/pricing.js. Nothing the browser
 * sends can change what is charged except the choice of tier and add-ons.
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const orderRef = clip(body.orderRef, 20)
  const email = clip(body.email, 254)
  const name = clip(body.name, 200)
  const address = clip(body.address, 400)
  const tierId = clip(body.tierId, 20)
  const extraRooms = Number(body.extraRooms ?? 0)

  if (!ORDER_REF_PATTERN.test(orderRef)) return json({ error: 'Invalid order reference.' }, 400)
  if (!EMAIL_PATTERN.test(email)) return json({ error: 'Invalid email address.' }, 400)
  if (!name || !address) return json({ error: 'Name and property address are required.' }, 400)
  if (!isPayableTier(tierId)) return json({ error: 'This tier is quoted and cannot be paid online.' }, 400)
  if (!Number.isInteger(extraRooms) || extraRooms < 0 || extraRooms > MAX_EXTRA_ROOMS) {
    return json({ error: 'Invalid number of extra rooms.' }, 400)
  }

  const items = buildLineItems({
    tierId,
    rush: body.rush === true,
    extraRooms,
  })

  const metadata = {
    order_ref: orderRef,
    customer_name: name,
    property_address: address,
    tier: tierId,
  }

  try {
    const stripe = getStripe()
    const base = siteUrl(request)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      client_reference_id: orderRef,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: item.amount,
          product_data: { name: item.name },
        },
      })),
      metadata,
      payment_intent_data: {
        description: `Estimate order ${orderRef}, ${address}`.slice(0, 1000),
        metadata,
      },
      success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/order/cancelled?ref=${encodeURIComponent(orderRef)}`,
    })
    return json({ url: session.url })
  } catch (err) {
    console.error('Checkout session failed', err)
    return json({ error: 'Payment could not be started. Please try again.' }, 500)
  }
}
