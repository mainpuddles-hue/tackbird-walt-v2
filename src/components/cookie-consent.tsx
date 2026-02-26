'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const { t } = useI18n()

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
          {t('cookie.message')}
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => accept('essential')}
          >
            {t('cookie.essentialOnly')}
          </Button>
          <Button
            size="sm"
            onClick={() => accept('all')}
          >
            {t('cookie.acceptAll')}
          </Button>
        </div>
      </div>
    </div>
  )
}
