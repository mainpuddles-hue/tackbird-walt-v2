'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(userId: string | null) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  // Check support and register SW on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (!supported) return

    // Register service worker and check existing subscription
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registrationRef.current = registration
        return registration.pushManager.getSubscription()
      })
      .then((subscription) => {
        setIsSubscribed(!!subscription)
      })
      .catch((err) => {
        console.error('SW registration failed:', err)
      })
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) return

    setIsLoading(true)
    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setIsLoading(false)
        return
      }

      // Ensure SW is registered
      let registration = registrationRef.current
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
        registrationRef.current = registration
      }

      // Wait for SW to be ready
      await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key not configured')
        setIsLoading(false)
        return
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const subJson = subscription.toJSON()

      // Save to Supabase
      const supabase = createClient()
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subJson.keys?.p256dh ?? '',
          auth: subJson.keys?.auth ?? '',
        },
        { onConflict: 'endpoint' }
      )

      if (error) {
        console.error('Failed to save push subscription:', error)
        // Unsubscribe since we couldn't save
        await subscription.unsubscribe()
        setIsLoading(false)
        return
      }

      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, userId])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !userId) return

    setIsLoading(true)
    try {
      const registration = registrationRef.current
      if (!registration) {
        setIsLoading(false)
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const endpoint = subscription.endpoint

        // Unsubscribe from push
        await subscription.unsubscribe()

        // Remove from Supabase
        const supabase = createClient()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', endpoint)
      }

      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscription failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, userId])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
