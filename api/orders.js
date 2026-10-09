import { getSupabaseAdmin, BUCKET } from './_lib/supabase.js'
import { json, siteUrl, newOrderRef } from './_lib/stripe.js'
import { sendAlert, adminLink } from './_lib/alert.js'
import { TIERS, buildLineItems, totalOf, isPayableTier, canAddRooms, getTier, formatUSD, MAX_EXTRA_ROOMS } from '../src/data/pricing.js'
import { LOSS_TYPES, URGENCY, FILE_FIELDS, MAX_FILE_BYTES } from '../src/data/orderOptions.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIER_IDS = [...TIERS.map((t) => t.id), 'unsure']
const URGENCY_IDS = URGENCY.map((u) => u.value)
const clip = (v, max) => String(v ?? '').trim().slice(0, max)

// Keeps the original name readable but safe as a storage path segment.
function safeName(name) {
  const cleaned = String(name).normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_')
  return cleaned.slice(-100) || 'file'
}

/**
 * POST /api/orders
 * Creates the order row (status awaiting_payment, or quote_requested for
 * quoted tiers), records the files the customer is about to upload, and
 * returns one signed upload URL per file. The browser then uploads each
 * file straight to the private storage bucket.
 *
 * Body: { name, email, address, lossType, tier, urgency, extraRooms,
 *         scopeNotes, photoLink, details, consent: true, website (honeypot),
 *         files: [{ kind, name, size, type }] }
 * Returns: { ref, payable, amount, uploads: [{ path, token }] } (same order as files)
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  if (body.website) return json({ error: 'Invalid request.' }, 400) // honeypot

  const order = {
    name: clip(body.name, 200),
    email: clip(body.email, 254),
    address: clip(body.address, 400),
    loss_type: clip(body.lossType, 60),
    tier: clip(body.tier, 20),
    urgency: clip(body.urgency, 20),
    extra_rooms: Number(body.extraRooms ?? 0),
    scope_notes: clip(body.scopeNotes, 10000) || null,
    photo_link: clip(body.photoLink, 2000) || null,
    details: clip(body.details, 5000) || null,
  }

  if (!order.name || !order.address) return json({ error: 'Name and property address are required.' }, 400)
  if (!EMAIL_PATTERN.test(order.email)) return json({ error: 'Please enter a valid email address.' }, 400)
  if (!LOSS_TYPES.includes(order.loss_type)) return json({ error: 'Invalid loss type.' }, 400)
  if (!TIER_IDS.includes(order.tier)) return json({ error: 'Please choose a tier.' }, 400)
  if (!URGENCY_IDS.includes(order.urgency)) return json({ error: 'Invalid turnaround.' }, 400)
  if (body.consent !== true) return json({ error: 'Please accept the terms to place your order.' }, 400)
  if (!Number.isInteger(order.extra_rooms) || order.extra_rooms < 0 || order.extra_rooms > MAX_EXTRA_ROOMS) {
    return json({ error: 'Invalid number of extra rooms.' }, 400)
  }
  if (!canAddRooms(order.tier)) order.extra_rooms = 0

  // Files: validate the list the browser is about to upload.
  const files = Array.isArray(body.files) ? body.files : []
  const perKind = {}
  for (const f of files) {
    const field = FILE_FIELDS.find((x) => x.kind === f?.kind)
    if (!field) return json({ error: 'Invalid file type.' }, 400)
    perKind[f.kind] = (perKind[f.kind] || 0) + 1
    if (perKind[f.kind] > field.max) return json({ error: `Too many ${field.label.toLowerCase()} files (max ${field.max}).` }, 400)
    if (!Number.isFinite(f.size) || f.size <= 0 || f.size > MAX_FILE_BYTES) {
      return json({ error: `${clip(f.name, 80)} is larger than 50 MB.` }, 400)
    }
  }
  if (!perKind.image && !order.photo_link) {
    return json({ error: 'Please attach at least one image, or add a link to your photos.' }, 400)
  }

  const payable = isPayableTier(order.tier)
  order.amount_cents = payable
    ? totalOf(buildLineItems({ tierId: order.tier, rush: order.urgency === 'rush', extraRooms: order.extra_rooms }))
    : null
  order.status = payable ? 'awaiting_payment' : 'quote_requested'
  order.consent_at = new Date().toISOString()

  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (err) {
    console.error(err)
    return json({ error: 'Orders are temporarily unavailable. Please email us.' }, 503)
  }

  // Insert, retrying on the (very unlikely) chance of a duplicate ref.
  let saved
  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    const { data, error } = await supabase.from('orders').insert({ ...order, ref: newOrderRef() }).select('id, ref').single()
    if (!error) saved = data
    else if (error.code !== '23505') {
      console.error('Order insert failed', error)
      return json({ error: 'We could not save your order. Please try again.' }, 500)
    }
  }
  if (!saved) return json({ error: 'We could not save your order. Please try again.' }, 500)

  // File rows + signed upload URLs (valid for 2 hours, one use each).
  const fileRows = files.map((f, i) => ({
    order_id: saved.id,
    kind: f.kind,
    name: clip(f.name, 200) || 'file',
    size: f.size,
    content_type: clip(f.type, 100) || null,
    path: `${saved.id}/${f.kind}/${String(i + 1).padStart(2, '0')}-${safeName(f.name)}`,
  }))

  const uploads = []
  if (fileRows.length) {
    const { error } = await supabase.from('order_files').insert(fileRows)
    if (error) {
      console.error('File rows insert failed', error)
      return json({ error: 'We could not prepare your uploads. Please try again.' }, 500)
    }
    for (const row of fileRows) {
      const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(row.path)
      if (signError) {
        console.error('Signed upload URL failed', signError)
        return json({ error: 'We could not prepare your uploads. Please try again.' }, 500)
      }
      uploads.push({ path: data.path, token: data.token })
    }
  }

  // Quotes need a human now. Paid orders alert from the Stripe webhook.
  if (!payable) {
    const tier = getTier(order.tier)
    let base = ''
    try {
      base = siteUrl(request)
    } catch { /* link omitted */ }
    await sendAlert({
      subject: `Quote request ${saved.ref}: ${tier ? tier.name : 'Not sure yet'}`,
      replyTo: order.email,
      message: [
        `New quote request ${saved.ref}`,
        '',
        `Customer: ${order.name} (${order.email})`,
        `Property: ${order.address}`,
        `Loss type: ${order.loss_type}`,
        `Tier: ${tier ? tier.name : 'Not sure yet'}`,
        `Files: ${fileRows.length}${order.photo_link ? ', plus photo link' : ''}`,
        '',
        base ? `Open in admin: ${adminLink(base, saved.ref)}` : '',
      ].join('\n'),
    })
  }

  return json({
    ref: saved.ref,
    payable,
    amount: order.amount_cents ? formatUSD(order.amount_cents) : null,
    uploads,
  })
}
