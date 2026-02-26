'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function accept(level: 'all' | 'essential') {
    localStorage.setItem('cookie_consent', level)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pb-safe">
      <div className="mx-auto max-w-md rounded-xl border bg-background p-4 shadow-lg">
        <p className="text-sm text-muted-foreground mb-3">
          Käytämme evästeitä parantaaksemme käyttökokemustasi. Voit hyväksyä kaikki evästeet tai vain välttämättömät.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => accept('essential')}
          >
            Vain välttämättömät
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => accept('all')}
          >
            Hyväksy kaikki
          </Button>
        </div>
      </div>
    </div>
  )
}
