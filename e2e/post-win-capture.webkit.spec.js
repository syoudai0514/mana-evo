import { test, expect } from '@playwright/test'
import { STAGES } from '../src/game/content.js'
import { isStageUnlocked, startBattle, useMove } from '../src/game/engine.js'
import { addTickets, createGameState } from '../src/game/progression.js'
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

function postWinGame() {
  const today = dayNumber()
  let game = addTickets(createGameState(), 3, today)
  game.captureItems.star = Math.max(2, Number(game.captureItems.star) || 0)
  game.captureItems.rainbow = 1

  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  if (!stage) throw new Error('No unlocked capturable wild stage for post-win WebKit E2E')
  const started = startBattle(game, stage.id, {
    dailyCompleted: true,
    dailyDay: today,
    today
  })
  if (!started.ok) throw new Error(`Could not start post-win WebKit battle: ${started.reason || 'unknown'}`)

  const battle = structuredClone(started.battle)
  battle.enemy.hp = 1
  battle.partyHp[battle.activeInstanceId] = 9999
  const won = useMove(started.game, battle, 'm004-stable')
  if (!won.ok || won.battle.status !== 'won' || won.battle.enemy.hp !== 0) {
    throw new Error(`Could not prepare defeated enemy: ${won.reason || won.battle?.status || 'unknown'}`)
  }
  return won.game
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

async function installCaptureFailureRandomGate(page) {
  await page.addInitScript(() => {
    const originalRandom = Math.random.bind(Math)
    const OriginalNumber = Number
    Math.random = () => {
      if (document.documentElement?.dataset.postWinCaptureRoll === 'fail') {
        document.documentElement.dataset.postWinForcedCaptureRoll = 'used'
        return 0.999999
      }
      return originalRandom()
    }
    globalThis.Number = new Proxy(OriginalNumber, {
      apply(target, thisArg, args) {
        if (document.documentElement?.dataset.postWinCaptureRoll === 'fail' && args[0] === null) return NaN
        return Reflect.apply(target, thisArg, args)
      },
      construct(target, args, newTarget) {
        return Reflect.construct(target, args, newTarget)
      }
    })
  })
}

async function savedGame(page) {
  return page.evaluate(() => {
    const envelope = JSON.parse(localStorage.getItem('mana-evo-save-v2') || '{}')
    return envelope.gameByProfile?.['child-1'] || null
  })
}

function rewardSnapshot(game) {
  const battle = game.activeBattle
  const activeId = battle.activeInstanceId
  const active = game.box[activeId]
  return {
    mana: game.mana,
    battlesWon: game.battlesWon,
    stagesCleared: game.stagesCleared,
    normalStageSnapshots: game.normalStageSnapshots,
    activeSpeciesId: active.speciesId,
    activeLevel: active.level,
    activeXp: active.xp,
    activeHp: battle.partyHp[activeId],
    turn: battle.turn,
    ticketSettlement: battle.ticketSettlement,
    rewardResolutionId: battle.rewardResolutionId
  }
}

async function openCapture(page) {
  const button = page.getByRole('button', { name: /ボールを なげる/ })
  await expect(button).toBeVisible({ timeout: 9000 })
  await button.click()
  await expect(page.getByRole('dialog', { name: 'どのボールをつかう？' })).toBeVisible()
}

async function throwRing(page, ringName, confirmName) {
  const ring = page.locator('.capture-item-grid').getByRole('button', { name: ringName })
  await expect(ring).toBeEnabled()
  await ring.click()
  await page.getByRole('button', { name: confirmName }).click()
}

test('iPhone WebKit keeps post-win throws after failure/reload without retaliation or victory reward replay', async ({ page }) => {
  await installSave(page, postWinGame())
  await installCaptureFailureRandomGate(page)
  await page.goto('/')

  await expect(page.getByText('かち！ 🎉')).toBeVisible({ timeout: 9000 })
  const before = await savedGame(page)
  expect(before.activeBattle.status).toBe('won')
  expect(before.activeBattle.enemy.hp).toBe(0)
  const beforeRewards = rewardSnapshot(before)
  const beforeAttempts = before.activeBattle.captureAttempts || 0
  const beforeStar = before.captureItems.star
  const beforeRainbow = before.captureItems.rainbow
  const beforeCaught = before.monstersCaught || 0

  await openCapture(page)
  await page.locator('html').evaluate((element) => { element.dataset.postWinCaptureRoll = 'fail' })
  await throwRing(page, /ほしボール/, /ほしボールを なげる！/)

  const sequence = page.getByTestId('capture-sequence')
  await expect(sequence).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-post-win-forced-capture-roll', 'used')
  await expect(sequence).toHaveAttribute('data-frame-type', 'escaped', { timeout: 9000 })
  await expect(sequence).toBeHidden({ timeout: 9000 })
  await page.locator('html').evaluate((element) => { delete element.dataset.postWinCaptureRoll })

  await expect(page.getByText('かち！ 🎉')).toBeVisible()
  await expect(page.getByRole('button', { name: /ボールを なげる/ })).toBeVisible()

  const afterFailure = await savedGame(page)
  expect(afterFailure.activeBattle.status).toBe('won')
  expect(afterFailure.activeBattle.enemy.hp).toBe(0)
  expect(afterFailure.activeBattle.captureAttempts).toBe(beforeAttempts + 1)
  expect(afterFailure.captureItems.star).toBe(beforeStar - 1)
  expect(afterFailure.monstersCaught || 0).toBe(beforeCaught)
  expect(rewardSnapshot(afterFailure)).toEqual(beforeRewards)

  await page.reload()
  await expect(page.getByText('かち！ 🎉')).toBeVisible({ timeout: 9000 })
  await expect(page.getByRole('button', { name: /ボールを なげる/ })).toBeVisible()

  await openCapture(page)
  await throwRing(page, /にじボール/, /にじボールを なげる！/)
  await expect(page.getByText('ゲット！ ★★★★')).toBeVisible({ timeout: 9000 })

  const afterSuccess = await savedGame(page)
  expect(afterSuccess.activeBattle.status).toBe('caught')
  expect(afterSuccess.activeBattle.captureAttempts).toBe(beforeAttempts + 2)
  expect(afterSuccess.captureItems.rainbow).toBe(beforeRainbow - 1)
  expect(afterSuccess.monstersCaught).toBe(beforeCaught + 1)

  const afterSuccessRewards = rewardSnapshot({
    ...afterSuccess,
    activeBattle: {
      ...afterSuccess.activeBattle,
      partyHp: before.activeBattle.partyHp,
      turn: before.activeBattle.turn,
      ticketSettlement: before.activeBattle.ticketSettlement,
      rewardResolutionId: before.activeBattle.rewardResolutionId
    }
  })
  expect(afterSuccessRewards).toEqual(beforeRewards)
})
