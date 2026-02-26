'use client'

import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import { CookieConsent } from '@/components/cookie-consent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <Toaster position="top-center" richColors closeButton />
      <CookieConsent />
    </ErrorBoundary>
  )
}
