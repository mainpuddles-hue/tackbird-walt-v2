'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TackBirdLogo } from '@/components/tackbird-logo'
import { AppTutorial } from '@/components/app-tutorial'
import { cn } from '@/lib/utils'
import { NEIGHBORHOODS } from '@/lib/constants'
import { toast } from 'sonner'

const TUTORIAL_KEY = 'tackbird_tutorial_done'

export default function OnboardingPage() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialChecked, setTutorialChecked] = useState(false)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [naapurusto, setNaapurusto] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Show tutorial if not completed yet
  useEffect(() => {
    try {
      const done = sessionStorage.getItem(TUTORIAL_KEY)
      if (!done) {
        setShowTutorial(true)
      }
    } catch {
      // sessionStorage not available
    }
    setTutorialChecked(true)
  }, [])

  // Show tutorial overlay first
  if (!tutorialChecked) return null
  if (showTutorial) {
    return <AppTutorial onComplete={() => setShowTutorial(false)} />
  }

  async function handleFinish() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Käyttäjä',
          naapurusto: naapurusto || 'Kallio',
          bio,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Tallennus epäonnistui')
      }

      toast.success('Tervetuloa TackBirdiin!')
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Profiilin tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })

      if (!res.ok) throw new Error('Skip failed')

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
    <div className="flex min-h-dvh flex-col items-center justify-center p-8 animate-page-in">
      <div style={{ animation: 'fadeIn 0.5s ease-out both' }}>
        <TackBirdLogo size={72} className="text-primary mb-4 mx-auto" />
      </div>
      <h1
        className="text-2xl font-bold tracking-tight mb-2"
        style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}
      >
        Tervetuloa TackBirdiin!
      </h1>
      <p
        className="text-sm text-muted-foreground text-center mb-1"
        style={{ animation: 'fadeIn 0.5s ease-out 0.15s both' }}
      >
        Naapurustosi ilmoitustaulu — pyydä apua, tarjoa palveluksia ja lainaa tavaroita.
      </p>
      <p
        className="text-xs text-muted-foreground text-center mb-8"
        style={{ animation: 'fadeIn 0.5s ease-out 0.2s both' }}
      >
        Kerro meille muutama asia itsestäsi, jotta naapurit löytävät sinut.
      </p>
      <div style={{ animation: 'fadeIn 0.5s ease-out 0.25s both' }}>
        <Button onClick={() => setStep(1)} className="w-full max-w-[280px]">
          Aloitetaan!
        </Button>
        <button
          onClick={handleSkip}
          disabled={saving}
          className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Ohita
        </button>
      </div>
    </div>
  )

  // Step 1: Neighborhood
  if (step === 1) return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8 animate-page-in">
      <h2
        className="text-xl font-bold mb-1"
        style={{ animation: 'fadeIn 0.4s ease-out both' }}
      >
        Missä asut?
      </h2>
      <p
        className="text-xs text-muted-foreground mb-6"
        style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
      >
        Valitse naapurustosi
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
        {NEIGHBORHOODS.slice(0, 12).map((n, i) => (
          <button
            key={n}
            onClick={() => setNaapurusto(n)}
            className={cn(
              'rounded-xl p-3 text-sm font-semibold transition-all border',
              naapurusto === n
                ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                : 'border-border bg-card text-foreground hover:bg-muted hover:scale-[1.01]'
            )}
            style={{
              animation: `fadeIn 0.35s ease-out ${50 + i * 30}ms both`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ animation: 'fadeIn 0.4s ease-out 0.4s both' }}>
        <Button
          onClick={() => setStep(2)}
          disabled={!naapurusto}
          className="w-full max-w-[280px] mt-6"
        >
          Jatka
        </Button>
        <button onClick={() => setStep(0)} className="mt-3 block w-full text-center text-sm text-muted-foreground">
          Takaisin
        </button>
      </div>
    </div>
  )

  // Step 2: Name + Bio
  if (step === 2) return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8 animate-page-in">
      <h2
        className="text-xl font-bold mb-1"
        style={{ animation: 'fadeIn 0.4s ease-out both' }}
      >
        Profiilisi
      </h2>
      <p
        className="text-xs text-muted-foreground mb-6"
        style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
      >
        Miten näyt naapureille?
      </p>
      <div
        className="w-full max-w-[300px] space-y-4"
        style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
      >
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
      <div style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}>
        <Button
          onClick={() => setStep(3)}
          disabled={!name}
          className="w-full max-w-[280px] mt-6"
        >
          Jatka
        </Button>
        <button onClick={() => setStep(1)} className="mt-3 block w-full text-center text-sm text-muted-foreground">
          Takaisin
        </button>
      </div>
    </div>
  )

  // Step 3: Confirmation
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8 animate-page-in">
      <div style={{ animation: 'fadeIn 0.5s ease-out both' }}>
        <TackBirdLogo size={64} className="text-primary mb-4 mx-auto" />
      </div>
      <h2
        className="text-xl font-bold mb-2"
        style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
      >
        Kaikki valmista!
      </h2>
      <p
        className="text-sm text-muted-foreground text-center mb-6"
        style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}
      >
        Profiilisi on luotu. Voit nyt selata ilmoituksia.
      </p>

      <div
        className="w-full max-w-[280px] rounded-xl border bg-card p-5 text-center mb-6"
        style={{ animation: 'fadeIn 0.4s ease-out 0.25s both' }}
      >
        <div className="text-3xl mb-2">
          {name.charAt(0).toUpperCase()}
        </div>
        <p className="font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{naapurusto}</p>
        {bio && <p className="text-xs text-muted-foreground mt-2">{bio}</p>}
      </div>

      <div style={{ animation: 'fadeIn 0.4s ease-out 0.3s both' }}>
        <Button
          onClick={handleFinish}
          disabled={saving}
          className="w-full max-w-[280px]"
        >
          {saving ? 'Tallennetaan...' : 'Aloita selaaminen'}
        </Button>
        <button onClick={() => setStep(2)} className="mt-3 block w-full text-center text-sm text-muted-foreground">
          Muokkaa profiilia
        </button>
      </div>
    </div>
  )
}
