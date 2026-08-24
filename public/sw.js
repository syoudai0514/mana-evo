const CACHE_PREFIX = 'manaevo-pwa-'
const CACHE_NAME = `${CACHE_PREFIX}v8`
const BASE_URL = new URL('./', self.location.href).href
const BASE_PATH = new URL(BASE_URL).pathname
const APP_SHELL = [
  BASE_URL,
  new URL('manifest.webmanifest', BASE_URL).href,
  new URL('icons/icon-192.png', BASE_URL).href,
  new URL('icons/icon-512.png', BASE_URL).href,
  new URL('icons/apple-touch-icon.png', BASE_URL).href
]

async function warmEntryAssets(cache) {
  try {
    const response = await fetch(BASE_URL, { cache: 'no-store' })
    if (!response.ok) return
    await cache.put(BASE_URL, response.clone())
    const html = await response.text()
    const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => new URL(match[1], BASE_URL))
      .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(`${BASE_PATH}assets/`))
      .map((url) => url.href)
    await Promise.all([...new Set(urls)].map(async (href) => {
      try {
        const asset = await fetch(href, { cache: 'no-store' })
        if (asset.ok) await cache.put(href, asset)
      } catch {
        // A failed warm-up must not prevent the PWA from installing.
      }
    }))
  } catch {
    // Shell precache is still useful even when entry warming fails offline.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(APP_SHELL)
    await warmEntryAssets(cache)
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

function isCacheFirstAsset(url) {
  if (!url.pathname.startsWith(BASE_PATH)) return false
  const relative = url.pathname.slice(BASE_PATH.length)
  return relative.startsWith('assets/') || relative.startsWith('monsters/') || relative.startsWith('icons/')
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith(BASE_PATH)) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const response = await fetch(request, { cache: 'no-store' })
        if (response.ok) await cache.put(BASE_URL, response.clone())
        return response
      } catch {
        return (await cache.match(request)) || (await cache.match(BASE_URL)) || Response.error()
      }
    })())
    return
  }

  if (isCacheFirstAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request, { cache: 'no-store' })
        if (response.ok) await cache.put(request, response.clone())
        return response
      } catch {
        return Response.error()
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    try {
      const response = await fetch(request, { cache: 'no-store' })
      if (response.ok) await cache.put(request, response.clone())
      return response
    } catch {
      return (await cache.match(request)) || Response.error()
    }
  })())
})
