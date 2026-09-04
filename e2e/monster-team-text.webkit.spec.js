import { test, expect } from '@playwright/test'
import { createGameState } from '../src/game/progression.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'

const PORTRAIT_WIDTHS = [430, 390, 375]

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

function threeMonsterGame() {
  const game = createGameState()
  const firstId = game.team[0]
  const first = game.box[firstId]

  Object.assign(first, { speciesId: 'm035', level: 19, xp: 72 })
  const second = { ...first, instanceId: 'layout-team-2', speciesId: 'm011', level: 19, xp: 58 }
  const third = { ...first, instanceId: 'layout-team-3', speciesId: 'm006', level: 26, xp: 110 }

  game.box[second.instanceId] = second
  game.box[third.instanceId] = third
  game.team = [firstId, second.instanceId, third.instanceId]
  game.activeMonsterId = firstId
  return game
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

for (const width of PORTRAIT_WIDTHS) {
  test(`iPhone WebKit ${width}px keeps three team-card labels and names inside each card`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await installSave(page, threeMonsterGame())
    await page.goto('/')

    await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /モンスター/ }).click()

    const cards = page.locator('.monster-row.showcase')
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText('No.035')
    await expect(cards.nth(1)).toContainText('No.011')
    await expect(cards.nth(2)).toContainText('No.006')

    const metrics = await page.locator('.team-showcase').evaluate((root) => {
      const epsilon = 1
      return [...root.querySelectorAll('.monster-row.showcase')].map((card) => {
        const cardRect = card.getBoundingClientRect()
        const slot = card.querySelector('.team-slot-badge')
        const nameRow = card.querySelector('.monster-row-name')
        const name = nameRow?.querySelector('strong')
        const compactBadge = card.querySelector('.team-compact-badge')
        const slotRect = slot?.getBoundingClientRect()
        const nameRowRect = nameRow?.getBoundingClientRect()
        const nameRect = name?.getBoundingClientRect()
        const slotStyle = slot ? getComputedStyle(slot) : null

        const horizontallyInside = (rect) => rect && rect.left >= cardRect.left - epsilon && rect.right <= cardRect.right + epsilon

        return {
          slotInside: horizontallyInside(slotRect),
          nameRowInside: horizontallyInside(nameRowRect),
          nameInside: horizontallyInside(nameRect),
          slotNoWrap: slotStyle?.whiteSpace === 'nowrap',
          nameHasNoHorizontalOverflow: name ? name.scrollWidth <= name.clientWidth + epsilon : false,
          compactBadgeHidden: compactBadge ? getComputedStyle(compactBadge).display === 'none' : true
        }
      })
    })

    for (const metric of metrics) {
      expect(metric).toEqual({
        slotInside: true,
        nameRowInside: true,
        nameInside: true,
        slotNoWrap: true,
        nameHasNoHorizontalOverflow: true,
        compactBadgeHidden: true
      })
    }

    const pageOverflow = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      rootWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }))
    expect(pageOverflow.rootWidth, JSON.stringify(pageOverflow)).toBeLessThanOrEqual(pageOverflow.innerWidth + 1)
    expect(pageOverflow.bodyWidth, JSON.stringify(pageOverflow)).toBeLessThanOrEqual(pageOverflow.innerWidth + 1)
  })
}
