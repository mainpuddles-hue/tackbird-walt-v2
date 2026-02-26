import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTimeAgo } from '@/lib/format'
import Link from 'next/link'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
      user2:profiles!conversations_user2_id_fkey(id, name, avatar_url)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Viestit</h2>

      {!conversations || conversations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <MessageCircle className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-lg font-medium">Ei keskusteluja</p>
          <p className="text-sm mt-1">Viestit ilmestyvät tähän kun aloitat keskustelun</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => {
            const otherUser =
              conv.user1_id === user.id ? conv.user2 : conv.user1
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
              >
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
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {otherUser?.name ?? 'Käyttäjä'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatTimeAgo(conv.updated_at)}
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
