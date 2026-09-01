import { test, expect } from '@playwright/test'
import { createGameState } from '../src/game/progression.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

async function installReadySave(page, { pin = '1234' } = {}) {
  const game = createGameState()
  const learning = {
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
  await page.addInitScript(({ learning, game, pin }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({ formatVersion: 2, gameByProfile: { 'child-1': game } }))
    localStorage.setItem('mana-evo-parent-pin-v1', pin)
  }, { learning, game, pin })
}

async function expectNoHorizontalPageOverflow(page) {
  const geometry = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }))
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1)
}

async function expectReachable(page, locator) {
  await expect(locator).toBeVisible()
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box.y).toBeGreaterThanOrEqual(-1)
  expect(box.y + Math.min(box.height, 44)).toBeLessThanOrEqual(viewport.height + 1)
}

test('D-021 550px boundary keeps Compact centered while Workspace fits the available viewport', async ({ page }) => {
  await page.setViewportSize({ width: 550, height: 820 })
  await installReadySave(page)
  await page.goto('/')

  const shell = page.locator('.app-shell[data-layout-contract="d021"]')
  await expect(shell).toHaveAttribute('data-layout-surface', 'compact')
  const compact = await shell.boundingBox()
  expect(compact).not.toBeNull()
  expect(compact.width).toBeLessThanOrEqual(522)
  await expectNoHorizontalPageOverflow(page)

  await page.getByRole('button', { name: /おうちのひと/ }).click()
  await expect(shell).toHaveAttribute('data-layout-surface', 'workspace')
  const workspace = await shell.boundingBox()
  expect(workspace).not.toBeNull()
  expect(workspace.width).toBeGreaterThan(compact.width)
  expect(workspace.width).toBeLessThanOrEqual(550)
  await expectNoHorizontalPageOverflow(page)
})

test('D-021 keyboard-height reduction keeps Parent PIN, Dex search and Adventure search reachable', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 600 })
  await installReadySave(page)
  await page.goto('/')

  await page.getByRole('button', { name: /おうちのひと/ }).click()
  const pin = page.locator('.parent-pin-input')
  await pin.fill('12')
  await pin.focus()
  await page.setViewportSize({ width: 820, height: 420 })
  await expect(pin).toHaveValue('12')
  await expectReachable(page, page.getByRole('button', { name: '保護者メニューを ひらく' }))

  await page.setViewportSize({ width: 820, height: 600 })
  await page.getByRole('button', { name: '← ホーム' }).click()
  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()
  await page.getByRole('button', { name: /ずかん/ }).click()
  await page.getByRole('button', { name: /しぼりこむ/ }).click()
  const dexSearch = page.getByRole('textbox', { name: 'なまえや ナンバーで さがす' })
  await dexSearch.fill('ヒノ')
  await dexSearch.focus()
  await page.setViewportSize({ width: 820, height: 420 })
  await expect(dexSearch).toHaveValue('ヒノ')
  await expectReachable(page, dexSearch)

  await page.setViewportSize({ width: 820, height: 600 })
  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /ぼうけん/ }).click()
  await page.getByRole('button', { name: 'ほかも さがす' }).click()
  const adventureSearch = page.locator('input.monster-search')
  await adventureSearch.fill('ヒノ')
  await adventureSearch.focus()
  await page.setViewportSize({ width: 820, height: 420 })
  await expect(adventureSearch).toHaveValue('ヒノ')
  await expectReachable(page, adventureSearch)
  await expectNoHorizontalPageOverflow(page)
})
