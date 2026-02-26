'use client'

import { useState, useEffect } from 'react'
import { CreditCard, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const DISMISS_KEY = 'tackbird_connect_banner_dismissed'

interface ConnectOnboardingBannerProps {
  show: boolean
}

export function ConnectOnboardingBanner({ show }: ConnectOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY)
    setDismissed(stored === 'true')
  }, [])

  if (!show || dismissed) return null

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  function handleActivate() {
    toast.info('Stripe Connect tulossa pian')
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">
              Vastaanota maksuja lainauksista
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aktivoi maksutilin yhdistamalla pankkitilisi. Saat rahat suoraan tilillesi.
            </p>
            <Button
              size="sm"
              className="mt-2 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={handleActivate}
            >
              Aloita aktivointi
            </Button>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Sulje"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
