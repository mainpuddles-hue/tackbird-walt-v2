// TackBird Service Worker
// Cache-first for static assets, network-first for API/pages, push notifications

const CACHE_NAME = 'tackbird-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// ============================================================
// INSTALL — precache shell
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ============================================================
// ACTIVATE — clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ============================================================
// FETCH — cache-first static, network-first API/pages
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // Network-first for API calls and Supabase
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase')
  ) {
    event.respondWith(networkFirst(request))
    return
  }

  // Cache-first for static assets (_next/static, images, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Network-first for pages (HTML navigation)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // Default: network-first
  event.respondWith(networkFirst(request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response('Offline', { status: 503 })
  }
}

// ============================================================
// PUSH — show notification
// ============================================================
self.addEventListener('push', (event) => {
  let data = {}

  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'TackBird', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'TackBird'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'tackbird-notification',
    data: {
      url: data.url || '/',
      type: data.type || 'general',
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ============================================================
// NOTIFICATION CLICK — open/focus app and navigate
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If there is already an open window, focus it and navigate
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({
            type: 'notification_click',
            url: targetUrl,
          })
          return
        }
      }

      // Otherwise open a new window
      return self.clients.openWindow(targetUrl)
    })
  )
})
