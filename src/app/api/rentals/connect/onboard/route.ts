import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, DEV_MODE, APP_URL } from '@/lib/stripe'
import { rentalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (rentalLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarded')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.stripe_connect_onboarded) {
      return NextResponse.json({ error: 'Already onboarded' }, { status: 400 })
    }

    // Dev mode — instant onboarding
    if (DEV_MODE) {
      await admin.from('profiles').update({
        stripe_connect_account_id: 'dev_connect',
        stripe_connect_onboarded: true,
      }).eq('id', user.id)

      return NextResponse.json({ url: `${APP_URL}?connect=success`, dev_mode: true })
    }

    // Create or reuse Connect account
    let accountId = profile.stripe_connect_account_id
    if (!accountId) {
      const account = await stripe!.accounts.create({
        type: 'express',
        country: 'FI',
        metadata: { tackbird_user_id: user.id },
      })
      accountId = account.id
      await admin.from('profiles').update({ stripe_connect_account_id: accountId }).eq('id', user.id)
    }

    const accountLink = await stripe!.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${APP_URL}?connect=refresh`,
      return_url: `${APP_URL}?connect=success`,
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('[rentals/connect/onboard] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
