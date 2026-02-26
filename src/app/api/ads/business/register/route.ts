import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** POST /api/ads/business/register — Register as business account */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business_name, business_vat_id } = body

    if (!business_name || typeof business_name !== 'string' || business_name.trim().length < 2 || business_name.length > 100) {
      return NextResponse.json({ error: 'Business name must be 2–100 characters' }, { status: 400 })
    }

    // VAT ID is optional but validate format if provided
    if (business_vat_id && typeof business_vat_id === 'string' && business_vat_id.length > 30) {
      return NextResponse.json({ error: 'VAT ID too long' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({
        is_business: true,
        business_name: business_name.trim(),
        business_vat_id: business_vat_id?.trim() || null,
      })
      .eq('id', user.id)

    if (error) {
      console.error('[ads/business/register] Update error:', error)
      return NextResponse.json({ error: 'Failed to register business' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ads/business/register] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
