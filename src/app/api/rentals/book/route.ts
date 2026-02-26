import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COMMISSION_RATE, COMMISSION_RATE_PRO } from '@/lib/stripe'
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

    const body = await request.json()
    const { post_id, start_date, end_date } = body

    if (!post_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields: post_id, start_date, end_date' }, { status: 400 })
    }

    // Validate dates
    const startMs = new Date(start_date).getTime()
    const endMs = new Date(end_date).getTime()

    if (isNaN(startMs) || isNaN(endMs)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (endMs <= startMs) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const days = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24))
    if (days < 1 || days > 90) {
      return NextResponse.json({ error: 'Duration must be 1–90 days' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get post + verify it's a rental
    const { data: post } = await admin
      .from('posts')
      .select('id, user_id, type, daily_fee, title, is_active')
      .eq('id', post_id)
      .single()

    if (!post || post.type !== 'lainaa' || !post.is_active) {
      return NextResponse.json({ error: 'Post not found or not a rental listing' }, { status: 404 })
    }

    if (post.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot book your own item' }, { status: 400 })
    }

    if (!post.daily_fee || Number(post.daily_fee) <= 0) {
      return NextResponse.json({ error: 'Post has no valid daily fee' }, { status: 400 })
    }

    // Get lender for commission rate
    const { data: lender } = await admin
      .from('profiles')
      .select('is_pro')
      .eq('id', post.user_id)
      .single()

    const commissionRate = lender?.is_pro ? COMMISSION_RATE_PRO : COMMISSION_RATE
    const totalFee = Math.round(days * Number(post.daily_fee) * 100) / 100
    const commission = Math.round(totalFee * commissionRate * 100) / 100

    // Check for overlapping bookings
    const { data: overlap } = await admin
      .from('rental_bookings')
      .select('id')
      .eq('post_id', post_id)
      .in('status', ['pending', 'confirmed', 'paid'])
      .lt('start_date', end_date)
      .gt('end_date', start_date)
      .limit(1)

    if (overlap && overlap.length > 0) {
      return NextResponse.json({ error: 'Dates overlap with an existing booking' }, { status: 409 })
    }

    const { data: booking, error: insertError } = await admin
      .from('rental_bookings')
      .insert({
        post_id,
        lender_id: post.user_id,
        borrower_id: user.id,
        start_date,
        end_date,
        days,
        daily_fee: post.daily_fee,
        total_fee: totalFee,
        platform_commission: commission,
        platform_commission_rate: commissionRate,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Booking already exists for these dates' }, { status: 409 })
      }
      console.error('[rentals/book] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Notify lender
    await admin.from('notifications').insert({
      user_id: post.user_id,
      from_user_id: user.id,
      type: 'rental_request',
      title: 'Uusi lainausvaraus',
      body: `Uusi varaus kohteelle "${post.title}"`,
      link_type: 'rental',
      link_id: booking.id,
    })

    return NextResponse.json({ ok: true, booking })
  } catch (err) {
    console.error('[rentals/book] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
