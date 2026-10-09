// Shared server helpers. Files in folders starting with "_" are not turned
// into endpoints by Vercel, so this is safe to import from the functions.
import Stripe from 'stripe'

let client
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return client
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Where Stripe sends people back to. In production this MUST come from the
// SITE_URL env var, never from the request, so nobody can redirect a
// payment flow to another domain.
export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_ENV === 'production') throw new Error('SITE_URL is not set')
  return new URL(request.url).origin
}

export const ORDER_REF_PATTERN = /^RE-\d{6}-[A-Z0-9]{4}$/

// Server-generated order reference, e.g. RE-261007-K7QZ.
// No 0/O/1/I so it reads cleanly over the phone.
export function newOrderRef(date = new Date()) {
  const yymmdd = date.toISOString().slice(2, 10).replaceAll('-', '')
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return `RE-${yymmdd}-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`
}
