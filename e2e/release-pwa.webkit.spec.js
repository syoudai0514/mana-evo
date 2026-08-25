import { test, expect } from '@playwright/test'

test('release PWA installs under /mana-evo, owns only ManaEvo caches, and preserves state after SW takeover', async ({ page }) => {
  const response = await page.goto('/mana-evo/', { waitUntil: 'domcontentloaded' })
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('#root')).not.toBeEmpty()

  await page.evaluate(() => {
    localStorage.setItem('w220-release-save-sentinel', 'preserve-me')
  })

  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready
    return {
      scope: ready.scope,
      activeState: ready.active?.state || null
    }
  })
  expect(registration.scope).toBe('http://127.0.0.1:4173/mana-evo/')
  expect(registration.activeState).toBe('activated')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('w220-release-save-sentinel'))).toBe('preserve-me')

  const cacheProof = await page.evaluate(async () => {
    const cacheNames = await caches.keys()
    const owned = cacheNames.filter((name) => name.startsWith('manaevo-pwa-'))
    const foreign = cacheNames.filter((name) => !name.startsWith('manaevo-pwa-'))
    const paths = []

    for (const name of owned) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) paths.push(new URL(request.url).pathname)
    }

    return {
      owned,
      foreign,
      hasRoot: paths.includes('/mana-evo/'),
      hasEntryAsset: paths.some((pathname) => pathname.startsWith('/mana-evo/assets/'))
    }
  })

  expect(cacheProof.owned.length).toBeGreaterThan(0)
  expect(cacheProof.foreign).toEqual([])
  expect(cacheProof.hasRoot).toBeTruthy()
  expect(cacheProof.hasEntryAsset).toBeTruthy()
})
