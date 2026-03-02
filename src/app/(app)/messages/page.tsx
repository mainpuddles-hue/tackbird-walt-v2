import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from './messages-client'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Query 1: DM conversations (where user is user1 or user2)
  const { data: dmConversations } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
      user2:profiles!conversations_user2_id_fkey(id, name, avatar_url)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq('is_group', false)
    .order('updated_at', { ascending: false })
    .limit(50)

  // Query 2: Group conversations where user is a member
  const { data: memberRows } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)

  const groupConvIds = (memberRows ?? []).map((r) => r.conversation_id)

  let groupConversations: typeof dmConversations = []
  if (groupConvIds.length > 0) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .in('id', groupConvIds)
      .eq('is_group', true)
      .order('updated_at', { ascending: false })
      .limit(50)
    groupConversations = data
  }

  // Merge and deduplicate
  const allConvMap = new Map<string, (typeof dmConversations extends (infer T)[] | null ? T : never)>()
  for (const conv of (dmConversations ?? [])) {
    allConvMap.set(conv.id, conv)
  }
  for (const conv of (groupConversations ?? [])) {
    if (!allConvMap.has(conv.id)) {
      allConvMap.set(conv.id, conv)
    }
  }
  const allConversations = Array.from(allConvMap.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  // Get last message and unread count for each conversation
  const enriched = await Promise.all(
    allConversations.map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, image_url, sender_id, created_at, is_system')
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
