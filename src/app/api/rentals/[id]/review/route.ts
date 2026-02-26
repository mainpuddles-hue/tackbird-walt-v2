import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (reviewLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { rating, comment } = body

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer 1–5' }, { status: 400 })
    }

    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      return NextResponse.json({ error: 'Comment too long (max 500 characters)' }, { status: 400 })
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

    // Only borrower can review
    if (booking.borrower_id !== user.id) {
      return NextResponse.json({ error: 'Only the borrower can review' }, { status: 403 })
    }

    // Only completed bookings can be reviewed
    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 })
    }

    // Check for existing review
    const { data: existingReview } = await admin
      .from('rental_reviews')
      .select('id')
      .eq('booking_id', id)
      .limit(1)

    if (existingReview && existingReview.length > 0) {
      return NextResponse.json({ error: 'Already reviewed this booking' }, { status: 409 })
    }

    const { error: insertError } = await admin
      .from('rental_reviews')
      .insert({
        booking_id: id,
        reviewer_id: user.id,
        reviewee_id: booking.lender_id,
        rating,
        comment: comment?.trim() || null,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
      }
      console.error('[rentals/review] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rentals/review] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
