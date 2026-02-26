'use client'

import Link from 'next/link'
import { MessageCircle, ImageIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTimeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface EnrichedConversation {
  id: string
  user1_id: string
  user2_id: string
  updated_at: string
  user1: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  user2: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  last_message: {
    content: string
    image_url: string | null
    sender_id: string
    created_at: string
  } | null
  unread_count: number
}

interface MessagesClientProps {
  conversations: EnrichedConversation[]
  currentUserId: string
}

export function MessagesClient({ conversations, currentUserId }: MessagesClientProps) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Viestit</h2>

      {conversations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <MessageCircle className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-lg font-medium">Ei keskusteluja</p>
          <p className="text-sm mt-1">Viestit ilmestyvät tähän kun aloitat keskustelun</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => {
            const otherUser =
              conv.user1_id === currentUserId ? conv.user2 : conv.user1
            const hasUnread = conv.unread_count > 0
            const lastMsg = conv.last_message

            let preview = ''
            if (lastMsg) {
              if (lastMsg.image_url && (!lastMsg.content || lastMsg.content === '📷 Kuva')) {
                preview = '📷 Kuva'
              } else {
                const isMine = lastMsg.sender_id === currentUserId
                preview = isMine ? `Sinä: ${lastMsg.content}` : lastMsg.content
              }
            }

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted',
                  hasUnread && 'bg-muted/50'
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    {otherUser?.avatar_url && (
                      <AvatarImage
                        src={otherUser.avatar_url}
                        alt={otherUser.name}
                      />
                    )}
                    <AvatarFallback>
                      {otherUser?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      'truncate text-sm',
                      hasUnread ? 'font-semibold' : 'font-medium'
                    )}>
                      {otherUser?.name ?? 'Käyttäjä'}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {lastMsg ? formatTimeAgo(lastMsg.created_at) : formatTimeAgo(conv.updated_at)}
                    </span>
                  </div>
                  <p className={cn(
                    'truncate text-xs',
                    hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {preview || 'Ei viestejä vielä'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
