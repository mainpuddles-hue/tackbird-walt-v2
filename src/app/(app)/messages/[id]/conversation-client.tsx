'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Send, ImageIcon, X, Trash2 } from 'lucide-react'
import { formatTimeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Message, Profile } from '@/lib/types'
import Link from 'next/link'

interface ConversationClientProps {
  conversationId: string
  messages: Message[]
  otherUser: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  currentUserId: string
  currentUserName: string
}

export function ConversationClient({
  conversationId,
  messages: initialMessages,
  otherUser,
  currentUserId,
  currentUserName,
}: ConversationClientProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const typingHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })

          // Mark as read if from other user
          if (msg.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', msg.id)
              .then()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, supabase])

  // Typing indicator: subscribe to broadcast channel
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { userId: string; userName: string; typing: boolean }
        if (data.userId === currentUserId) return // Ignore own typing events

        if (data.typing) {
          setTypingUser(data.userName)
          // Auto-hide after 4 seconds in case stop event is missed
          if (typingHideTimeoutRef.current) clearTimeout(typingHideTimeoutRef.current)
          typingHideTimeoutRef.current = setTimeout(() => {
            setTypingUser(null)
          }, 4000)
        } else {
          setTypingUser(null)
          if (typingHideTimeoutRef.current) {
            clearTimeout(typingHideTimeoutRef.current)
            typingHideTimeoutRef.current = null
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (typingHideTimeoutRef.current) clearTimeout(typingHideTimeoutRef.current)
    }
  }, [conversationId, currentUserId, supabase])

  // Send typing broadcast (debounced: max once every 2 seconds)
  const sendTypingEvent = useCallback(
    (typing: boolean) => {
      const channel = supabase.channel(`typing:${conversationId}`)
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, userName: currentUserName, typing },
      })
    },
    [conversationId, currentUserId, currentUserName, supabase]
  )

  function handleTyping() {
    const now = Date.now()
    // Debounce: only send typing:true once every 2 seconds
    if (now - lastTypingSentRef.current >= 2000) {
      lastTypingSentRef.current = now
      sendTypingEvent(true)
    }
    // Reset the "stop typing" timeout (3 seconds of inactivity)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(false)
    }, 3000)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kuva saa olla korkeintaan 5 MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content && !imageFile) return

    setSending(true)
    setNewMessage('')

    // Stop typing indicator on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTypingEvent(false)

    let imageUrl: string | null = null

    try {
      // Upload image if present
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${conversationId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('messages')
          .upload(path, imageFile, { cacheControl: '3600' })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('messages').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      // Optimistic update
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content || (imageUrl ? '📷 Kuva' : ''),
        image_url: imageUrl,
        is_read: false,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimisticMsg])
      clearImage()

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content || (imageUrl ? '📷 Kuva' : ''),
        image_url: imageUrl,
      })

      if (error) throw error

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    } catch {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')))
      setNewMessage(content)
      toast.error('Viestin lähetys epäonnistui')
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteConversation() {
    setDeleting(true)
    try {
      // Delete all messages first
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
      if (msgError) throw msgError

      // Delete the conversation
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
      if (convError) throw convError

      toast.success('Keskustelu poistettu')
      router.push('/messages')
    } catch {
      toast.error('Keskustelun poistaminen epäonnistui')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push('/messages')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link href={`/profile/${otherUser?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-8 w-8">
            {otherUser?.avatar_url && (
              <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
            )}
            <AvatarFallback className="text-xs">
              {otherUser?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm truncate">
            {otherUser?.name ?? 'Käyttäjä'}
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="flex items-center justify-between border-b bg-destructive/5 px-4 py-2">
          <span className="text-sm font-medium">Poista keskustelu?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDeleteConversation}
            >
              {deleting ? 'Poistetaan...' : 'Poista'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Peruuta
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Aloita keskustelu lähettämällä viesti
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {msg.image_url && (
                  <div className="relative mb-2 aspect-video w-48 overflow-hidden rounded-lg">
                    <Image
                      src={msg.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>
                )}
                {msg.content && msg.content !== '📷 Kuva' && (
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                )}
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}
                >
                  {formatTimeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
              <span>{typingUser} kirjoittaa</span>
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="border-t px-4 py-2 flex items-center gap-2">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
            <Image src={imagePreview} alt="" fill className="object-cover" sizes="64px" />
          </div>
          <button onClick={clearImage} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t p-3 flex items-center gap-2"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => imageInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value)
            handleTyping()
          }}
          placeholder="Kirjoita viesti..."
          className="flex-1"
          maxLength={5000}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || (!newMessage.trim() && !imageFile)}
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
