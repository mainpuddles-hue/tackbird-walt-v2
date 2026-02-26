import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from './messages-client'

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

  // Get last message and unread count for each conversation
  const enriched = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, image_url, sender_id, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .eq('is_read', false)

      return {
        ...conv,
        last_message: lastMsg,
        unread_count: unreadCount ?? 0,
      }
    })
  )

  return <MessagesClient conversations={enriched} currentUserId={user.id} />
}
