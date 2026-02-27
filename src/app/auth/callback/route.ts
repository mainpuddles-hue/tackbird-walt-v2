import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function sanitizeRedirect(next: string | null): string {
  if (!next) return '/'
  // Only allow relative paths — block protocol-relative URLs, absolute URLs, and scheme injection
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return '/'
  }
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeRedirect(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
