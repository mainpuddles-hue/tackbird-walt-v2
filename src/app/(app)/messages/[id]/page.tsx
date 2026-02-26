import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ConversationClient } from './conversation-client'

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get current user's profile name for typing indicator
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  // Get conversation with both users
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:profiles!conversations_user1_id_fkey(id, name, avatar_url),
      user2:profiles!conversations_user2_id_fkey(id, name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  // Verify user belongs to this conversation
  if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
    notFound()
  }

  const otherUser =
    conversation.user1_id === user.id ? conversation.user2 : conversation.user1

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark unread messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', id)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  return (
    <ConversationClient
      conversationId={id}
      messages={messages ?? []}
      otherUser={otherUser}
      currentUserId={user.id}
      currentUserName={currentProfile?.name ?? 'Käyttäjä'}
    />
  )
}
