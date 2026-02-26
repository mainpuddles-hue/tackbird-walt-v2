'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useBlockedUsers(userId?: string) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', userId)
    if (data) {
      setBlockedIds(new Set(data.map((r) => r.blocked_id)))
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const block = useCallback(async (targetId: string) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('blocked_users').insert({ blocker_id: userId, blocked_id: targetId })
    setBlockedIds((prev) => new Set([...prev, targetId]))
  }, [userId])

  const unblock = useCallback(async (targetId: string) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('blocked_users').delete().eq('blocker_id', userId).eq('blocked_id', targetId)
    setBlockedIds((prev) => {
      const next = new Set(prev)
      next.delete(targetId)
      return next
    })
  }, [userId])

  const isBlocked = useCallback((id: string) => blockedIds.has(id), [blockedIds])

  return { block, unblock, isBlocked, refresh, blockedIds }
}
