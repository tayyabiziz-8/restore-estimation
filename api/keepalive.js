import { getSupabaseAdmin } from './_lib/supabase.js'
import { json } from './_lib/stripe.js'

/**
 * GET /api/keepalive
 * Called once a day by a Vercel Cron Job (see "crons" in vercel.json).
 * Runs one tiny real database query so the free Supabase project never
 * looks idle and does not get paused after 7 days without activity.
 * Remove the cron once the project is on Supabase Pro (never paused).
 *
 * Vercel sends "Authorization: Bearer <CRON_SECRET>" when the CRON_SECRET
 * env var is set, so random visitors cannot trigger it.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    // Count only, no rows returned: a real query, almost no work.
    const { count, error } = await getSupabaseAdmin()
      .from('orders')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    console.log(`[keepalive] Supabase OK, ${count} orders`)
    return json({ ok: true, at: new Date().toISOString() })
  } catch (err) {
    // A failure here (e.g. the project is already paused) shows up as a
    // red cron run in Vercel and in the function logs.
    console.error('[keepalive] Supabase query failed', err)
    return json({ ok: false, error: String(err.message || err) }, 500)
  }
}
