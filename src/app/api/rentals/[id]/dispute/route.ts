import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rentalLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (rentalLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 })
    }

    if (reason.length > 1000) {
      return NextResponse.json({ error: 'Reason too long (max 1000 characters)' }, { status: 400 })
    }

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

    if (booking.lender_id !== user.id && booking.borrower_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (!['paid', 'completed'].includes(booking.status)) {
      return NextResponse.json({ error: 'Can only dispute paid or completed bookings' }, { status: 400 })
    }

    await admin.from('rental_bookings').update({
      status: 'disputed',
      dispute_reason: reason.trim(),
      disputed_at: new Date().toISOString(),
    }).eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rentals/dispute] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
