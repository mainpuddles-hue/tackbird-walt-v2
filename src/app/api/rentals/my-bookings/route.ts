import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

    const admin = createAdminClient()

    const { data: bookings, error } = await admin
      .from('rental_bookings')
      .select(`
        *,
        post:posts(id, title, image_url, daily_fee),
        lender:profiles!rental_bookings_lender_id_fkey(id, name, avatar_url),
        borrower:profiles!rental_bookings_borrower_id_fkey(id, name, avatar_url)
      `)
      .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[rentals/my-bookings] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings: bookings || [] })
  } catch (err) {
    console.error('[rentals/my-bookings] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
