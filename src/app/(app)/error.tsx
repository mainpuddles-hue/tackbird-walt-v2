'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const message =
    error.message.length > 200
      ? error.message.slice(0, 200) + '...'
      : error.message

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h1 className="text-xl font-semibold mb-2">Jotain meni pieleen</h1>
      {message && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={reset}>Yritä uudelleen</Button>
        <Button variant="outline" asChild>
          <Link href="/">Takaisin etusivulle</Link>
        </Button>
      </div>
    </div>
  )
}
