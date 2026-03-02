'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Newspaper,
  CalendarDays,
  Plus,
  MessageCircle,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const tabs = [
  { href: '/', label: 'Ilmoitukset', icon: Newspaper },
  { href: '/events', label: 'Tapahtumat', icon: CalendarDays },
  { href: '/create', label: 'Luo', icon: Plus, isCreate: true },
  { href: '/messages', label: 'Viestit', icon: MessageCircle },
  { href: '/profile', label: 'Profiili', icon: User },
] as const

export function TabBar() {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', user.id)
        .eq('is_read', false)

      if (mounted) setUnreadMessages(count ?? 0)
    }

    fetchUnread()

    const channel = supabase
      .channel('tabbar-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { if (mounted) fetchUnread() }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon, ...rest }) => {
          const isCreate = 'isCreate' in rest && rest.isCreate
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)

          const showBadge = href === '/messages' && unreadMessages > 0

          if (isCreate) {
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center justify-center"
              >
                <div className="bg-primary rounded-full h-12 w-12 flex items-center justify-center shadow-lg -mt-4">
                  <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium text-primary mt-0.5">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-xs transition-colors',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground font-normal hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 1.75 : 1.25}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary"
                  style={{ animation: 'dotIn 0.2s ease both' }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
