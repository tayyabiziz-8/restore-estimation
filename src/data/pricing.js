// Single source of truth for prices. Used by the Pricing page, the order
// form summary, AND the server function that creates the Stripe Checkout
// session (api/create-checkout-session.js). The server always recalculates
// from this file, so a price edited in the browser can never be charged.
//
// Amounts are in US cents. `amount: null` means quoted, not payable online.

export const TIERS = [
  {
    id: 'minor',
    code: 'T-01',
    name: 'Minor Loss',
    amount: 8500,
    includedRooms: 1,
    body: 'One affected room or area, single trade scope.',
    features: ['1 room / area', 'Xactimate estimate', 'Photo packet', '48-hr turnaround'],
  },
  {
    id: 'total',
    code: 'T-02',
    name: 'Total Loss',
    amount: 22000,
    includedRooms: 6,
    highlight: true,
    body: 'Multi-room losses with mixed trades. Our standard package for most restoration jobs.',
    features: ['Up to 6 rooms / areas', 'Xactimate estimate + sketch', 'Photo packet', 'Moisture / char log', '48-hr turnaround'],
  },
  {
    id: 'roof',
    code: 'T-03',
    name: 'Roof Damage',
    amount: 15000,
    includedRooms: null,
    body: 'Roof-only losses: shingles, decking, flashing, and any interior water intrusion from the roof.',
    features: ['Full roof measurement', 'Xactimate estimate', 'Photo packet', '48-hr turnaround'],
  },
  {
    id: 'large',
    code: 'T-04',
    name: 'Large Loss',
    amount: null,
    includedRooms: null,
    body: 'Commercial or whole-structure losses. Scoped individually after a brief file review.',
    features: ['Unlimited rooms / areas', 'Full reconstruction takeoff', 'On-call estimator', 'Priority turnaround'],
  },
]

// `checkout: true` add-ons can be chosen on the order form and paid at
// checkout. The others happen after delivery and are billed separately.
export const ADDONS = [
  { id: 'rush', code: 'A-01', label: 'Rush (same-day)', amount: 6000, rate: '+$60', checkout: true },
  { id: 'revision', code: 'A-02', label: 'Estimate revision after carrier pushback', amount: 4000, rate: '$40', checkout: false },
  { id: 'extraRoom', code: 'A-03', label: 'Additional room / area beyond tier', amount: 2500, rate: '$25 ea.', checkout: true },
  { id: 'sketch', code: 'A-04', label: 'Sketch only (no full estimate)', amount: 4500, rate: '$45', checkout: false },
  { id: 'supplement', code: 'A-05', label: 'Supplement to an existing, approved estimate', amount: 6000, rate: '$60', checkout: false },
]

export const MAX_EXTRA_ROOMS = 20

export function getTier(id) {
  return TIERS.find((t) => t.id === id) || null
}

export function getAddon(id) {
  return ADDONS.find((a) => a.id === id)
}

export function isPayableTier(id) {
  const tier = getTier(id)
  return Boolean(tier && tier.amount)
}

export function canAddRooms(id) {
  const tier = getTier(id)
  return Boolean(tier && tier.includedRooms)
}

/**
 * Turn an order selection into priced line items.
 * Returns null if the tier is not payable online (quoted or unknown).
 */
export function buildLineItems({ tierId, rush = false, extraRooms = 0 }) {
  const tier = getTier(tierId)
  if (!tier || !tier.amount) return null

  const items = [{ name: `${tier.name} estimate`, amount: tier.amount, quantity: 1 }]
  if (rush) {
    const a = getAddon('rush')
    items.push({ name: a.label, amount: a.amount, quantity: 1 })
  }
  const rooms = Number.isInteger(extraRooms) ? extraRooms : 0
  if (rooms > 0 && tier.includedRooms) {
    const a = getAddon('extraRoom')
    items.push({ name: a.label, amount: a.amount, quantity: Math.min(rooms, MAX_EXTRA_ROOMS) })
  }
  return items
}

export function totalOf(items) {
  return (items || []).reduce((sum, i) => sum + i.amount * i.quantity, 0)
}

export function formatUSD(cents) {
  const dollars = cents / 100
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}
