// Browser Supabase client, loaded on demand (dynamic import) so the public
// pages do not ship the library until someone uploads files or opens /admin.
// The URL and anon (publishable) key are public by design: row-level
// security in supabase/schema.sql decides what they can reach.
let clientPromise

export function getSupabase() {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set')
    return createClient(url, key)
  })
  return clientPromise
}

export const ORDER_BUCKET = 'order-files'
