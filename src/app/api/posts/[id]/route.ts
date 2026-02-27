import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

/** PUT /api/posts/:id — Update a post (owner only) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  if (createLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { title, description, location, daily_fee, event_date, latitude, longitude } = body

    // Validate
    if (title && title.length > 200) {
      return NextResponse.json({ error: 'Otsikko max 200 merkkiä' }, { status: 400 })
    }
    if (description && description.length > 5000) {
      return NextResponse.json({ error: 'Kuvaus max 5000 merkkiä' }, { status: 400 })
    }
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check ownership
    const { data: post } = await admin.from('posts').select('user_id').eq('id', id).single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Build update object — only include defined fields
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) update.title = title
    if (description !== undefined) update.description = description
    if (location !== undefined) update.location = location
    if (daily_fee !== undefined) update.daily_fee = daily_fee
    if (event_date !== undefined) update.event_date = event_date
    if (latitude !== undefined) update.latitude = latitude
    if (longitude !== undefined) update.longitude = longitude

    const { data: updated, error } = await admin
      .from('posts')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ post: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/posts/:id — Delete a post (owner or admin) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const admin = createAdminClient()

    // Check ownership or admin
    const { data: post } = await admin.from('posts').select('user_id').eq('id', id).single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
    if (post.user_id !== user.id && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete — set is_active = false
    await admin.from('posts').update({ is_active: false }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
