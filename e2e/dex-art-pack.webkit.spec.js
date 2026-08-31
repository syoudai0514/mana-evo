import { test, expect } from '@playwright/test'
import { createGameState } from '../src/game/progression.js'
import { ACTIVE_MONSTER_IDS } from '../src/game/monsterData.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

function learningSave() {
  return {
    version: 4,
    contentVersion: 16,
    grade: 0,
    gradeMax: 0,
    settings: { tts: false, sfx: false, mode: 'normal' },
    pendingGameRewards: [],
    daily: {
      date: todayKey(),
      coreDone: true,
      coreIndex: 5,
      coreTasks: [],
      tasksClearedToday: 5,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0
    }
  }
}

function allSeenGame() {
  const game = createGameState()
  game.dex = game.dex || { seen: {}, caught: {} }
  for (const id of ACTIVE_MONSTER_IDS) {
    game.dex.seen[id] = true
    game.dex.caught[id] = true
  }
  return game
}

async function installSave(page, { pin = '1234', allSeen = true } = {}) {
  const learning = learningSave()
  const game = allSeen ? allSeenGame() : createGameState()
  await page.addInitScript(({ learning, game, pin }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({ formatVersion: 2, gameByProfile: { 'child-1': game } }))
    localStorage.setItem('mana-evo-parent-pin-v1', pin)
  }, { learning, game, pin })
}

async function ensureServiceWorkerControl(page) {
  await page.evaluate(async () => navigator.serviceWorker.ready)
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBeTruthy()
}

test('Dex uses bounded viewport art work and does not leave orphan detail history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSave(page)
  await page.goto('/')

  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()
  const monsterRequests = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/monsters/')) monsterRequests.push(request.url())
  })
  await page.getByRole('button', { name: /ずかん/ }).click()
  await expect(page.locator('.dex-screen')).toBeVisible()
  await page.waitForTimeout(600)

  const activeSources = await page.locator('.dex-art-window[data-art-active="1"] img').count()
  expect(activeSources).toBeGreaterThan(0)
  expect(activeSources).toBeLessThan(100)
  expect(new Set(monsterRequests).size).toBeLessThan(100)

  const a = page.getByRole('button', { name: /No\.100 / })
  await a.scrollIntoViewIfNeeded()
  const beforeTop = (await a.boundingBox())?.y ?? 0
  await a.click()
  await expect(page.locator('[data-dex-detail-id]')).toBeVisible()

  const topNav = page.locator('.dex-detail-nav:not(.bottom)')
  await topNav.getByRole('button', { name: /つぎ/ }).click()
  const bId = await page.locator('[data-dex-detail-id]').getAttribute('data-dex-detail-id')
  expect(bId).toBeTruthy()
  await topNav.getByRole('button', { name: 'ずかんへ' }).click()
  await expect(page.locator('.dex-screen')).toBeVisible()
  await expect(page.locator('[data-dex-detail-id]')).toHaveCount(0)

  const returnedA = page.getByRole('button', { name: /No\.100 / })
  const afterTop = (await returnedA.boundingBox())?.y ?? 0
  expect(Math.abs(afterTop - beforeTop)).toBeLessThan(8)

  const c = page.getByRole('button', { name: /No\.150 / })
  await c.scrollIntoViewIfNeeded()
  await c.click()
  await expect(page.locator('[data-dex-detail-id]')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.dex-screen')).toBeVisible()
  await expect(page.locator('[data-dex-detail-id]')).toHaveCount(0)
  expect(await page.locator(`[data-dex-detail-id="${bId}"]`).count()).toBe(0)
})

test('Parent download creates a verified 238-key pack that renders all 238 offline', async ({ page, context }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await installSave(page, { allSeen: false })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(async () => navigator.serviceWorker.ready)
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: 'domcontentloaded' })
  }
  await ensureServiceWorkerControl(page)

  await page.getByRole('button', { name: /おうちのひと/ }).click()
  await page.locator('.parent-pin-input').fill('1234')
  await page.getByRole('button', { name: '保護者メニューを ひらく' }).click()
  await expect(page.getByText('👨‍👩‍👧 保護者メニュー', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /画像を端末保存/ }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('dex-art-pack-controls').getByRole('button', { name: /モンスター画像を全部保存|不足分を修復/ }).click()
  await expect(page.getByTestId('dex-art-pack-controls').getByText('238/238', { exact: true })).toBeVisible({ timeout: 120_000 })
  await expect(page.getByTestId('dex-art-pack-controls').getByText(/保存済み/)).toBeVisible()

  const preOffline = await page.evaluate(async () => {
    const cache = await caches.open('manaevo-dex-art-v1')
    const keys = await cache.keys()
    const manifestResponse = await fetch('/monster-asset-revisions.json', { cache: 'no-store' })
    const manifest = await manifestResponse.json()
    const revision = manifest?.formalByUrl?.['/monsters/m001.webp'] || null
    const expected = revision ? new URL(`/monsters/m001.webp?__manaevo_rev=${encodeURIComponent(revision)}`, location.href).href : null
    const exact = expected ? await cache.match(expected) : null
    return {
      controller: navigator.serviceWorker.controller?.scriptURL || null,
      keyCount: keys.length,
      revision,
      expectedKey: expected,
      exactMatch: Boolean(exact),
      exactStatus: exact?.status || null,
      manifestSchemaVersion: manifest?.schemaVersion ?? null,
      manifestRevision: manifest?.manifestRevision || null
    }
  })
  expect(preOffline.keyCount).toBe(238)
  expect(preOffline.exactMatch).toBeTruthy()

  // Playwright WebKit's context.setOffline(true) can reject requests before the
  // Service Worker can satisfy them from CacheStorage. Instead, make the origin
  // unavailable for direct monster requests while keeping the Service Worker alive.
  // Any Service-Worker-originated monster network fetch is also a hard failure.
  const serviceWorkerMonsterNetwork = []
  context.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/monsters/') && request.serviceWorker()) {
      serviceWorkerMonsterNetwork.push(request.url())
    }
  })
  await context.route('**/monsters/**', async (route) => {
    await route.abort('internetdisconnected')
  })

  const offlineResult = await page.evaluate(async () => {
    const failures = []
    for (let i = 1; i <= 238; i += 1) {
      const id = `m${String(i).padStart(3, '0')}`
      const img = new Image()
      img.src = `/monsters/${id}.webp`
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('load'))
        })
        if (typeof img.decode === 'function') await img.decode().catch(() => {})
      } catch {
        failures.push(id)
      }
      img.src = ''
    }
    return failures
  })

  if (offlineResult.length || serviceWorkerMonsterNetwork.length) {
    throw new Error(`OFFLINE-238 failed: imageFailures=${offlineResult.length}/238; swNetwork=${serviceWorkerMonsterNetwork.length}; pre=${JSON.stringify(preOffline)}; firstImageFailures=${offlineResult.slice(0, 8).join(',')}; firstSwNetwork=${serviceWorkerMonsterNetwork.slice(0, 4).join(',')}`)
  }
})

test('Dex detail can traverse No.001 to No.238 and back without growing retained image resources', async ({ page, context }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await installSave(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(async () => navigator.serviceWorker.ready)
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: 'domcontentloaded' })
  }
  await ensureServiceWorkerControl(page)

  const swMonsterNetwork = []
  const swManifestNetwork = []
  context.on('request', (request) => {
    if (!request.serviceWorker()) return
    const path = new URL(request.url()).pathname
    if (path.startsWith('/monsters/')) swMonsterNetwork.push(request.url())
    if (path.endsWith('/monster-asset-revisions.json')) swManifestNetwork.push(request.url())
  })

  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()
  await page.getByRole('button', { name: /ずかん/ }).click()
  await page.getByRole('button', { name: /No\.001 / }).click()
  await expect(page.locator('[data-dex-detail-id="m001"]')).toBeVisible()

  const forward = await page.evaluate(async () => {
    let maxImages = 0
    for (let i = 1; i < 238; i += 1) {
      const button = document.querySelector('.dex-detail-nav:not(.bottom) button[aria-label^="つぎのモンスター"]')
      if (!button || button.disabled) return { error: `forward stopped at ${i}`, maxImages, id: document.querySelector('[data-dex-detail-id]')?.getAttribute('data-dex-detail-id') }
      button.click()
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      maxImages = Math.max(maxImages, document.querySelectorAll('.dex-detail img').length)
    }
    return { maxImages, id: document.querySelector('[data-dex-detail-id]')?.getAttribute('data-dex-detail-id') }
  })
  expect(forward.error).toBeUndefined()
  expect(forward.id).toBe('m238')
  expect(forward.maxImages).toBeLessThanOrEqual(3)

  await page.waitForTimeout(1200)
  const networkAfterForward = swMonsterNetwork.length
  const manifestAfterForward = swManifestNetwork.length

  const backward = await page.evaluate(async () => {
    let maxImages = 0
    for (let i = 237; i >= 1; i -= 1) {
      const button = document.querySelector('.dex-detail-nav:not(.bottom) button[aria-label^="まえのモンスター"]')
      if (!button || button.disabled) return { error: `backward stopped at ${i}`, maxImages, id: document.querySelector('[data-dex-detail-id]')?.getAttribute('data-dex-detail-id') }
      button.click()
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      maxImages = Math.max(maxImages, document.querySelectorAll('.dex-detail img').length)
    }
    return { maxImages, id: document.querySelector('[data-dex-detail-id]')?.getAttribute('data-dex-detail-id') }
  })
  expect(backward.error).toBeUndefined()
  expect(backward.id).toBe('m001')
  expect(backward.maxImages).toBeLessThanOrEqual(3)

  await page.waitForTimeout(1200)
  expect(swMonsterNetwork.length).toBe(networkAfterForward)
  expect(swManifestNetwork.length).toBe(manifestAfterForward)
})
