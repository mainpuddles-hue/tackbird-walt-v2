import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, DEV_MODE } from '@/lib/stripe'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** Admin-only: refund a disputed rental booking */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Verify admin
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: booking } = await admin
      .from('rental_bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'disputed') {
      return NextResponse.json({ error: 'Can only refund disputed bookings' }, { status: 400 })
    }

    // Process Stripe refund if payment exists
    if (booking.stripe_payment_intent_id && stripe && !DEV_MODE &&
        !booking.stripe_payment_intent_id.startsWith('dev_')) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
        })
      } catch (refundErr) {
        console.error('[rentals/refund] Stripe refund failed:', refundErr)
        return NextResponse.json({ error: 'Stripe refund failed' }, { status: 500 })
      }
    }

    await admin.from('rental_bookings').update({ status: 'refunded' }).eq('id', id)

    // Notify both parties
    await admin.from('notifications').insert([
      {
        user_id: booking.borrower_id,
        from_user_id: user.id,
        type: 'rental_refunded',
        title: 'Varaus hyvitetty',
        body: 'Riitautettu varaus on hyvitetty',
        link_type: 'rental',
        link_id: id,
      },
      {
        user_id: booking.lender_id,
        from_user_id: user.id,
        type: 'rental_refunded',
        title: 'Varaus hyvitetty',
        body: 'Riitautettu varaus on hyvitetty',
        link_type: 'rental',
        link_id: id,
      },
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rentals/refund] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
