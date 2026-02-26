import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, DEV_MODE, APP_URL, STRIPE_PRICE_ID } from '@/lib/stripe'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  if (!STRIPE_PRICE_ID && !DEV_MODE) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_pro, stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.is_pro) {
      return NextResponse.json({ error: 'Already a Pro user' }, { status: 400 })
    }

    // Dev mode — instant activation for 30 days
    if (DEV_MODE) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await admin.from('profiles').update({
        is_pro: true,
        pro_expires_at: expiresAt,
        stripe_subscription_id: 'dev_sub',
      }).eq('id', user.id)

      await admin.from('user_badges').upsert(
        { user_id: user.id, badge_type: 'pro' },
        { onConflict: 'user_id,badge_type' }
      )

      return NextResponse.json({ url: `${APP_URL}?pro=success`, dev_mode: true })
    }

    // Create or reuse Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe!.customers.create({
        email: profile.email || user.email || undefined,
        metadata: { tackbird_user_id: user.id },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe!.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}?pro=success`,
      cancel_url: `${APP_URL}?pro=cancelled`,
      metadata: { tackbird_user_id: user.id, type: 'pro' },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[pro/checkout] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
