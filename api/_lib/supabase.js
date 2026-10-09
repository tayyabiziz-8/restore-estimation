// Server-side Supabase client. Uses the service role (secret) key, which
// bypasses row-level security, so it must only ever run in /api.
import { createClient } from '@supabase/supabase-js'

export const BUCKET = 'order-files'

let client
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
