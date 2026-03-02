'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PasswordStrength, isPasswordValid } from '@/components/password-strength'
import { TackBirdLogo } from '@/components/tackbird-logo'
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
      <div
        className="relative flex min-h-dvh flex-col items-center justify-center p-6 bg-[var(--color-background)]"
      >
        {/* Watermark */}
        <div className="absolute top-1/4 opacity-[0.04] pointer-events-none">
          <TackBirdLogo size={160} className="text-foreground" />
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 shadow-[0_4px_24px_rgba(26,26,46,0.06)]">
          <div className="flex flex-col items-center gap-2" style={{ animation: 'fadeIn 0.5s ease both' }}>
            <TackBirdLogo size={48} className="text-primary" />
            <h1 className="text-2xl font-bold">Salasanan nollaus</h1>
            <p className="text-sm text-muted-foreground text-center">
              Syötä sähköpostiosoitteesi ja lähetämme sinulle nollauslinkin.
            </p>
          </div>

          {resetSent ? (
            <div className="space-y-4" style={{ animation: 'fadeIn 0.4s ease both' }}>
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
            <form onSubmit={handleForgotPassword} className="space-y-4" style={{ animation: 'fadeIn 0.5s ease 0.15s both' }}>
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
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
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
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center p-6 bg-[var(--color-background)]"
    >
      {/* Watermark */}
      <div className="absolute top-1/4 opacity-[0.04] pointer-events-none">
        <TackBirdLogo size={160} className="text-foreground" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 shadow-[0_4px_24px_rgba(26,26,46,0.06)]">
        {/* Logo */}
        <div
          className="flex flex-col items-center gap-3"
          style={{ animation: 'fadeIn 0.5s ease both' }}
        >
          <TackBirdLogo size={56} className="text-primary" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-wide">TackBird</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Naapuruston jakamisalusta</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">Naapurin apu ei ole koskaan ollut lähempänä</p>
          </div>
        </div>

        {/* Google */}
        <div style={{ animation: 'fadeIn 0.5s ease 0.1s both' }}>
          <Button
            variant="outline"
            className="w-full rounded-xl"
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
        </div>

        <div className="relative" style={{ animation: 'fadeIn 0.5s ease 0.15s both' }}>
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-card)] px-2 text-xs text-muted-foreground">
            tai
          </span>
        </div>

        {/* Email/Password */}
        <form onSubmit={handleEmailAuth} className="space-y-4" style={{ animation: 'fadeIn 0.5s ease 0.2s both' }}>
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
            {isRegister && <PasswordStrength password={password} />}
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading || (isRegister && !isPasswordValid(password))}>
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

        <p className="text-center text-sm text-muted-foreground" style={{ animation: 'fadeIn 0.5s ease 0.25s both' }}>
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
