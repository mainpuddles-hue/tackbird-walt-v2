import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { globalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** POST /api/ads/[id]/click — Track ad click */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (globalLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const admin = createAdminClient()

    const { data: ad } = await admin
      .from('advertisements')
      .select('clicks')
      .eq('id', id)
      .single()

    if (ad) {
      await admin
        .from('advertisements')
        .update({ clicks: (ad.clicks || 0) + 1 })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ads/click] Error:', err)
    return NextResponse.json({ ok: true }) // Don't fail for click tracking
  }
}
