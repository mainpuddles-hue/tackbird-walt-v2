import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, DEV_MODE } from '@/lib/stripe'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: Request) {
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
      .select('is_pro, pro_expires_at, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let cancelAtPeriodEnd = false

    if (profile.stripe_subscription_id && stripe && !DEV_MODE) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id) as unknown as { cancel_at_period_end?: boolean }
        cancelAtPeriodEnd = sub.cancel_at_period_end ?? false
      } catch {
        // Subscription may no longer exist in Stripe
      }
    }

    return NextResponse.json({
      is_pro: profile.is_pro,
      pro_expires_at: profile.pro_expires_at,
      cancel_at_period_end: cancelAtPeriodEnd,
      dev_mode: DEV_MODE,
    })
  } catch (err) {
    console.error('[pro/status] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
