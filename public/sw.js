const CACHE_PREFIX = 'manaevo-pwa-'
const CACHE_NAME = `${CACHE_PREFIX}v10`
const BASE_URL = new URL('./', self.location.href).href
const BASE_PATH = new URL(BASE_URL).pathname
const MONSTER_REVISION_URL = new URL('monster-asset-revisions.json', BASE_URL).href
const APP_SHELL = [
  BASE_URL,
  new URL('manifest.webmanifest', BASE_URL).href,
  MONSTER_REVISION_URL,
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
  return relative.startsWith('assets/') || relative.startsWith('icons/')
}

async function loadMonsterRevisions(cache) {
  try {
    const response = await fetch(MONSTER_REVISION_URL, { cache: 'no-store' })
    if (!response.ok) throw new Error('monster revision manifest unavailable')
    await cache.put(MONSTER_REVISION_URL, response.clone())
    return await response.json()
  } catch {
    const cached = await cache.match(MONSTER_REVISION_URL)
    if (!cached) return null
    try { return await cached.json() } catch { return null }
  }
}

function revisionCacheKey(request, revision) {
  const key = new URL(request.url)
  key.searchParams.set('__manaevo_rev', revision)
  return key.href
}

async function previousRevisionResponse(cache, request) {
  const requestUrl = new URL(request.url)
  const keys = await cache.keys()
  for (const key of keys.reverse()) {
    const keyUrl = new URL(key.url)
    if (keyUrl.pathname === requestUrl.pathname && keyUrl.searchParams.has('__manaevo_rev')) {
      const cached = await cache.match(key)
      if (cached) return cached
    }
  }
  return null
}

async function pruneMonsterCache(cache, request, keepKey) {
  const requestUrl = new URL(request.url)
  const keepUrl = typeof keepKey === 'string' ? keepKey : keepKey.url
  const keys = await cache.keys()
  await Promise.all(keys
    .filter((key) => {
      const keyUrl = new URL(key.url)
      if (keyUrl.pathname !== requestUrl.pathname || key.url === keepUrl) return false
      return key.url === request.url || keyUrl.searchParams.has('__manaevo_rev')
    })
    .map((key) => cache.delete(key)))
}

async function handleMonsterAsset(request, url) {
  const cache = await caches.open(CACHE_NAME)
  const relativePath = `/${url.pathname.slice(BASE_PATH.length)}`
  const revisions = await loadMonsterRevisions(cache)
  const revision = revisions?.formalByUrl?.[relativePath]

  if (revision) {
    const cacheKey = revisionCacheKey(request, revision)
    const cached = await cache.match(cacheKey)
    if (cached) {
      await pruneMonsterCache(cache, request, cacheKey)
      return cached
    }
    try {
      const response = await fetch(request, { cache: 'no-store' })
      if (response.ok) {
        await cache.put(cacheKey, response.clone())
        await pruneMonsterCache(cache, request, cacheKey)
      }
      return response
    } catch {
      return (await previousRevisionResponse(cache, request)) || (await cache.match(request)) || Response.error()
    }
  }

  // Candidate assets may be replaced by a later FORMAL asset at the same URL, so they are network-first.
  try {
    const response = await fetch(request, { cache: 'no-store' })
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) || Response.error()
  }
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

  if (url.pathname.slice(BASE_PATH.length).startsWith('monsters/')) {
    event.respondWith(handleMonsterAsset(request, url))
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
