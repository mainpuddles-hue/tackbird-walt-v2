'use client'

import Link from 'next/link'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            {/* Pushpin icon */}
            <circle cx="16" cy="12" r="8" fill="currentColor" opacity="0.15" />
            <circle cx="16" cy="12" r="4" fill="currentColor" />
            <line
              x1="16"
              y1="16"
              x2="16"
              y2="28"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight">TackBird</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Haku</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Ilmoitukset</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
