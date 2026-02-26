import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** PUT /api/ads/[id] — Edit ad campaign (draft only) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (adLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: ad } = await admin
      .from('advertisements')
      .select('*')
      .eq('id', id)
      .single()

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    if (ad.advertiser_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (ad.status !== 'draft') {
      return NextResponse.json({ error: 'Can only edit draft campaigns' }, { status: 400 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 2 || body.title.length > 100) {
        return NextResponse.json({ error: 'Title must be 2–100 characters' }, { status: 400 })
      }
      updates.title = body.title.trim()
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length < 10 || body.description.length > 500) {
        return NextResponse.json({ error: 'Description must be 10–500 characters' }, { status: 400 })
      }
      updates.description = body.description.trim()
    }

    if (body.image_url !== undefined) updates.image_url = body.image_url || null
    if (body.link_url !== undefined) {
      if (body.link_url) {
        try { new URL(body.link_url) } catch {
          return NextResponse.json({ error: 'Invalid link URL' }, { status: 400 })
        }
      }
      updates.link_url = body.link_url || null
    }
    if (body.cta_text !== undefined) updates.cta_text = body.cta_text?.trim() || 'Lue lisää'
    if (body.target_naapurusto !== undefined) updates.target_naapurusto = body.target_naapurusto || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('advertisements')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      console.error('[ads/edit] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ads/edit] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
