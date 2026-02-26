import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, DEV_MODE } from '@/lib/stripe'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pro || !profile.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription to reactivate' }, { status: 400 })
    }

    if (DEV_MODE || profile.stripe_subscription_id.startsWith('dev_')) {
      return NextResponse.json({ ok: true, dev_mode: true })
    }

    await stripe!.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pro/reactivate] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
