import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (authLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Salasanan tulee olla vähintään 8 merkkiä' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return NextResponse.json(
        { error: 'Salasanan vaihto epäonnistui' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'ok' })
  } catch {
    return NextResponse.json(
      { error: 'Salasanan vaihto epäonnistui' },
      { status: 500 }
    )
  }
}
