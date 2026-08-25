import { test, expect } from '@playwright/test'
import { createGameState } from '../src/game/progression.js'
import { EVOLUTION_ITEM_CATALOG, eligibleEvolutionItemsForArea } from '../src/game/explorationDomain.js'
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
    Math.random = () => 0.9
    localStorage.setItem('mana-evo:kids-quest-learning:v2', JSON.stringify(learning))
    localStorage.setItem('mana-evo-save-v2', JSON.stringify({
      formatVersion: 2,
      gameByProfile: { 'child-1': game }
    }))
  }, { learning, game })
}

function explorationGame() {
  const game = createGameState()
  game.explorePoint = 35
  game.explorationPityMissesByArea = { 1: 4 }
  game.adventureLocation = { area: 1, zoneId: 'meadow' }
  return game
}

test('iPhone WebKit can spend exploration points and complete the regional pity choice', async ({ page }) => {
  await installSave(page, explorationGame())
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: 'メインメニュー' })
  await navigation.getByRole('button', { name: /ぼうけん/ }).click()

  const exploration = page.getByRole('region', { name: 'シンカアイテムたんさく' })
  await expect(exploration).toBeVisible()
  await expect(exploration.getByText('35pt', { exact: true }).first()).toBeVisible()
  await expect(exploration.getByText('4/5', { exact: true })).toBeVisible()

  const run = exploration.getByRole('button', { name: '5ptで たんさく！' })
  await expect(run).toBeEnabled()
  await run.click()

  await expect(exploration.getByRole('status')).toHaveText('🧺 ふつうの そざいを みつけた！')
  await expect(exploration.getByText('30pt', { exact: true }).first()).toBeVisible()
  await expect(exploration.getByText('5/5', { exact: true })).toBeVisible()

  const eligible = eligibleEvolutionItemsForArea(1)
  for (const itemId of eligible) {
    await expect(exploration.getByRole('button', { name: EVOLUTION_ITEM_CATALOG[itemId].name, exact: true })).toBeVisible()
  }
  const foreign = eligibleEvolutionItemsForArea(2).find((itemId) => !eligible.includes(itemId))
  await expect(exploration.getByRole('button', { name: EVOLUTION_ITEM_CATALOG[foreign].name, exact: true })).toHaveCount(0)

  const selected = eligible[0]
  await exploration.getByRole('button', { name: EVOLUTION_ITEM_CATALOG[selected].name, exact: true }).click()
  await exploration.getByRole('button', { name: 'えらんで たんさく！' }).click()

  await expect(exploration.getByRole('status')).toHaveText(`✨ ${EVOLUTION_ITEM_CATALOG[selected].name}を みつけた！`)
  await expect(exploration.getByText('25pt', { exact: true }).first()).toBeVisible()
  await expect(exploration.getByText('0/5', { exact: true })).toBeVisible()
})

test('iPhone WebKit keeps Adventure focused before progressive browse is opened', async ({ page }) => {
  await installSave(page, explorationGame())
  await page.goto('/')
  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /ぼうけん/ }).click()

  await expect(page.locator('.world-area-route')).toHaveCount(1)
  await expect(page.locator('.world-area-tabs')).toHaveCount(0)
  await expect(page.locator('.stage-card')).toHaveCount(5)
  await expect(page.getByPlaceholder('なまえ・No.で さがす')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'シンカ', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'ほかも さがす' }).click()
  await expect(page.getByPlaceholder('なまえ・No.で さがす')).toBeVisible()
  await expect(page.getByRole('button', { name: 'やせい', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'とくべつ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ボス', exact: true })).toBeVisible()
})
