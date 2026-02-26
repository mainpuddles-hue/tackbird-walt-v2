import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rentalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { sendBookingCancellation } from '@/lib/email'

export async function PUT(
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

    if (booking.lender_id !== user.id && booking.borrower_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (['completed', 'cancelled', 'refunded'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot cancel this booking' }, { status: 400 })
    }

    await admin.from('rental_bookings').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('id', id)

    // Notify the other party
    const otherId = booking.lender_id === user.id ? booking.borrower_id : booking.lender_id
    await admin.from('notifications').insert({
      user_id: otherId,
      from_user_id: user.id,
      type: 'rental_cancelled',
      title: 'Varaus peruutettu',
      body: 'Lainausvaraus on peruutettu',
      link_type: 'rental',
      link_id: id,
    })

    // Send cancellation email
    const { data: otherProfile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', otherId)
      .single()

    if (otherProfile?.email) {
      const postData = booking.post as unknown as { title: string } | null
      sendBookingCancellation(otherProfile.email, {
        postTitle: postData?.title || 'Lainaus',
      }).catch((err: unknown) => console.error('[rental/cancel] Email failed:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rentals/cancel] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
