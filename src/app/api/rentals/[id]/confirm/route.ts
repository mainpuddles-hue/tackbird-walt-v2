import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rentalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { sendBookingConfirmation } from '@/lib/email'

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

    if (booking.lender_id !== user.id) {
      return NextResponse.json({ error: 'Only the lender can confirm' }, { status: 403 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Can only confirm pending bookings' }, { status: 400 })
    }

    await admin.from('rental_bookings').update({ status: 'confirmed' }).eq('id', id)

    // Notify borrower
    await admin.from('notifications').insert({
      user_id: booking.borrower_id,
      from_user_id: user.id,
      type: 'rental_confirmed',
      title: 'Varaus vahvistettu',
      body: 'Varauksesi on vahvistettu — voit nyt maksaa',
      link_type: 'rental',
      link_id: id,
    })

    // Send confirmation email
    const { data: borrower } = await admin
      .from('profiles')
      .select('email')
      .eq('id', booking.borrower_id)
      .single()

    if (borrower?.email) {
      const postData = booking.post as unknown as { title: string } | null
      sendBookingConfirmation(borrower.email, {
        postTitle: postData?.title || 'Lainaus',
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalFee: Number(booking.total_fee),
      }).catch((err: unknown) => console.error('[rental/confirm] Email failed:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rentals/confirm] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
