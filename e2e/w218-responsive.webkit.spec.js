import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
import { STAGES, speciesOf } from '../src/game/content.js'
import { isStageUnlocked, startBattle, xpToNext } from '../src/game/engine.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

const PORTRAIT_WIDTHS = [430, 390, 375]

function learningSave(coreDone = true) {
  return {
    version: 4,
    contentVersion: 16,
    grade: 0,
    gradeMax: 0,
    settings: { tts: false, sfx: false, mode: 'normal' },
    pendingGameRewards: [],
    daily: {
      date: todayKey(),
      coreDone,
      coreIndex: coreDone ? 5 : 0,
      coreTasks: coreDone ? [] : [
        { uid: 'w218-core-1', domainId: 'yomu', questionCount: 3 },
        { uid: 'w218-core-2', domainId: 'suuji', questionCount: 3 }
      ],
      tasksClearedToday: coreDone ? 5 : 0,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0
    }
  }
}

async function installSave(page, game, { coreDone = true, pin = null } = {}) {
  const learning = learningSave(coreDone)
  await page.addInitScript(({ learning, game, pin }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({
      formatVersion: 2,
      gameByProfile: { 'child-1': game }
    }))
    if (pin) localStorage.setItem('mana-evo-parent-pin-v1', pin)
    else localStorage.removeItem('mana-evo-parent-pin-v1')
  }, { learning, game, pin })
}

function battleGameAtHalfHp({ rainbow = false, nearEvolution = false } = {}) {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  if (rainbow) game.captureItems.rainbow = 1
  if (nearEvolution) {
    const starter = game.box[game.team[0]]
    const evolution = speciesOf(starter.speciesId)?.evolution
    if (!evolution || evolution.method !== 'level' || !evolution.level) throw new Error('Starter must have a level evolution')
    starter.level = Math.max(1, evolution.level - 1)
    starter.xp = Math.max(0, xpToNext(starter.level) - 1)
  }
  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  if (!stage) throw new Error('No unlocked capturable stage')
  const started = startBattle(game, stage.id, { dailyCompleted: true, dailyDay: today, today })
  if (!started.ok || !started.game.activeBattle) throw new Error(`Could not start battle: ${started.reason || 'unknown'}`)
  started.game.activeBattle.enemy.hp = Math.max(1, Math.floor(started.game.activeBattle.enemy.maxHp / 2))
  return started.game
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    rootWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }))
  expect(metrics.rootWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.bodyWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1)
}

async function expectFirstDecisionVisible(page, locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  const nav = page.locator('.game-bottom-nav:visible')
  const navBox = await nav.count() ? await nav.boundingBox() : null
  const usableBottom = viewport.height - (navBox?.height || 0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y, `decision begins below usable viewport: ${JSON.stringify({ box, viewport, navBox })}`).toBeLessThan(usableBottom)
  expect(box.y + Math.min(box.height, 44), `decision tap surface clipped: ${JSON.stringify({ box, viewport, navBox })}`).toBeLessThanOrEqual(usableBottom + 1)
}

for (const width of PORTRAIT_WIDTHS) {
  test(`iPhone WebKit ${width}px keeps top-level child decisions bounded`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const game = createGameState()
    await installSave(page, game, { coreDone: false, pin: '1234' })
    await page.goto('/')

    await expectFirstDecisionVisible(page, page.getByRole('button', { name: 'まなぶ！' }))
    await expectNoHorizontalOverflow(page)

    await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /まなぶ/ }).click()
    await expectFirstDecisionVisible(page, page.locator('.study-task').first())
    await expectNoHorizontalOverflow(page)

    await page.getByRole('button', { name: '← ホーム' }).click()
    await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()
    await expectFirstDecisionVisible(page, page.locator('.monster-row.showcase').first())
    await expectNoHorizontalOverflow(page)

    await page.getByRole('button', { name: /ずかん/ }).click()
    await expectFirstDecisionVisible(page, page.locator('.dex-grid>div').first())
    await expectNoHorizontalOverflow(page)

    await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /あそびかた/ }).click()
    await expectFirstDecisionVisible(page, page.locator('.howto-home-card').first())
    await expectNoHorizontalOverflow(page)

    await page.getByRole('button', { name: '← ホームへ' }).click()
    await page.getByRole('button', { name: /おうちのひと/ }).click()
    await expectFirstDecisionVisible(page, page.getByRole('button', { name: '保護者メニューを ひらく' }))
    await expectNoHorizontalOverflow(page)
  })

  test(`iPhone WebKit ${width}px keeps Adventure Battle and Capture decisions visible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await installSave(page, createGameState(), { coreDone: true })
    await page.goto('/')
    await page.getByRole('button', { name: 'ぼうけんへ！' }).click()

    await expectFirstDecisionVisible(page, page.getByRole('button', { name: 'バトル！' }).first())
    await expectNoHorizontalOverflow(page)

    await installSave(page, battleGameAtHalfHp())
    await page.reload()
    await expectFirstDecisionVisible(page, page.locator('.move-grid button').first())
    await expectNoHorizontalOverflow(page)

    const capture = page.getByRole('button', { name: /ボールを なげる/ })
    await expectFirstDecisionVisible(page, capture)
    await capture.click()
    await expectFirstDecisionVisible(page, page.locator('.capture-main-cta'))
    await expectNoHorizontalOverflow(page)
  })

  test(`iPhone WebKit ${width}px keeps evolution completion action in the focused viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await installSave(page, battleGameAtHalfHp({ rainbow: true, nearEvolution: true }))
    await page.goto('/')
    await page.getByRole('button', { name: /ボールを なげる/ }).click()
    const rainbow = page.locator('.capture-item-grid').getByRole('button', { name: /にじボール/ })
    await rainbow.click()
    await page.getByRole('button', { name: /にじボールを なげる！/ }).click()

    const evolution = page.getByRole('dialog', { name: 'シンカ！' })
    await expect(evolution).toBeVisible({ timeout: 9000 })
    await expectFirstDecisionVisible(page, evolution.getByRole('button', { name: 'つづける！' }))
    await expectNoHorizontalOverflow(page)
  })
}

test('iPhone WebKit keeps a separate scroll position for each top-level destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSave(page, createGameState(), { coreDone: false })
  await page.goto('/')

  const nav = page.getByRole('navigation', { name: 'メインメニュー' })
  await page.evaluate(() => window.scrollTo(0, Math.min(document.body.scrollHeight - window.innerHeight, 360)))
  const homeY = await page.evaluate(() => window.scrollY)
  expect(homeY).toBeGreaterThan(40)

  await nav.getByRole('button', { name: /まなぶ/ }).click()
  await expect(page.locator('.study-hub')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)

  await page.evaluate(() => window.scrollTo(0, Math.min(document.body.scrollHeight - window.innerHeight, 240)))
  const studyY = await page.evaluate(() => window.scrollY)
  expect(studyY).toBeGreaterThan(20)

  await nav.getByRole('button', { name: /ホーム/ }).click()
  await expect(page.locator('.home-screen')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(homeY - 30)

  await nav.getByRole('button', { name: /まなぶ/ }).click()
  await expect(page.locator('.study-hub')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(studyY - 30)
})
