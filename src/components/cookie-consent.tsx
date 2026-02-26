'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function accept(level: 'all' | 'essential') {
    localStorage.setItem('cookie-consent', level)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card p-4">
      <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Käytämme evästeitä palvelun toiminnan varmistamiseksi.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => accept('essential')}
          >
            Vain välttämättömät
          </Button>
          <Button
            size="sm"
            onClick={() => accept('all')}
          >
            Hyväksy kaikki
          </Button>
        </div>
      </div>
    </div>
  )
}
