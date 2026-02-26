import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get current user from session cookies (anon key)
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = user.id

    // Fetch all user data in parallel
    const [
      profileResult,
      postsResult,
      messagesResult,
      reviewsResult,
      savedPostsResult,
      notificationsResult,
      blockedUsersResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('posts').select('*').eq('user_id', userId),
      supabaseAdmin.from('messages').select('*').eq('sender_id', userId),
      supabaseAdmin.from('reviews').select('*').eq('reviewer_id', userId),
      supabaseAdmin.from('saved_posts').select('*').eq('user_id', userId),
      supabaseAdmin.from('notifications').select('*').eq('user_id', userId),
      supabaseAdmin.from('blocked_users').select('*').eq('blocker_id', userId),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      email: user.email,
      profile: profileResult.data,
      posts: postsResult.data ?? [],
      messages: messagesResult.data ?? [],
      reviews: reviewsResult.data ?? [],
      saved_posts: savedPostsResult.data ?? [],
      notifications: notificationsResult.data ?? [],
      blocked_users: blockedUsersResult.data ?? [],
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="tackbird-data-export.json"',
      },
    })
  } catch (err) {
    console.error('GDPR export error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
