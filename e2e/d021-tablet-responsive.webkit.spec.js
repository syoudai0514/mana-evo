import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
import { STAGES, speciesOf } from '../src/game/content.js'
import { isStageUnlocked, startBattle, xpToNext } from '../src/game/engine.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

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
        { uid: 'd021-core-1', domainId: 'yomu', questionCount: 3 },
        { uid: 'd021-core-2', domainId: 'suuji', questionCount: 3 }
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

async function enterFirstActivity(page) {
  await page.locator('.study-task').first().click()
  const lesson = page.locator('.lesson-screen')
  if (await lesson.count()) {
    await expect(lesson).toBeVisible()
    await lesson.locator('.app-header__back').click()
  }
  await expect(page.locator('.activity-screen')).toBeVisible()
}

function semanticText(value) {
  return String(value || '').replace(/\s+/g, '')
}

async function expectSurfaceWidth(locator, { min = 0, max = Infinity } = {}) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box.width).toBeGreaterThanOrEqual(min)
  expect(box.width).toBeLessThanOrEqual(max)
}

async function expectInsideNearestBoundedAncestor(locator) {
  await expect(locator).toBeVisible()
  const result = await locator.evaluate((node) => {
    const child = node.getBoundingClientRect()
    let ancestor = node.parentElement
    let boundary = null
    while (ancestor && ancestor !== document.body) {
      const style = getComputedStyle(ancestor)
      const rect = ancestor.getBoundingClientRect()
      const clips = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)
      const effectivelyBounded = rect.width + 1 < window.innerWidth
      if (clips || effectivelyBounded) {
        boundary = rect
        break
      }
      ancestor = ancestor.parentElement
    }
    return {
      child: { left: child.left, right: child.right, width: child.width },
      boundary: boundary ? { left: boundary.left, right: boundary.right, width: boundary.width } : null
    }
  })
  expect(result.boundary, JSON.stringify(result)).not.toBeNull()
  expect(result.child.left, JSON.stringify(result)).toBeGreaterThanOrEqual(result.boundary.left - 1)
  expect(result.child.right, JSON.stringify(result)).toBeLessThanOrEqual(result.boundary.right + 1)
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

test('D-021 surface ownership keeps Compact narrow and Workspace/Contextual free of the 520px ceiling', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, createGameState(), { coreDone: false, pin: '1234' })
  await page.goto('/')

  await expectSurfaceWidth(page.locator('.home-screen'), { max: 522 })

  const nav = page.getByRole('navigation', { name: 'メインメニュー' })
  await nav.getByRole('button', { name: /まなぶ/ }).click()
  await enterFirstActivity(page)
  await expectSurfaceWidth(page.locator('.activity-screen'), { min: 560, max: 762 })

  await page.locator('.app-header__back').click()
  await page.getByRole('button', { name: '← ホーム' }).click()
  await page.getByRole('button', { name: /おうちのひと/ }).click()
  await expectSurfaceWidth(page.locator('.parent-gate-screen'), { min: 560, max: 762 })

  await page.getByRole('button', { name: '← ホーム' }).click()
  await nav.getByRole('button', { name: /モンスター/ }).click()
  await page.getByRole('button', { name: /ずかん/ }).click()
  await expectSurfaceWidth(page.locator('.monster-screen-v2'), { min: 560, max: 762 })

  await installSave(page, battleGameAtHalfHp())
  await page.reload()
  await expectSurfaceWidth(page.locator('.battle-screen-v2'), { min: 560, max: 762 })
})

test('D-021 Learning keeps the same active question and decision across rotation', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, createGameState(), { coreDone: false })
  await page.goto('/')
  await page.getByRole('button', { name: 'まなぶ！' }).click()
  await enterFirstActivity(page)

  const instruction = page.locator('.activity-instruction')
  const visual = page.locator('.qcard, .qcard-passage-wrap').first()
  const decision = page.locator('.choice-grid:visible, .interaction-wrap:visible').first()
  await expect(instruction).toBeVisible()
  await expect(visual).toBeVisible()
  await expect(decision).toBeVisible()
  const before = {
    instruction: semanticText(await instruction.textContent()),
    visual: semanticText(await visual.textContent()),
    decision: semanticText(await decision.textContent())
  }

  await page.setViewportSize({ width: 1180, height: 820 })
  expect(semanticText(await instruction.textContent())).toBe(before.instruction)
  expect(semanticText(await visual.textContent())).toBe(before.visual)
  expect(semanticText(await decision.textContent())).toBe(before.decision)
  await expectInsideNearestBoundedAncestor(visual)
  await expectInsideNearestBoundedAncestor(decision)

  await page.setViewportSize({ width: 600, height: 820 })
  expect(semanticText(await instruction.textContent())).toBe(before.instruction)
  expect(semanticText(await visual.textContent())).toBe(before.visual)
  expect(semanticText(await decision.textContent())).toBe(before.decision)
  await expectInsideNearestBoundedAncestor(decision)
})

test('D-021 Capture preserves selected local substate across portrait-landscape-reduced resize', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, battleGameAtHalfHp())
  await page.goto('/')

  await page.getByRole('button', { name: /ボールを なげる/ }).click()
  const panel = page.getByRole('dialog', { name: 'どのボールをつかう？' })
  await expect(panel).toBeVisible()
  const enabled = panel.locator('.capture-item-grid button:not([disabled])')
  const count = await enabled.count()
  expect(count).toBeGreaterThan(0)
  const chosen = enabled.nth(Math.max(0, count - 1))
  await chosen.click()
  await expect(chosen).toHaveAttribute('aria-pressed', 'true')

  const before = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mana-evo-save-v2') || '{}')
    const battle = saved?.gameByProfile?.['child-1']?.activeBattle
    return { battleId: battle?.battleId, attempts: battle?.captureAttempts || 0 }
  })

  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(panel).toBeVisible()
  await expect(chosen).toHaveAttribute('aria-pressed', 'true')

  await page.setViewportSize({ width: 600, height: 820 })
  await expect(panel).toBeVisible()
  await expect(chosen).toHaveAttribute('aria-pressed', 'true')
  await expectInsideNearestBoundedAncestor(panel.locator('.capture-item-grid'))
  await expectReachable(page, panel.locator('.capture-actions .primary'))

  const after = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mana-evo-save-v2') || '{}')
    const battle = saved?.gameByProfile?.['child-1']?.activeBattle
    return { battleId: battle?.battleId, attempts: battle?.captureAttempts || 0 }
  })
  expect(after).toEqual(before)
})

test('D-021 Dex search/detail semantics survive rotation without replacing D-020 history context', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  const game = createGameState()
  const starter = game.box[game.team[0]]
  const species = speciesOf(starter.speciesId)
  await installSave(page, game)
  await page.goto('/')

  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()
  await page.getByRole('button', { name: /ずかん/ }).click()
  await page.getByRole('button', { name: /しぼりこむ/ }).click()
  const search = page.getByRole('textbox', { name: 'なまえや ナンバーで さがす' })
  await search.fill(species.name)

  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(search).toHaveValue(species.name)

  await page.getByRole('button', { name: new RegExp(`No\\.${species.no} ${species.name}`) }).click()
  const detail = page.locator('.dex-detail')
  await expect(detail).toBeVisible()
  const before = await page.evaluate(() => ({
    state: history.state,
    session: sessionStorage.getItem('manaevo-dex-browse-context-v1')
  }))

  await page.setViewportSize({ width: 600, height: 820 })
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('data-dex-detail-id', starter.speciesId)
  const after = await page.evaluate(() => ({
    state: history.state,
    session: sessionStorage.getItem('manaevo-dex-browse-context-v1')
  }))
  expect(after).toEqual(before)
})

test('D-021 Parent PIN input survives presentation-only rotation', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, createGameState(), { pin: '1234' })
  await page.goto('/')
  await page.getByRole('button', { name: /おうちのひと/ }).click()

  const pin = page.locator('.parent-pin-input')
  await pin.fill('12')
  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(pin).toHaveValue('12')
  await expectReachable(page, page.getByRole('button', { name: '保護者メニューを ひらく' }))
})

test('D-021 Evolution acknowledgement survives rotation with the same from-to reward', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, battleGameAtHalfHp({ rainbow: true, nearEvolution: true }))
  await page.goto('/')
  await page.getByRole('button', { name: /ボールを なげる/ }).click()
  await page.locator('.capture-item-grid').getByRole('button', { name: /にじボール/ }).click()
  await page.getByRole('button', { name: /にじボールを なげる！/ }).click()

  const evolution = page.getByRole('dialog', { name: 'シンカ！' })
  await expect(evolution).toBeVisible({ timeout: 9000 })
  const beforeText = semanticText(await evolution.locator('h2').textContent())

  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(evolution).toBeVisible()
  expect(semanticText(await evolution.locator('h2').textContent())).toBe(beforeText)
  await expectReachable(page, evolution.getByRole('button', { name: 'つづける！' }))
})

test('D-021 low-height landscape keeps Battle primary decisions reachable', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 600 })
  await installSave(page, battleGameAtHalfHp())
  await page.goto('/')

  await expectInsideNearestBoundedAncestor(page.locator('.move-grid'))
  await expectReachable(page, page.locator('.move-grid button').first())
  await expectReachable(page, page.getByRole('button', { name: /ボールを なげる/ }))
})

test('D-021 target manifest imposes no ManaEvo orientation preference', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBeTruthy()
  const manifest = await response.json()
  expect(manifest.orientation).toBeUndefined()
})
