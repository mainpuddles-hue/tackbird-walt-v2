'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Advertisement } from '@/lib/types'

export function useAds(naapurusto?: string) {
  const [ads, setAds] = useState<Advertisement[]>([])
  const trackedRef = useRef(new Set<string>())

  const fetchAds = useCallback(async () => {
    try {
      const url = naapurusto
        ? `/api/ads/feed?naapurusto=${encodeURIComponent(naapurusto)}`
        : '/api/ads/feed'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setAds(data.ads ?? [])
      }
    } catch {
      // Ignore
    }
  }, [naapurusto])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const trackImpression = useCallback((adId: string) => {
    if (trackedRef.current.has(adId)) return
    trackedRef.current.add(adId)
    fetch(`/api/ads/${adId}/impression`, { method: 'POST' }).catch(() => {})
  }, [])

  const trackClick = useCallback((adId: string) => {
    fetch(`/api/ads/${adId}/click`, { method: 'POST' }).catch(() => {})
  }, [])

  return { ads, fetchAds, trackImpression, trackClick }
}

export function useMyAds() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ads/mine')
      if (res.ok) {
        const data = await res.json()
        setAds(data.ads ?? [])
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const pauseAd = useCallback(async (id: string) => {
    await fetch(`/api/ads/${id}/pause`, { method: 'POST' })
    await fetchAds()
  }, [fetchAds])

  const resumeAd = useCallback(async (id: string) => {
    await fetch(`/api/ads/${id}/resume`, { method: 'POST' })
    await fetchAds()
  }, [fetchAds])

  const payAd = useCallback(async (id: string) => {
    const res = await fetch(`/api/ads/${id}/pay`, { method: 'POST' })
    if (!res.ok) throw new Error('Maksu epäonnistui')
    const data = await res.json()
    if (data.dev_mode) await fetchAds()
    return data
  }, [fetchAds])

  return { ads, loading, fetchAds, pauseAd, resumeAd, payAd }
}
