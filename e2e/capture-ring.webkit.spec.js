import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
import { STAGES } from '../src/game/content.js'
import { isStageUnlocked, startBattle } from '../src/game/engine.js'
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

function battleGameAtHalfHp() {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
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

test('iPhone WebKit always exposes the ring action before half HP', async ({ page }) => {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  await installSave(page, game)

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'マップへ！' })).toBeVisible()
  await page.getByRole('button', { name: 'マップへ！' }).click()

  const battleButtons = page.getByRole('button', { name: 'バトル！' })
  await expect(battleButtons.first()).toBeEnabled()
  await battleButtons.first().click()

  await expect(page.getByText('「わ」を なげるには HPを はんぶんいかに！')).toBeVisible()
  const starRing = page.getByRole('button', { name: /ほしのわを なげる/ })
  await expect(starRing).toBeVisible()
  await expect(starRing).toBeDisabled()
})

test('iPhone WebKit restores a half-HP battle and can throw a ring', async ({ page }) => {
  await installSave(page, battleGameAtHalfHp())
  await page.goto('/')

  await expect(page.getByText('「わ」を なげる！')).toBeVisible()
  const readyRing = page.getByRole('button', { name: /ほしのわを なげる/ })
  await expect(readyRing).toBeEnabled()
  await readyRing.click()
  await expect(page.getByText(/「わ」を なげた/).last()).toBeVisible()
})
