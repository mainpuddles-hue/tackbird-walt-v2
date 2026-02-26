'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import { CookieConsent } from '@/components/cookie-consent'
import { I18nProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <ErrorBoundary>
          {children}
          <Toaster position="top-center" richColors closeButton />
          <CookieConsent />
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  )
}
