import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
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

test('iPhone WebKit always exposes the ring action and enables it at half HP', async ({ page }) => {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  const learning = learningSave()

  await page.addInitScript(({ learning, game }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({
      formatVersion: 2,
      gameByProfile: { 'child-1': game }
    }))
  }, { learning, game })

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

  await page.evaluate(() => {
    const envelope = JSON.parse(localStorage.getItem('mana-evo-save-v2'))
    const current = envelope.gameByProfile['child-1']
    current.activeBattle.enemy.hp = Math.floor(current.activeBattle.enemy.maxHp / 2)
    localStorage.setItem('mana-evo-save-v2', JSON.stringify(envelope))
  })
  await page.reload()

  await expect(page.getByText('「わ」を なげる！')).toBeVisible()
  const readyRing = page.getByRole('button', { name: /ほしのわを なげる/ })
  await expect(readyRing).toBeEnabled()
  await readyRing.click()
  await expect(page.getByText(/「わ」を なげた/).last()).toBeVisible()
})
