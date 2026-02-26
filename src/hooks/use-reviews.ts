'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Review } from '@/lib/types'

export function useReviews(userId?: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)')
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false })
      if (data) {
        setReviews(data as unknown as Review[])
        setCount(data.length)
        if (data.length > 0) {
          const sum = data.reduce((acc, r) => acc + r.rating, 0)
          setAverage(Math.round((sum / data.length) * 10) / 10)
        } else {
          setAverage(null)
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { reviews, average, count, loading, refresh }
}
