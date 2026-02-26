import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AD_DAILY_RATE, AD_DAILY_RATE_PRO } from '@/lib/stripe'
import { adLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** POST /api/ads — Create a new ad campaign (draft) */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (adLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_business, is_pro')
      .eq('id', user.id)
      .single()

    if (!profile?.is_business) {
      return NextResponse.json({ error: 'Business account required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, image_url, link_url, cta_text, target_naapurusto, start_date, end_date } = body

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length < 2 || title.length > 100) {
      return NextResponse.json({ error: 'Title must be 2–100 characters' }, { status: 400 })
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.length > 500) {
      return NextResponse.json({ error: 'Description must be 10–500 characters' }, { status: 400 })
    }

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 })
    }

    const startMs = new Date(start_date).getTime()
    const endMs = new Date(end_date).getTime()

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    const days = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24))
    if (days < 3 || days > 30) {
      return NextResponse.json({ error: 'Campaign duration must be 3–30 days' }, { status: 400 })
    }

    if (link_url && typeof link_url === 'string') {
      try {
        new URL(link_url)
      } catch {
        return NextResponse.json({ error: 'Invalid link URL' }, { status: 400 })
      }
    }

    const dailyRate = profile.is_pro ? AD_DAILY_RATE_PRO : AD_DAILY_RATE
    const totalCost = Math.round(days * dailyRate * 100) / 100

    const { data: ad, error: insertError } = await admin
      .from('advertisements')
      .insert({
        advertiser_id: user.id,
        title: title.trim(),
        description: description.trim(),
        image_url: image_url || null,
        link_url: link_url || null,
        cta_text: cta_text?.trim() || 'Lue lisää',
        target_naapurusto: target_naapurusto || null,
        daily_rate: dailyRate,
        start_date,
        end_date,
        total_cost: totalCost,
        status: 'draft',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[ads] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ad })
  } catch (err) {
    console.error('[ads] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
