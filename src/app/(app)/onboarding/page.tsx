'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NEIGHBORHOODS } from '@/lib/constants'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [naapurusto, setNaapurusto] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleFinish() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name || 'Käyttäjä',
          naapurusto: naapurusto || 'Kallio',
          bio,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Tervetuloa TackBirdiin!')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Profiilin tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      router.push('/')
      router.refresh()
    } catch {
      toast.error('Virhe ohituksessa')
    } finally {
      setSaving(false)
    }
  }

  // Step 0: Welcome
  if (step === 0) return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8">
      <svg width="72" height="72" viewBox="0 0 32 32" fill="none" className="mb-4 text-primary">
        <circle cx="16" cy="12" r="8" fill="currentColor" opacity="0.15" />
        <circle cx="16" cy="12" r="4" fill="currentColor" />
        <line x1="16" y1="16" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Tervetuloa TackBirdiin!</h1>
      <p className="text-sm text-muted-foreground text-center mb-1">
        Naapurustosi ilmoitustaulu — pyydä apua, tarjoa palveluksia ja lainaa tavaroita.
      </p>
      <p className="text-xs text-muted-foreground text-center mb-8">
        Kerro meille muutama asia itsestäsi, jotta naapurit löytävät sinut.
      </p>
      <Button onClick={() => setStep(1)} className="w-full max-w-[280px]">
        Aloitetaan!
      </Button>
      <button
        onClick={handleSkip}
        disabled={saving}
        className="mt-3 text-sm text-muted-foreground hover:text-foreground"
      >
        Ohita
      </button>
    </div>
  )

  // Step 1: Neighborhood
  if (step === 1) return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold mb-1">Missä asut?</h2>
      <p className="text-xs text-muted-foreground mb-6">Valitse naapurustosi</p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
        {NEIGHBORHOODS.slice(0, 12).map((n) => (
          <button
            key={n}
            onClick={() => setNaapurusto(n)}
            className={cn(
              'rounded-xl p-3 text-sm font-semibold transition-all border',
              naapurusto === n
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-muted'
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <Button
        onClick={() => setStep(2)}
        disabled={!naapurusto}
        className="w-full max-w-[280px] mt-6"
      >
        Jatka
      </Button>
      <button onClick={() => setStep(0)} className="mt-3 text-sm text-muted-foreground">
        Takaisin
      </button>
    </div>
  )

  // Step 2: Name + Bio
  if (step === 2) return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold mb-1">Profiilisi</h2>
      <p className="text-xs text-muted-foreground mb-6">Miten näyt naapureille?</p>
      <div className="w-full max-w-[300px] space-y-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nimesi"
          maxLength={100}
        />
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Kerro itsestäsi..."
          rows={3}
          maxLength={500}
        />
      </div>
      <Button
        onClick={() => setStep(3)}
        disabled={!name}
        className="w-full max-w-[280px] mt-6"
      >
        Jatka
      </Button>
      <button onClick={() => setStep(1)} className="mt-3 text-sm text-muted-foreground">
        Takaisin
      </button>
    </div>
  )

  // Step 3: Confirmation
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8">
      <CircleCheck className="h-16 w-16 text-primary mb-4" strokeWidth={1.5} />
      <h2 className="text-xl font-bold mb-2">Kaikki valmista!</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Profiilisi on luotu. Voit nyt selata ilmoituksia.
      </p>

      <div className="w-full max-w-[280px] rounded-xl border bg-card p-5 text-center mb-6">
        <div className="text-3xl mb-2">
          {name.charAt(0).toUpperCase()}
        </div>
        <p className="font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{naapurusto}</p>
        {bio && <p className="text-xs text-muted-foreground mt-2">{bio}</p>}
      </div>

      <Button
        onClick={handleFinish}
        disabled={saving}
        className="w-full max-w-[280px]"
      >
        {saving ? 'Tallennetaan...' : 'Aloita selaaminen'}
      </Button>
      <button onClick={() => setStep(2)} className="mt-3 text-sm text-muted-foreground">
        Muokkaa profiilia
      </button>
    </div>
  )
}
