'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RentalBooking } from '@/lib/types'

export function useRentals() {
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rentals/my-bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings ?? [])
      }
    } catch (err) {
      console.warn('Varausten haku epäonnistui:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const confirmBooking = useCallback(async (id: string) => {
    const res = await fetch(`/api/rentals/${id}/confirm`, { method: 'POST' })
    if (!res.ok) throw new Error('Vahvistus epäonnistui')
    await fetchBookings()
  }, [fetchBookings])

  const cancelBooking = useCallback(async (id: string) => {
    const res = await fetch(`/api/rentals/${id}/cancel`, { method: 'POST' })
    if (!res.ok) throw new Error('Peruutus epäonnistui')
    await fetchBookings()
  }, [fetchBookings])

  const completeBooking = useCallback(async (id: string) => {
    const res = await fetch(`/api/rentals/${id}/complete`, { method: 'POST' })
    if (!res.ok) throw new Error('Merkintä epäonnistui')
    await fetchBookings()
  }, [fetchBookings])

  const payBooking = useCallback(async (id: string) => {
    const res = await fetch(`/api/rentals/${id}/pay`, { method: 'POST' })
    if (!res.ok) throw new Error('Maksu epäonnistui')
    const data = await res.json()
    if (data.dev_mode) await fetchBookings()
    return data
  }, [fetchBookings])

  return { bookings, loading, fetchBookings, confirmBooking, cancelBooking, completeBooking, payBooking }
}

export function useConnectStatus() {
  const [status, setStatus] = useState({ has_account: false, onboarded: false, dev_mode: false })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/rentals/connect/status')
      if (res.ok) setStatus(await res.json())
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const startOnboarding = useCallback(async () => {
    const res = await fetch('/api/rentals/connect/onboard', { method: 'POST' })
    if (!res.ok) throw new Error('Onboarding epäonnistui')
    const data = await res.json()
    if (data.dev_mode) refresh()
    return data
  }, [refresh])

  return { ...status, loading, refresh, startOnboarding }
}
