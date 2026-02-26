import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE() {
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

    // Delete all user data in order (respecting potential FK constraints)
    // 1. Delete saved posts
    await supabaseAdmin.from('saved_posts').delete().eq('user_id', userId)

    // 2. Delete blocked users (both directions)
    await supabaseAdmin.from('blocked_users').delete().eq('blocker_id', userId)

    // 3. Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId)

    // 4. Delete reviews
    await supabaseAdmin.from('reviews').delete().eq('reviewer_id', userId)

    // 5. Delete messages
    await supabaseAdmin.from('messages').delete().eq('sender_id', userId)

    // 6. Delete posts
    await supabaseAdmin.from('posts').delete().eq('user_id', userId)

    // 7. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 8. Delete auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError)
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Account deletion error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
