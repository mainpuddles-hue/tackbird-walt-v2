import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      // Return success even for invalid input (security: don't reveal if email exists)
      return NextResponse.json({ message: 'ok' })
    }

    const supabase = await createClient()

    const { origin } = new URL(request.url)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    // Always return success to prevent email enumeration
    return NextResponse.json({ message: 'ok' })
  } catch {
    // Return success even on error (security)
    return NextResponse.json({ message: 'ok' })
  }
}
