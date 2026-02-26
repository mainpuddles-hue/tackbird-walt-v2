import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rentalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

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
      .select('*')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.lender_id !== user.id) {
      return NextResponse.json({ error: 'Only the lender can mark as complete' }, { status: 403 })
    }

    if (booking.status !== 'paid') {
      return NextResponse.json({ error: 'Can only complete paid bookings' }, { status: 400 })
    }

    await admin.from('rental_bookings').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', id)

    await admin.from('notifications').insert({
      user_id: booking.borrower_id,
      from_user_id: user.id,
      type: 'rental_completed',
      title: 'Lainaus merkitty palautetuksi',
      body: 'Lainaus on merkitty palautetuksi — voit jättää arvostelun',
      link_type: 'rental',
      link_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rentals/complete] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
