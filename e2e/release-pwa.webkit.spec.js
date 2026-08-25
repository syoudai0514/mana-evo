import { test, expect } from '@playwright/test'

test('release PWA installs under /mana-evo and keeps browser state usable offline', async ({ page, context }) => {
  const response = await page.goto('/mana-evo/', { waitUntil: 'domcontentloaded' })
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('#root')).not.toBeEmpty()

  await page.evaluate(() => {
    localStorage.setItem('w220-release-save-sentinel', 'preserve-me')
  })

  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return registration.scope
  })
  expect(scope).toBe('http://127.0.0.1:4173/mana-evo/')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  const cacheNames = await page.evaluate(() => caches.keys())
  expect(cacheNames.length).toBeGreaterThan(0)
  expect(cacheNames.every((name) => name.startsWith('manaevo-pwa-'))).toBeTruthy()

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('w220-release-save-sentinel'))).toBe('preserve-me')
  await context.setOffline(false)
})
