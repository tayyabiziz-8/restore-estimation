// Browser side of the order + Stripe flow. Card details never pass through
// this code: our server creates a Checkout page and we redirect to it.
import { getSupabase, ORDER_BUCKET } from './supabaseClient'

const STORAGE_KEY = 're-pending-checkout'

async function postJson(url, payload) {
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('We could not reach our server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

/** Saves the order and returns { ref, payable, amount, uploads }. */
export function createOrder(payload) {
  return postJson('/api/orders', payload)
}

/**
 * Uploads files straight to private storage using the one-time signed
 * tokens from createOrder. Runs 3 at a time and retries each file twice.
 * Returns the list of files that still failed.
 */
export async function uploadFiles(jobs, onProgress) {
  const supabase = await getSupabase()
  const failed = []
  let done = 0
  let next = 0

  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++]
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        const { error } = await supabase.storage
          .from(ORDER_BUCKET)
          .uploadToSignedUrl(job.path, job.token, job.file, { contentType: job.file.type || 'application/octet-stream' })
        ok = !error
        if (error) console.warn('Upload failed', job.file.name, error.message)
      }
      if (!ok) failed.push(job)
      done += 1
      onProgress?.(done, jobs.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(3, jobs.length) }, worker))
  return failed
}

export async function startCheckout(ref) {
  const data = await postJson('/api/create-checkout-session', { ref })
  window.location.assign(data.url)
}

// sessionStorage (this tab only) remembers the order ref so the
// "cancelled" page can reopen checkout.
export function savePendingCheckout(ref) {
  try {
    sessionStorage.setItem(STORAGE_KEY, ref)
  } catch {
    /* storage blocked */
  }
}

export function loadPendingCheckout() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
