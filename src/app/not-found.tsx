import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="mx-auto max-w-sm rounded-xl border bg-card p-8 text-center shadow-sm">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-semibold tracking-tight">
          {'Sivua ei l\u00f6ytynyt'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {'Etsim\u00e4\u00e4si sivua ei l\u00f6ytynyt. Se on ehk\u00e4 poistettu tai siirretty.'}
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            Takaisin etusivulle
          </Link>
        </Button>
      </div>
    </div>
  )
}
