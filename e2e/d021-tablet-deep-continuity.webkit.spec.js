import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
import { STAGES } from '../src/game/content.js'
import { EVOLUTION_TRANSITIONS } from '../src/game/evolutionDomain.js'
import { isStageUnlocked, startBattle } from '../src/game/engine.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

function baseLearningSave(coreDone = true) {
  return {
    version: 4,
    contentVersion: 16,
    grade: 0,
    gradeMax: 0,
    settings: { tts: false, sfx: false, mode: 'normal' },
    pendingGameRewards: [],
    pendingProgressionSignals: [],
    daily: {
      date: todayKey(),
      coreDone,
      coreIndex: coreDone ? 5 : 0,
      coreTasks: coreDone ? [] : [{ uid: 'd021-keypad-core', kind: 'core', domainId: 'suuji', questionCount: 3 }],
      tasksClearedToday: coreDone ? 5 : 0,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0
    }
  }
}

function readyUnitStat(seed) {
  const today = dayNumber()
  return {
    attempts: 4,
    firstAttemptCorrect: 3,
    successDays: [today - 2, today - 1],
    itemRequirement: 1,
    itemKeys: [`ready:${seed}`]
  }
}

function keypadLearningSave() {
  const learning = baseLearningSave(false)
  learning.lessonSeen = { '0:suuji': 1 }
  learning.unitStats = {
    0: {
      suuji: {
        'math:count': readyUnitStat('count'),
        'math:compareCards': readyUnitStat('compare'),
        'math:add10': readyUnitStat('add10'),
        'math:make10': readyUnitStat('make10'),
        // Keep this unit intentionally in progress so nextLearningUnit selects it,
        // while attempts>0 + lessonSeen bypasses the lesson interstitial.
        'math:countKeypad': {
          attempts: 1,
          firstAttemptCorrect: 1,
          successDays: [dayNumber() - 1],
          itemRequirement: 1,
          itemKeys: ['n:countKeypad']
        }
      }
    }
  }
  return learning
}

async function installSave(page, game, { learning = baseLearningSave(true), pin = null } = {}) {
  await page.addInitScript(({ learningState, gameState, parentPin }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learningState))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({
      formatVersion: 2,
      gameByProfile: { 'child-1': gameState }
    }))
    if (parentPin) localStorage.setItem('mana-evo-parent-pin-v1', parentPin)
    else localStorage.removeItem('mana-evo-parent-pin-v1')
  }, { learningState: learning, gameState: game, parentPin: pin })
}

async function enterKeypadActivity(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'まなぶ！' }).click()
  await page.locator('.study-task').first().click()
  await expect(page.locator('.activity-screen')).toBeVisible()
  await expect(page.locator('.keypad')).toBeVisible()
}

async function learningSnapshot(page) {
  return page.evaluate(() => {
    const learning = JSON.parse(localStorage.getItem('mana-evo:kids-quest-learning:v2') || '{}')
    const currentDot = [...document.querySelectorAll('.progress-dots .dot')].findIndex((node) => node.classList.contains('dot--current'))
    return {
      instruction: document.querySelector('.activity-instruction')?.textContent?.replace(/\s+/g, '') || '',
      currentDot,
      attemptsToday: learning?.daily?.attemptsToday || 0,
      correctToday: learning?.daily?.correctToday || 0
    }
  })
}

function battleGameAtHalfHp({ rainbow = false } = {}) {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  if (rainbow) game.captureItems.rainbow = 1
  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  if (!stage) throw new Error('No unlocked capturable stage')
  const started = startBattle(game, stage.id, { dailyCompleted: true, dailyDay: today, today })
  if (!started.ok || !started.game.activeBattle) throw new Error(`Could not start battle: ${started.reason || 'unknown'}`)
  started.game.activeBattle.enemy.hp = Math.max(1, Math.floor(started.game.activeBattle.enemy.maxHp / 2))
  return started.game
}

async function captureSemanticSnapshot(page) {
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mana-evo-save-v2') || '{}')
    const game = saved?.gameByProfile?.['child-1'] || {}
    const battle = game.activeBattle || {}
    const settlementId = battle.rewardResolutionId ? `${battle.rewardResolutionId}:capture` : null
    return {
      battleId: battle.battleId || null,
      status: battle.status || null,
      turn: battle.turn ?? null,
      captureAttempts: battle.captureAttempts || 0,
      rewardResolutionId: battle.rewardResolutionId || null,
      rainbowBalls: game.captureItems?.rainbow || 0,
      settlement: settlementId ? game.captureDomain?.settlements?.[settlementId] || null : null
    }
  })
}

function stoneEvolutionGame() {
  const transition = EVOLUTION_TRANSITIONS.find((entry) => entry.method === 'stone' && entry.itemId)
  if (!transition) throw new Error('No stone evolution transition')
  const game = createGameState()
  const instanceId = game.team[0]
  const current = game.box[instanceId]
  game.box[instanceId] = {
    ...current,
    speciesId: transition.fromSpeciesId,
    level: Math.max(20, current.level || 1),
    xp: 0,
    evolutionReady: false,
    heldItemId: null
  }
  game.activeMonsterId = instanceId
  game.dex = game.dex || { seen: {}, caught: {} }
  game.dex.seen = { ...(game.dex.seen || {}), [transition.fromSpeciesId]: true }
  game.dex.caught = { ...(game.dex.caught || {}), [transition.fromSpeciesId]: true }
  game.evolutionItems = game.evolutionItems || { stones: {}, heldItems: {} }
  game.evolutionItems.stones = { ...(game.evolutionItems.stones || {}), [transition.itemId]: 1 }
  return { game, transition, instanceId }
}

async function monsterEvolutionSnapshot(page, instanceId, itemId) {
  return page.evaluate(({ targetInstanceId, targetItemId }) => {
    const saved = JSON.parse(localStorage.getItem('mana-evo-save-v2') || '{}')
    const game = saved?.gameByProfile?.['child-1'] || {}
    return {
      speciesId: game.box?.[targetInstanceId]?.speciesId || null,
      stoneCount: game.evolutionItems?.stones?.[targetItemId] || 0,
      evolutionDiscoveries: game.evolutionDiscoveries || {}
    }
  }, { targetInstanceId: instanceId, targetItemId: itemId })
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

test('D-021 Learning preserves meaningful unsubmitted keypad input and progress across rotation', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, createGameState(), { learning: keypadLearningSave() })
  await enterKeypadActivity(page)

  const keypad = page.locator('.keypad')
  const display = page.locator('.answer-display')
  await keypad.getByRole('button', { name: '1', exact: true }).click()
  await expect(display).toHaveText('1')
  const before = await learningSnapshot(page)
  expect(before.currentDot).toBeGreaterThanOrEqual(0)

  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(display).toHaveText('1')
  expect(await learningSnapshot(page)).toEqual(before)

  await page.setViewportSize({ width: 600, height: 820 })
  await expect(display).toHaveText('1')
  expect(await learningSnapshot(page)).toEqual(before)
})

test('D-021 CapturePresentation survives resize without replaying capture settlement', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, battleGameAtHalfHp({ rainbow: true }))
  await page.goto('/')

  await page.getByRole('button', { name: /ボールを なげる/ }).click()
  const panel = page.getByRole('dialog', { name: 'どのボールをつかう？' })
  await panel.locator('.capture-item-grid').getByRole('button', { name: /^にじボール / }).click()
  await panel.getByRole('button', { name: 'にじボールを なげる！', exact: true }).click()

  const presentation = page.getByRole('dialog', { name: '捕獲演出' })
  await expect(presentation).toBeVisible()
  await expect.poll(async () => (await captureSemanticSnapshot(page)).captureAttempts).toBe(1)
  const before = await captureSemanticSnapshot(page)
  expect(before.status).toBe('caught')
  expect(before.rainbowBalls).toBe(0)

  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(presentation).toBeVisible()

  await expect(presentation).toBeHidden({ timeout: 9000 })
  const after = await captureSemanticSnapshot(page)
  expect(after).toEqual(before)
  expect(after.captureAttempts).toBe(1)
})

test('D-021 Monster-origin Evolution acknowledgement survives rotation without duplicate evolution', async ({ page }) => {
  const { game, transition, instanceId } = stoneEvolutionGame()
  await page.setViewportSize({ width: 820, height: 1180 })
  await installSave(page, game)
  await page.goto('/')

  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()
  const shell = page.locator('.app-shell[data-layout-contract="d021"]')
  await expect(shell).toHaveAttribute('data-layout-surface', 'compact')
  await page.getByRole('button', { name: /いま シンカする/ }).click()

  const evolution = page.getByRole('dialog', { name: 'シンカ！' })
  await expect(evolution).toBeVisible()
  await expect(evolution).toHaveAttribute('data-layout-surface', 'contextual')
  const heading = (await evolution.locator('h2').textContent())?.replace(/\s+/g, '') || ''
  await expect.poll(async () => (await monsterEvolutionSnapshot(page, instanceId, transition.itemId)).speciesId).toBe(transition.toSpeciesId)
  const before = await monsterEvolutionSnapshot(page, instanceId, transition.itemId)
  expect(before.stoneCount).toBe(0)

  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(evolution).toBeVisible()
  expect(((await evolution.locator('h2').textContent()) || '').replace(/\s+/g, '')).toBe(heading)
  await expectReachable(page, evolution.getByRole('button', { name: 'つづける！' }))

  await page.setViewportSize({ width: 600, height: 820 })
  await expect(evolution).toBeVisible()
  expect(await monsterEvolutionSnapshot(page, instanceId, transition.itemId)).toEqual(before)
})

test('D-021 active Learning feedback remains reachable at keyboard-like low height', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 600 })
  await installSave(page, createGameState(), { learning: keypadLearningSave() })
  await enterKeypadActivity(page)

  await page.setViewportSize({ width: 820, height: 420 })
  const keypad = page.locator('.keypad')
  await keypad.getByRole('button', { name: '0', exact: true }).click()
  await keypad.getByRole('button', { name: 'OK', exact: true }).click()

  const feedback = page.locator('.feedback')
  await expect(feedback).toBeVisible()
  await expectReachable(page, feedback)
  const geometry = await feedback.boundingBox()
  const viewport = page.viewportSize()
  expect(geometry).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(geometry.x).toBeGreaterThanOrEqual(-1)
  expect(geometry.x + geometry.width).toBeLessThanOrEqual(viewport.width + 1)
})
