import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (adLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: ad } = await admin
      .from('advertisements')
      .select('advertiser_id, status')
      .eq('id', id)
      .single()

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    if (ad.advertiser_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (ad.status !== 'active') {
      return NextResponse.json({ error: 'Can only pause active campaigns' }, { status: 400 })
    }

    await admin.from('advertisements').update({ status: 'paused' }).eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ads/pause] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
