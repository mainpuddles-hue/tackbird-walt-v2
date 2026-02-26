import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sendNewMessageEmail } from '@/lib/email'
import { messageLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// POST /api/notify/message
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (messageLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const body = await request.json()
    const { recipientId, senderName, preview } = body

    if (!recipientId || !senderName || !preview) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, senderName, preview' },
        { status: 400 }
      )
    }

    // Authenticate the caller
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

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up recipient's email using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, notifications_enabled')
      .eq('id', recipientId)
      .single()

    if (profileError || !profile?.email) {
      return NextResponse.json({ ok: true, skipped: 'no_email' })
    }

    if (profile.notifications_enabled === false) {
      return NextResponse.json({ ok: true, skipped: 'notifications_disabled' })
    }

    // Throttle: check if a 'message' notification was sent to this user in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentNotification } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', recipientId)
      .eq('type', 'message')
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (recentNotification && recentNotification.length > 0) {
      return NextResponse.json({ ok: true, throttled: true })
    }

    sendNewMessageEmail(profile.email, {
      senderName,
      preview: typeof preview === 'string' ? preview : String(preview),
    }).catch((err) =>
      console.error('[notify/message] Email send failed:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify/message] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
