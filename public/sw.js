const CACHE_PREFIX = 'manaevo-pwa-'
const CACHE_NAME = `${CACHE_PREFIX}v3`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('./'))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    try {
      const response = await fetch(request, { cache: 'no-store' })
      if (response.ok) await cache.put(request, response.clone())
      return response
    } catch {
      const cached = await cache.match(request)
      if (cached) return cached
      if (request.mode === 'navigate') return (await cache.match('./')) || Response.error()
      return Response.error()
    }
  })())
})
