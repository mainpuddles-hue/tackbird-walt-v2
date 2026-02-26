'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSavedPosts(userId?: string) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const initFromPosts = useCallback((posts: Array<{ id: string; is_saved?: boolean }>) => {
    const ids = new Set<string>()
    for (const p of posts) {
      if (p.is_saved) ids.add(p.id)
    }
    setSavedIds(ids)
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId)
    if (data) {
      setSavedIds(new Set(data.map((r) => r.post_id)))
    }
  }, [userId])

  const toggleSave = useCallback(async (postId: string) => {
    if (!userId) return
    const wasSaved = savedIds.has(postId)
    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (wasSaved) next.delete(postId)
      else next.add(postId)
      return next
    })
    try {
      const supabase = createClient()
      if (wasSaved) {
        await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId)
      } else {
        await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId })
      }
    } catch {
      // Revert on error
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.add(postId)
        else next.delete(postId)
        return next
      })
    }
  }, [userId, savedIds])

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])

  return { toggleSave, isSaved, initFromPosts, refresh, savedIds }
}
