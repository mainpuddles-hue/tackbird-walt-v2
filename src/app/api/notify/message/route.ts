import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sendNewMessageEmail } from '@/lib/email'

// ---------------------------------------------------------------------------
// Throttle: max 1 email per conversation per hour (in-memory)
// ---------------------------------------------------------------------------

const throttleMap = new Map<string, number>()
const THROTTLE_MS = 60 * 60 * 1000 // 1 hour

function isThrottled(conversationKey: string): boolean {
  const lastSent = throttleMap.get(conversationKey)
  if (lastSent && Date.now() - lastSent < THROTTLE_MS) {
    return true
  }
  return false
}

function markSent(conversationKey: string): void {
  throttleMap.set(conversationKey, Date.now())

  // Cleanup old entries periodically (keep map from growing unbounded)
  if (throttleMap.size > 10_000) {
    const cutoff = Date.now() - THROTTLE_MS
    for (const [key, ts] of throttleMap) {
      if (ts < cutoff) throttleMap.delete(key)
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/notify/message
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, senderName, preview, conversationId } = body

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

    // Throttle check (per conversation or per recipient if no conversationId)
    const throttleKey = conversationId
      ? `conv:${conversationId}`
      : `pair:${user.id}:${recipientId}`

    if (isThrottled(throttleKey)) {
      return NextResponse.json({ ok: true, throttled: true })
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
      // No email on file or profile not found — silently succeed
      return NextResponse.json({ ok: true, skipped: 'no_email' })
    }

    // Respect user's notification preference
    if (profile.notifications_enabled === false) {
      return NextResponse.json({ ok: true, skipped: 'notifications_disabled' })
    }

    // Send and mark throttle
    markSent(throttleKey)

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
