import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, DEV_MODE, APP_URL, eurosToCents } from '@/lib/stripe'
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
      .select('*')
      .eq('id', id)
      .single()

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    if (ad.advertiser_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (ad.status !== 'draft') {
      return NextResponse.json({ error: 'Can only pay for draft campaigns' }, { status: 400 })
    }

    // Dev mode — instant activation
    if (DEV_MODE) {
      await admin.from('advertisements').update({
        status: 'active',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: 'dev_pi_ad_' + id,
      }).eq('id', id)

      return NextResponse.json({ url: `${APP_URL}?ad=success`, dev_mode: true })
    }

    const session = await stripe!.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Mainoskampanja: ${ad.title}` },
          unit_amount: eurosToCents(Number(ad.total_cost)),
        },
        quantity: 1,
      }],
      success_url: `${APP_URL}?ad=success`,
      cancel_url: `${APP_URL}?ad=cancelled`,
      metadata: { ad_id: id, tackbird_user_id: user.id, type: 'ad' },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[ads/pay] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
