import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'
import { createLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (createLimiter.isLimited(ip)) return rateLimitResponse()

  try {
    const body = await request.json()
    const { name, naapurusto, bio, skip } = body

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

    // Use service role to bypass RLS for profile upsert
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (skip) {
      // Skip onboarding — just mark as completed
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      if (error) {
        console.error('Onboarding skip error:', error)
        return NextResponse.json({ error: 'Failed to skip onboarding' }, { status: 500 })
      }
    } else {
      // Full onboarding — update profile with user data
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          name: name || 'Käyttäjä',
          naapurusto: naapurusto || 'Kallio',
          bio: bio || '',
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Onboarding save error:', error)
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
      }

      // Fire-and-forget welcome email (don't block the response)
      if (user.email) {
        sendWelcomeEmail(user.email, name || 'Käyttäjä').catch((err) =>
          console.error('[onboarding] Welcome email failed:', err)
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Onboarding API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
