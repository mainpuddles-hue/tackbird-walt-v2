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

    const admin = createAdminClient()
    const { data: ads, error } = await admin
      .from('advertisements')
      .select('*')
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ads/mine] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
    }

    return NextResponse.json({ ads: ads || [] })
  } catch (err) {
    console.error('[ads/mine] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
