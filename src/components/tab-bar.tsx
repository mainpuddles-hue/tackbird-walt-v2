'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Newspaper,
  CalendarDays,
  PlusCircle,
  MessageCircle,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Ilmoitukset', icon: Newspaper },
  { href: '/events', label: 'Tapahtumat', icon: CalendarDays },
  { href: '/create', label: 'Luo', icon: PlusCircle },
  { href: '/messages', label: 'Viestit', icon: MessageCircle },
  { href: '/profile', label: 'Profiili', icon: User },
] as const

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-xs transition-colors',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all',
                  isActive && 'stroke-[2.5]'
                )}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
