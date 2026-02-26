import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, DEV_MODE, APP_URL, eurosToCents } from '@/lib/stripe'
import { rentalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (rentalLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: booking } = await admin
      .from('rental_bookings')
      .select('*, post:posts(title)')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.borrower_id !== user.id) {
      return NextResponse.json({ error: 'Only the borrower can pay' }, { status: 403 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking must be confirmed before payment' }, { status: 400 })
    }

    // Dev mode — instant payment
    if (DEV_MODE) {
      await admin.from('rental_bookings').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: 'dev_pi_' + id,
      }).eq('id', id)

      return NextResponse.json({ url: `${APP_URL}?rental=success`, dev_mode: true })
    }

    // Get lender's Connect account
    const { data: lender } = await admin
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarded')
      .eq('id', booking.lender_id)
      .single()

    if (!lender?.stripe_connect_onboarded || !lender.stripe_connect_account_id) {
      return NextResponse.json({ error: 'Lender has not set up payments' }, { status: 400 })
    }

    const postData = booking.post as unknown as { title: string } | null
    const postTitle = postData?.title || 'Lainaus'

    // Destination charges: borrower pays total, platform takes commission, lender gets rest
    const session = await stripe!.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Lainaus: ${postTitle}` },
          unit_amount: eurosToCents(Number(booking.total_fee)),
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: eurosToCents(Number(booking.platform_commission)),
        transfer_data: {
          destination: lender.stripe_connect_account_id,
        },
      },
      success_url: `${APP_URL}?rental=success`,
      cancel_url: `${APP_URL}?rental=cancelled`,
      metadata: { booking_id: id, tackbird_user_id: user.id, type: 'rental' },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[rentals/pay] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
