import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
      return NextResponse.json({ onboarded: true })
    }

    // Check with Stripe if account became ready
    if (profile.stripe_connect_account_id && stripe && !DEV_MODE) {
      try {
        const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id)
        if (account.charges_enabled && account.details_submitted) {
          await admin.from('profiles').update({ stripe_connect_onboarded: true }).eq('id', user.id)
          return NextResponse.json({ onboarded: true })
        }
      } catch {
        // Account may not exist
      }
    }

    return NextResponse.json({ onboarded: false })
  } catch (err) {
    console.error('[rentals/connect/status] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
