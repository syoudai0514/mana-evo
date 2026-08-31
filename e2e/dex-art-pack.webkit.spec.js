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

async function openDex(page) {
  const nav = page.getByRole('navigation', { name: 'メインメニュー' })
  await nav.getByRole('button', { name: /モンスター/ }).click()
  await page.getByRole('button', { name: /ずかん/ }).click()
  await expect(page.locator('.dex-screen')).toBeVisible()
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

  const keyCount = await page.evaluate(async () => {
    const cache = await caches.open('manaevo-dex-art-v1')
    return (await cache.keys()).length
  })
  expect(keyCount).toBe(238)

  await context.setOffline(true)
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
  expect(offlineResult).toEqual([])
})
