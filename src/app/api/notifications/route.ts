import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications?limit=20&offset=0
 *
 * Paginated notification list for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        from_user:profiles!notifications_from_user_id_fkey(id, name, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[notifications] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({
      notifications: notifications ?? [],
      hasMore: (notifications?.length ?? 0) === limit,
    })
  } catch (err) {
    console.error('[notifications] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
