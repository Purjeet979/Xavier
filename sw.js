const CACHE_NAME = 'browser-rag-v1'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/icon.png',
  '/vite.svg'
]

// Install event - precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && !cacheName.startsWith('transformers-') && !cacheName.startsWith('webllm/')) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - handle offline requests with COOP/COEP headers
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip cross-origin requests that are not model weights
  if (url.origin !== self.origin && !url.hostname.includes('huggingface') && !url.hostname.includes('cdn')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return applyCorsHeaders(cachedResponse)
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse
          }

          // Clone response to store in cache for static assets and scripts
          const responseToCache = networkResponse.clone()
          if (
            url.origin === self.origin ||
            url.pathname.endsWith('.wasm') ||
            url.pathname.endsWith('.onnx') ||
            url.pathname.endsWith('.json')
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }

          return applyCorsHeaders(networkResponse)
        })
        .catch(() => {
          // Fallback to index.html for navigation requests when offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((indexMatch) => {
              if (indexMatch) return applyCorsHeaders(indexMatch)
              return new Response('Offline', { status: 503, statusText: 'Offline' })
            })
          }
        })
    })
  )
})

// Add COOP / COEP headers to response if missing to preserve WebGPU/WASM multi-threading
function applyCorsHeaders(response) {
  if (!response) return response

  const headers = new Headers(response.headers)
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}
