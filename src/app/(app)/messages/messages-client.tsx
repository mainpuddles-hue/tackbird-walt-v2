'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageCircle, ImageIcon, Archive, Inbox } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatTimeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SkeletonMessage } from '@/components/skeleton-card'
import type { Profile } from '@/lib/types'

interface EnrichedConversation {
  id: string
  user1_id: string
  user2_id: string
  is_archived?: boolean
  is_group?: boolean
  group_name?: string | null
  group_emoji?: string | null
  updated_at: string
  user1: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  user2: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  last_message: {
    content: string
    image_url: string | null
    sender_id: string
    created_at: string
    is_system?: boolean
  } | null
  unread_count: number
}

interface MessagesClientProps {
  conversations: EnrichedConversation[]
  currentUserId: string
}

export function MessagesClient({ conversations, currentUserId }: MessagesClientProps) {
  const [showArchived, setShowArchived] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const visibleConversations = conversations.filter((conv) =>
    showArchived ? conv.is_archived : !conv.is_archived
  )

  async function handleToggleArchive(e: React.MouseEvent, conversationId: string, currentlyArchived: boolean) {
    e.preventDefault()
    e.stopPropagation()

    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: !currentlyArchived })
      .eq('id', conversationId)

    if (error) {
      toast.error('Toiminto epäonnistui')
      return
    }

    toast.success(currentlyArchived ? 'Keskustelu palautettu' : 'Keskustelu arkistoitu')
    router.refresh()
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {showArchived ? 'Arkisto' : 'Viestit'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className="gap-1.5 text-muted-foreground"
        >
          {showArchived ? (
            <>
              <Inbox className="h-4 w-4" />
              Viestit
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              Arkisto
            </>
          )}
        </Button>
      </div>

      {visibleConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <span className="text-6xl mb-4">💬</span>
          <h3 className="text-lg font-semibold text-foreground">
            {showArchived ? 'Ei arkistoituja keskusteluja' : 'Ei viestejä'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {showArchived
              ? 'Arkistoidut keskustelut ilmestyvät tähän'
              : 'Aloita keskustelu vastaamalla johonkin ilmoitukseen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {visibleConversations.map((conv) => {
            const isGroup = conv.is_group === true
            const otherUser =
              conv.user1_id === currentUserId ? conv.user2 : conv.user1
            const hasUnread = conv.unread_count > 0
            const lastMsg = conv.last_message
            const isArchived = conv.is_archived === true

            // Display name and avatar
            const displayName = isGroup
              ? (conv.group_name || 'Ryhmäkeskustelu')
              : (otherUser?.name ?? 'Käyttäjä')
            const displayEmoji = isGroup ? (conv.group_emoji || '📅') : null

            // Preview message
            let preview = ''
            if (lastMsg) {
              if (lastMsg.image_url && (!lastMsg.content || lastMsg.content === '📷 Kuva')) {
                preview = '📷 Kuva'
              } else if (lastMsg.is_system) {
                preview = lastMsg.content
              } else if (isGroup) {
                preview = lastMsg.content
              } else {
                const isMine = lastMsg.sender_id === currentUserId
                preview = isMine ? `Sinä: ${lastMsg.content}` : lastMsg.content
              }
            }

            return (
              <div key={conv.id} className="relative group">
                <Link
                  href={`/messages/${conv.id}`}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-3 pr-12 transition-colors hover:bg-muted',
                    hasUnread && 'bg-muted/50'
                  )}
                >
                  <div className="relative">
                    {isGroup ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
                        {displayEmoji}
                      </div>
                    ) : (
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
                    )}
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
                        {displayName}
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  onClick={(e) => handleToggleArchive(e, conv.id, isArchived)}
                  title={isArchived ? 'Palauta' : 'Arkistoi'}
                >
                  {isArchived ? (
                    <Inbox className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
