import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { globalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** POST /api/ads/[id]/impression — Track ad impression (deduplicated per user/day) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (globalLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const userId = body.user_id || null

    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Upsert with ignoreDuplicates to deduplicate per (ad_id, user_id, impression_date)
    const { data, error } = await admin
      .from('ad_impressions')
      .upsert(
        { ad_id: id, user_id: userId, impression_date: today },
        { onConflict: 'ad_id,user_id,impression_date', ignoreDuplicates: true }
      )
      .select()

    // Only increment counter if a new row was actually inserted
    if (!error && data && data.length > 0) {
      const { data: ad } = await admin
        .from('advertisements')
        .select('impressions')
        .eq('id', id)
        .single()

      if (ad) {
        await admin
          .from('advertisements')
          .update({ impressions: (ad.impressions || 0) + 1 })
          .eq('id', id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ads/impression] Error:', err)
    return NextResponse.json({ ok: true }) // Don't fail the page for impression tracking
  }
}
