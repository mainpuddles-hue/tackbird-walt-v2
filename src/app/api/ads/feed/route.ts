import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** GET /api/ads/feed — Fetch active ads for feed interleaving */
export async function GET(request: Request) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const url = new URL(request.url)
    const naapurusto = url.searchParams.get('naapurusto')

    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    let query = admin
      .from('advertisements')
      .select('*, advertiser:profiles!advertisements_advertiser_id_fkey(id, name, avatar_url)')
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('impressions', { ascending: true })
      .limit(10)

    // Filter by neighborhood if provided (null target = show everywhere)
    if (naapurusto) {
      query = query.or(`target_naapurusto.is.null,target_naapurusto.eq.${naapurusto}`)
    }

    const { data: ads, error } = await query

    if (error) {
      console.error('[ads/feed] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
    }

    return NextResponse.json({ ads: ads || [] })
  } catch (err) {
    console.error('[ads/feed] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
