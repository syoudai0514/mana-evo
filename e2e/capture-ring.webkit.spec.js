import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
import { STAGES, speciesOf } from '../src/game/content.js'
import { attemptCapture, isStageUnlocked, startBattle, xpToNext } from '../src/game/engine.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'
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
      tasksClearedToday: 5,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0
    }
  }
}

async function installSave(page, game) {
  const learning = learningSave()
  await page.addInitScript(({ learning, game }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({
      formatVersion: 2,
      gameByProfile: { 'child-1': game }
    }))
  }, { learning, game })
}

function battleGameAtHalfHp({ rainbow = false, nearEvolution = false } = {}) {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  if (rainbow) game.captureItems.rainbow = 1

  if (nearEvolution) {
    const starter = game.box[game.team[0]]
    const evolution = speciesOf(starter.speciesId)?.evolution
    if (!evolution || evolution.method !== 'level' || !evolution.level) throw new Error('Starter must have a level evolution for WebKit E2E')
    starter.level = Math.max(1, evolution.level - 1)
    starter.xp = Math.max(0, xpToNext(starter.level) - 1)
  }

  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  if (!stage) throw new Error('No unlocked capturable wild stage for WebKit E2E')
  const started = startBattle(game, stage.id, {
    dailyCompleted: true,
    dailyDay: today,
    today
  })
  if (!started.ok || !started.game.activeBattle) throw new Error(`Could not start WebKit E2E battle: ${started.reason || 'unknown'}`)
  const battle = started.game.activeBattle
  battle.enemy.hp = Math.max(1, Math.floor(battle.enemy.maxHp / 2))
  return started.game
}

function pendingDuplicateGame() {
  const game = battleGameAtHalfHp({ rainbow: true })
  const battle = game.activeBattle
  const source = game.box[game.team[0]]
  const ownedDuplicateSpecies = {
    ...structuredClone(source),
    instanceId: 'duplicate-owner',
    speciesId: battle.enemy.speciesId,
    level: 1,
    xp: 0
  }
  game.box[ownedDuplicateSpecies.instanceId] = ownedDuplicateSpecies
  game.growthShards = 2

  const result = attemptCapture(game, battle, 0, 'rainbow')
  if (!result.ok || !result.duplicateChoiceRequired) throw new Error(`Could not prepare duplicate capture: ${result.reason || 'not pending'}`)
  return result.game
}

async function openCapture(page) {
  const captureButton = page.getByRole('button', { name: /わを なげる/ })
  await expect(captureButton).toBeVisible()
  await captureButton.click()
}

async function throwRainbow(page) {
  await openCapture(page)
  const rainbow = page.locator('.capture-item-grid').getByRole('button', { name: /にじのわ/ })
  await expect(rainbow).toBeEnabled()
  await rainbow.click()
  await page.getByRole('button', { name: /にじのわを なげる！/ }).click()
}

test('iPhone WebKit keeps capture focused and hidden until enemy HP is eligible', async ({ page }) => {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  await installSave(page, game)

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'マップへ！' })).toBeVisible()
  await page.getByRole('button', { name: 'マップへ！' }).click()

  const battleButtons = page.getByRole('button', { name: 'バトル！' })
  await expect(battleButtons.first()).toBeEnabled()
  await battleButtons.first().click()

  await expect(page.getByRole('button', { name: /わを なげる/ })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'どの「わ」をつかう？' })).toHaveCount(0)
})

test('iPhone WebKit plays the canonical four-star success sequence before GET', async ({ page }) => {
  await installSave(page, battleGameAtHalfHp({ rainbow: true }))
  await page.goto('/')
  await throwRainbow(page)

  const sequence = page.getByTestId('capture-sequence')
  await expect(sequence).toHaveAttribute('data-lit-stars', '1')
  await expect(sequence).toHaveAttribute('data-lit-stars', '2')
  await expect(sequence).toHaveAttribute('data-lit-stars', '3')
  await expect(sequence).toHaveAttribute('data-lit-stars', '4')
  await expect(page.getByText('ゲット！ ★★★★')).toBeVisible()
})

test('iPhone WebKit failed capture never displays four completed stars', async ({ page }) => {
  await installSave(page, battleGameAtHalfHp())
  await page.goto('/')
  await page.evaluate(() => {
    Object.defineProperty(Math, 'random', { configurable: true, value: () => 0.999999 })
  })
  expect(await page.evaluate(() => Math.random())).toBe(0.999999)
  await openCapture(page)

  const star = page.locator('.capture-item-grid').getByRole('button', { name: /ほしのわ/ })
  await star.click()
  await page.getByRole('button', { name: /ほしのわを なげる！/ }).click()

  const sequence = page.getByTestId('capture-sequence')
  await expect(sequence).toHaveAttribute('data-lit-stars', '1')
  await expect(sequence).not.toHaveAttribute('data-lit-stars', '4')
  await expect(sequence).toHaveAttribute('data-frame-type', 'ring_scatter')
  await expect(sequence).not.toHaveAttribute('data-lit-stars', '4')
  await expect(sequence).toHaveAttribute('data-frame-type', 'escaped')
  await expect(sequence).not.toHaveAttribute('data-lit-stars', '4')
})

test('iPhone WebKit restores duplicate choice after reload and redeems three shards to one team monster', async ({ page }) => {
  await installSave(page, pendingDuplicateGame())
  await page.goto('/')

  const keep = page.getByRole('button', { name: /なかまにする/ })
  const support = page.getByRole('button', { name: /おうえんにかえる/ })
  await expect(keep).toBeVisible()
  await expect(support).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /なかまにする/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /おうえんにかえる/ })).toBeVisible()
  await page.getByRole('button', { name: /おうえんにかえる/ }).click()

  await expect(page.getByText(/そだちのかけら 3こ/).first()).toBeVisible()
  const targets = page.locator('.growth-shard-targets button')
  await expect(targets).toHaveCount(1)
  await targets.first().click()
  await expect(page.getByText(/XP \+30/).first()).toBeVisible()
  await expect(page.getByText(/そだちのかけら 0こ/).first()).toBeVisible()
})

test('iPhone WebKit celebrates automatic battle-earned evolution exactly once', async ({ page }) => {
  await installSave(page, battleGameAtHalfHp({ rainbow: true, nearEvolution: true }))
  await page.goto('/')
  await throwRainbow(page)

  const evolution = page.getByRole('dialog', { name: 'シンカ！' })
  await expect(evolution).toBeVisible()
  await evolution.getByRole('button', { name: 'つづける！' }).click()
  await expect(evolution).toBeHidden()
  await page.waitForTimeout(700)
  await expect(page.getByRole('dialog', { name: 'シンカ！' })).toHaveCount(0)
})
