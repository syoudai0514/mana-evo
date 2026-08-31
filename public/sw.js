const LEGACY_CACHE_PREFIX = 'manaevo-pwa-'
const SHELL_CACHE_PREFIX = 'manaevo-shell-'
const SHELL_CACHE_NAME = `${SHELL_CACHE_PREFIX}v11`
const DEX_ART_CACHE_NAME = 'manaevo-dex-art-v1'
const DEX_ART_REV_PARAM = '__manaevo_rev'
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

let monsterRevisionMemo = null

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
      } catch {}
    }))
  } catch {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE_NAME)
    await cache.addAll(APP_SHELL)
    await warmEntryAssets(cache)
    const manifest = await cache.match(MONSTER_REVISION_URL)
    if (manifest) {
      try { monsterRevisionMemo = await manifest.json() } catch {}
    }
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys
      .filter((key) => (
        (key.startsWith(SHELL_CACHE_PREFIX) && key !== SHELL_CACHE_NAME) ||
        key.startsWith(LEGACY_CACHE_PREFIX)
      ))
      .map((key) => caches.delete(key)))
    // DEX_ART_CACHE_NAME is deliberately not deleted when the shell version changes.
    await self.clients.claim()
  })())
})

function isCacheFirstAsset(url) {
  if (!url.pathname.startsWith(BASE_PATH)) return false
  const relative = url.pathname.slice(BASE_PATH.length)
  return relative.startsWith('assets/') || relative.startsWith('icons/')
}

async function parseManifestResponse(response) {
  if (!response) return null
  try { return await response.json() } catch { return null }
}

async function loadMonsterRevisions({ refresh = false } = {}) {
  if (!refresh && monsterRevisionMemo) return monsterRevisionMemo
  const shellCache = await caches.open(SHELL_CACHE_NAME)

  if (!refresh) {
    const cached = await shellCache.match(MONSTER_REVISION_URL)
    const parsed = await parseManifestResponse(cached)
    if (parsed) {
      monsterRevisionMemo = parsed
      return parsed
    }
  }

  try {
    const response = await fetch(MONSTER_REVISION_URL, { cache: 'no-store' })
    if (!response.ok) throw new Error('monster revision manifest unavailable')
    await shellCache.put(MONSTER_REVISION_URL, response.clone())
    monsterRevisionMemo = await response.json()
    return monsterRevisionMemo
  } catch {
    const cached = await shellCache.match(MONSTER_REVISION_URL)
    const parsed = await parseManifestResponse(cached)
    if (parsed) monsterRevisionMemo = parsed
    return parsed
  }
}

function revisionCacheKey(request, revision) {
  const key = new URL(request.url)
  key.searchParams.set(DEX_ART_REV_PARAM, revision)
  return key.href
}

function expectedShaHex(revision) {
  return String(revision || '').replace(/^sha256-/, '').toLowerCase()
}

async function sha256Hex(bytes) {
  const digest = await self.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function responseFromBytes(source, bytes) {
  const headers = new Headers(source.headers)
  if (!headers.has('content-type')) headers.set('content-type', 'image/webp')
  return new Response(bytes, { status: 200, statusText: 'OK', headers })
}

async function verifyResponseForRevision(response, revision) {
  if (!response?.ok) return null
  const bytes = await response.arrayBuffer()
  const actual = await sha256Hex(bytes)
  if (actual !== expectedShaHex(revision)) return null
  return { bytes, response: responseFromBytes(response, bytes) }
}

async function previousRevisionResponse(artCache, request) {
  // Failure-only fallback. Full enumeration is forbidden on warm cache hits but is
  // acceptable as an exceptional offline recovery path.
  const requestUrl = new URL(request.url)
  const keys = await artCache.keys()
  for (const key of keys.reverse()) {
    const keyUrl = new URL(key.url)
    if (keyUrl.pathname === requestUrl.pathname && keyUrl.searchParams.has(DEX_ART_REV_PARAM)) {
      const cached = await artCache.match(key)
      if (cached) return cached
    }
  }
  return null
}

async function pruneDexArtCache(revisions) {
  if (!revisions?.assets) return
  const artCache = await caches.open(DEX_ART_CACHE_NAME)
  const expected = new Set(Object.values(revisions.assets)
    .filter((entry) => entry?.state === 'FORMAL' && entry.url && entry.revision)
    .map((entry) => {
      const url = new URL(entry.url.replace(/^\//, ''), BASE_URL)
      url.searchParams.set(DEX_ART_REV_PARAM, entry.revision)
      return url.href
    }))
  const keys = await artCache.keys()
  await Promise.all(keys.filter((key) => !expected.has(key.url)).map((key) => artCache.delete(key)))
}

async function handleMonsterAsset(request, url) {
  const relativePath = `/${url.pathname.slice(BASE_PATH.length)}`
  const revisions = await loadMonsterRevisions()
  const revision = revisions?.formalByUrl?.[relativePath]

  if (revision) {
    const artCache = await caches.open(DEX_ART_CACHE_NAME)
    const cacheKey = revisionCacheKey(request, revision)
    const cached = await artCache.match(cacheKey)
    if (cached) return cached

    try {
      const networkResponse = await fetch(request, { cache: 'no-store' })
      const verified = await verifyResponseForRevision(networkResponse, revision)
      if (!verified) return Response.error()
      await artCache.put(cacheKey, verified.response.clone())
      return verified.response
    } catch {
      return (await previousRevisionResponse(artCache, request)) || Response.error()
    }
  }

  // Non-FORMAL/candidate assets remain network-first and are not promoted into the
  // SHA-authoritative FORMAL art cache.
  const shellCache = await caches.open(SHELL_CACHE_NAME)
  try {
    const response = await fetch(request, { cache: 'no-store' })
    if (response.ok) await shellCache.put(request, response.clone())
    return response
  } catch {
    return (await shellCache.match(request)) || Response.error()
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'MANA_EVO_DEX_ART_REFRESH_MANIFEST') return
  event.waitUntil((async () => {
    const revisions = await loadMonsterRevisions({ refresh: true })
    await pruneDexArtCache(revisions)
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith(BASE_PATH)) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE_NAME)
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
      const cache = await caches.open(SHELL_CACHE_NAME)
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
    const cache = await caches.open(SHELL_CACHE_NAME)
    try {
      const response = await fetch(request, { cache: 'no-store' })
      if (response.ok) await cache.put(request, response.clone())
      return response
    } catch {
      return (await cache.match(request)) || Response.error()
    }
  })())
})
