'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0
  const isValid = hasMinLength && hasUpperCase && hasNumber && passwordsMatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Salasanan vaihto epäonnistui')
      }

      toast.success('Salasana vaihdettu onnistuneesti')
      router.push('/')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Salasanan vaihto epäonnistui'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vaihda salasana</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Syötä uusi salasanasi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Uusi salasana</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vähintään 8 merkkiä"
              minLength={8}
              required
            />
            {password.length > 0 && (
              <div className="space-y-1 text-xs">
                <p className={hasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                  {hasMinLength ? '\u2713' : '\u25CB'} Vähintään 8 merkkiä
                </p>
                <p className={hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}>
                  {hasUpperCase ? '\u2713' : '\u25CB'} Iso kirjain
                </p>
                <p className={hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                  {hasNumber ? '\u2713' : '\u25CB'} Numero
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Vahvista salasana</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Salasana uudelleen"
              required
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive">Salasanat eivät täsmää</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isValid}>
            {loading ? 'Tallennetaan...' : 'Vaihda salasana'}
          </Button>
        </form>
      </div>
    </div>
  )
}
