// Options shared by the order form (browser) and api/orders.js (server),
// so the server can reject anything the form could not have sent.

export const LOSS_TYPES = [
  'Water damage',
  'Fire & smoke',
  'Roof damage',
  'Mold remediation',
  'Reconstruction takeoff',
  'Estimate review / audit',
  'Other',
]

export const URGENCY = [
  { value: 'standard', label: 'Standard (48 hrs)' },
  { value: 'rush', label: 'Rush, same day (+$60)' },
]

// File upload fields. `max` = files per field.
export const FILE_FIELDS = [
  { kind: 'scope_notes', input: 'scope_notes_file', label: 'Scope notes', max: 3 },
  { kind: 'measurements', input: 'measurements_file', label: 'Measurements', max: 5 },
  { kind: 'image', input: 'images', label: 'Images', max: 40 },
]

// Supabase free plan caps a single upload at 50 MB.
export const MAX_FILE_BYTES = 50 * 1024 * 1024

export const ORDER_STATUSES = [
  { id: 'paid', label: 'Paid, ready to start', tone: 'action' },
  { id: 'quote_requested', label: 'Quote requested', tone: 'action' },
  { id: 'in_progress', label: 'In progress', tone: 'progress' },
  { id: 'delivered', label: 'Delivered', tone: 'done' },
  { id: 'awaiting_payment', label: 'Awaiting payment', tone: 'muted' },
  { id: 'payment_processing', label: 'Payment processing', tone: 'muted' },
  { id: 'payment_failed', label: 'Payment failed', tone: 'alert' },
  { id: 'cancelled', label: 'Cancelled', tone: 'muted' },
  { id: 'refunded', label: 'Refunded', tone: 'muted' },
]

export function statusLabel(id) {
  return ORDER_STATUSES.find((s) => s.id === id)?.label || id
}
