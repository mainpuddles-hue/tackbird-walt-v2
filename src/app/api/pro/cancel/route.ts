import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_pro, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pro) {
      return NextResponse.json({ error: 'Not a Pro user' }, { status: 400 })
    }

    // Dev mode — immediate deactivation
    if (DEV_MODE || !profile.stripe_subscription_id || profile.stripe_subscription_id.startsWith('dev_')) {
      await admin.from('profiles').update({
        is_pro: false,
        stripe_subscription_id: null,
        pro_expires_at: null,
      }).eq('id', user.id)

      await admin.from('user_badges').delete()
        .eq('user_id', user.id)
        .eq('badge_type', 'pro')

      return NextResponse.json({ ok: true, dev_mode: true })
    }

    // Cancel at period end (user keeps Pro until expiry)
    await stripe!.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pro/cancel] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
