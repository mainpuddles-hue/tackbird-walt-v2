'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Search, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TackBirdLogo } from '@/components/tackbird-logo'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

export function Header() {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const { t } = useI18n()

  useEffect(() => {
    let mounted = true

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (mounted) setUnreadCount(count ?? 0)
    }

    fetchUnread()

    // Subscribe to new notifications
    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          if (mounted) setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <TackBirdLogo size={24} className="text-foreground" />
          <span className="text-[15px] font-semibold tracking-wide">TackBird</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/search">
              <Search className="h-[18px] w-[18px] text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
              <span className="sr-only">{t('nav.search')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/map">
              <Map className="h-[18px] w-[18px] text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
              <span className="sr-only">{t('nav.map')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative" asChild>
            <Link href="/notifications">
              <Bell className="h-[18px] w-[18px] text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white animate-badge-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="sr-only">{t('nav.notifications')}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
