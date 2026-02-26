'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error('Syötä sähköpostiosoitteesi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setResetSent(true)
    } catch {
      // Always show success for security (don't reveal if email exists)
      setResetSent(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) toast.error('Google-kirjautuminen epäonnistui')
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (error) throw error
        toast.success('Tarkista sähköpostisi vahvistuslinkkiä varten')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kirjautuminen epäonnistui'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Forgot password view
  if (forgotPassword) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <circle cx="16" cy="12" r="8" fill="currentColor" opacity="0.15" />
              <circle cx="16" cy="12" r="4" fill="currentColor" />
              <line x1="16" y1="16" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h1 className="text-2xl font-bold">Salasanan nollaus</h1>
            <p className="text-sm text-muted-foreground text-center">
              Syötä sähköpostiosoitteesi ja lähetämme sinulle nollauslinkin.
            </p>
          </div>

          {resetSent ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <p className="text-sm font-medium">Nollauslinkki lähetetty sähköpostiisi</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tarkista sähköpostisi ja seuraa linkkiä salasanan vaihtamiseksi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false)
                  setResetSent(false)
                }}
                className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Takaisin kirjautumiseen
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Sähköposti</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nimi@esimerkki.fi"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Lähetetään...' : 'Lähetä nollauslinkki'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false)
                  setResetSent(false)
                }}
                className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Takaisin kirjautumiseen
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <circle cx="16" cy="12" r="8" fill="currentColor" opacity="0.15" />
            <circle cx="16" cy="12" r="4" fill="currentColor" />
            <line x1="16" y1="16" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h1 className="text-2xl font-bold">TackBird</h1>
          <p className="text-sm text-muted-foreground">Naapurustosi ilmoitustaulu</p>
        </div>

        {/* Google */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Kirjaudu Googlella
        </Button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            tai
          </span>
        </div>

        {/* Email/Password */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="name">Nimi</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nimesi"
                required={isRegister}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Sähköposti</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nimi@esimerkki.fi"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Salasana</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vähintään 8 merkkiä"
              minLength={8}
              required
            />
            {isRegister && password.length > 0 && (
              <div className="space-y-1 text-xs">
                <p className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                  {password.length >= 8 ? '\u2713' : '\u25CB'} Vähintään 8 merkkiä
                </p>
                <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  {/[A-Z]/.test(password) ? '\u2713' : '\u25CB'} Iso kirjain
                </p>
                <p className={/[0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  {/[0-9]/.test(password) ? '\u2713' : '\u25CB'} Numero
                </p>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? 'Ladataan...'
              : isRegister
                ? 'Rekisteröidy'
                : 'Kirjaudu'}
          </Button>
          {!isRegister && (
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary"
            >
              Unohditko salasanasi?
            </button>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? 'Onko sinulla jo tili?' : 'Eikö sinulla ole tiliä?'}{' '}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {isRegister ? 'Kirjaudu' : 'Rekisteröidy'}
          </button>
        </p>
      </div>
    </div>
  )
}
