import { test } from '@playwright/test'
import { createGameState } from '../src/game/progression.js'
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

test('W-218 Adventure layout diagnostics at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const learning = learningSave()
  const game = createGameState()
  game.ticketLots = [{ id: 'diag', amount: 3, earnedDay: 0, expiresDay: 999999 }]
  await page.addInitScript(({ learning, game }) => {
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({ formatVersion: 2, gameByProfile: { 'child-1': game } }))
  }, { learning, game })
  await page.goto('/')
  await page.getByRole('button', { name: 'ぼうけんへ！' }).click()
  const selectors = ['.adventure-map>.back','.adventure-map>.screen-title-row','.adventure-map>.kid-note','.premium-world-map','.area-zone-map','.daily-ticket-summary','.encounter-heading','.formal-stage-card:first-child','.formal-stage-card:first-child .stage-actions button','.game-bottom-nav']
  const snapshot = await page.evaluate((items) => Object.fromEntries(items.map((selector) => {
    const el = document.querySelector(selector)
    if (!el) return [selector, null]
    const r = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return [selector, { top: r.top, bottom: r.bottom, height: r.height, display: style.display, order: style.order, marginTop: style.marginTop, marginBottom: style.marginBottom }]
  })), selectors)
  console.log('W218_ADVENTURE_LAYOUT', JSON.stringify(snapshot))
})
