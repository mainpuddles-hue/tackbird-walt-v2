'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Bell, Check } from 'lucide-react'
import { formatTimeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Notification } from '@/lib/types'

type NotificationFilter = 'all' | 'messages' | 'reviews' | 'rentals' | 'system'

const NOTIFICATION_FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'Kaikki' },
  { key: 'messages', label: 'Viestit' },
  { key: 'reviews', label: 'Arvostelut' },
  { key: 'rentals', label: 'Lainaukset' },
  { key: 'system', label: 'Järjestelmä' },
]

function matchesFilter(type: string, filter: NotificationFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'messages') return type.includes('message')
  if (filter === 'reviews') return type.includes('review')
  if (filter === 'rentals') return type.includes('rental')
  // "system" = everything else
  return !type.includes('message') && !type.includes('review') && !type.includes('rental')
}

interface NotificationsClientProps {
  notifications: Notification[]
}

export function NotificationsClient({
  notifications: initialNotifications,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 50)
  const router = useRouter()
  const supabase = createClient()

  const filteredNotifications = notifications.filter((n) =>
    matchesFilter(n.type, filter)
  )

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    )
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/notifications?limit=20&offset=${notifications.length}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotifications((prev) => [...prev, ...data.notifications])
      setHasMore(data.hasMore)
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleClick(notification: Notification) {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      )
    }

    // Navigate based on type
    if (notification.link_type === 'post' && notification.link_id) {
      router.push(`/post/${notification.link_id}`)
    } else if (notification.link_type === 'conversation' && notification.link_id) {
      router.push(`/messages/${notification.link_id}`)
    } else if (notification.link_type === 'event' && notification.link_id) {
      router.push('/events')
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold flex-1">Ilmoitukset</h2>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <Check className="mr-1 h-3.5 w-3.5" />
            Merkitse luetuksi
          </Button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto">
        {NOTIFICATION_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Bell className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-lg font-medium">Ei ilmoituksia</p>
          <p className="text-sm mt-1">Ilmoitukset ilmestyvät tähän</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredNotifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 w-full text-left transition-colors hover:bg-muted',
                !notification.is_read && 'bg-primary/5'
              )}
            >
              <Avatar className="h-9 w-9 mt-0.5">
                {notification.from_user?.avatar_url && (
                  <AvatarImage
                    src={notification.from_user.avatar_url}
                    alt={notification.from_user.name}
                  />
                )}
                <AvatarFallback className="text-xs">
                  {notification.from_user?.name?.charAt(0)?.toUpperCase() ?? '!'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', !notification.is_read && 'font-medium')}>
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(notification.created_at)}
                </p>
              </div>
              {!notification.is_read && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </button>
          ))}
          {hasMore && filter === 'all' && (
            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs"
              >
                {loadingMore ? 'Ladataan...' : 'Lataa lisää'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
