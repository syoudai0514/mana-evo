import { test, expect } from '@playwright/test'
import { createGameState, addTickets } from '../src/game/progression.js'
import { STAGES } from '../src/game/content.js'
import { isStageUnlocked, startBattle } from '../src/game/engine.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'

const LEARNING_KEY = 'mana-evo:kids-quest-learning:v2'
const GAME_KEY = 'mana-evo-save-v2'
const DEVICE_PROFILE_KEY = 'manaevo:device-profile:v1'
const PIN_KEY = 'mana-evo-parent-pin-v1'

function learningState({ coreDone = false, coreIndex = coreDone ? 5 : 0 } = {}) {
  return {
    version: 4,
    contentVersion: 16,
    grade: 0,
    gradeMax: 0,
    settings: { tts: false, sfx: false, mode: 'normal' },
    unitStats: {}, writingStats: {}, englishWordStats: {}, englishPhraseStats: {}, englishAlphabetStats: {},
    starTrials: {}, lessonSeen: {}, domainAccuracy: {}, srs: {}, history: {}, pendingGameRewards: [],
    daily: {
      date: todayKey(),
      coreDone,
      coreIndex,
      coreTasks: [
        { uid: 'uxa-core-1', domainId: 'yomu', questionCount: 4 },
        { uid: 'uxa-core-2', domainId: 'suuji', questionCount: 4 },
        { uid: 'uxa-core-3', domainId: 'english', questionCount: 4 },
        { uid: 'uxa-core-4', domainId: 'seikatsu', questionCount: 4 },
        { uid: 'uxa-core-5', domainId: 'doutoku', questionCount: 4 }
      ],
      tasksClearedToday: coreDone ? 5 : coreIndex,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0,
      extraIndex: 0,
      okawariIndex: 0
    }
  }
}

async function install(page, { learning, games, pin = null }) {
  await page.addInitScript(({ learningKey, gameKey, pinKey, learning, games, pin }) => {
    if (localStorage.getItem(learningKey) == null) localStorage.setItem(learningKey, JSON.stringify(learning))
    if (localStorage.getItem(gameKey) == null) localStorage.setItem(gameKey, JSON.stringify({ formatVersion: 2, gameByProfile: games }))
    if (pin && localStorage.getItem(pinKey) == null) localStorage.setItem(pinKey, pin)
  }, { learningKey: LEARNING_KEY, gameKey: GAME_KEY, pinKey: PIN_KEY, learning, games, pin })
}

function twoProfileFixture() {
  const today = dayNumber()
  const first = learningState({ coreDone: true })
  const second = learningState({ coreDone: true })
  const learning = {
    ...first,
    activeProfileId: 'child-1',
    profiles: {
      'child-1': { name: 'ぼうけんしゃ 1', state: first },
      'child-2': { name: 'みどり', state: second }
    }
  }
  const game1 = addTickets(createGameState(), 1, today)
  const game2 = addTickets(createGameState(), 4, today)
  game1.mana = 11
  game2.mana = 22
  return { learning, games: { 'child-1': game1, 'child-2': game2 } }
}

function capturableBattleGame() {
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  if (!stage) throw new Error('Bundle A requires an unlocked capturable wild stage')
  const started = startBattle(game, stage.id, { dailyCompleted: true, dailyDay: today, today })
  if (!started.ok) throw new Error(`Could not start battle: ${started.reason}`)
  started.game.activeBattle.enemy.hp = Math.max(1, Math.floor(started.game.activeBattle.enemy.maxHp / 2))
  return started.game
}

test('child can see and switch the active profile without Parent PIN, with per-profile game isolation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const fixture = twoProfileFixture()
  await install(page, fixture)
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'いまのプレイヤー なまえをきめよう' })
  await expect(trigger).toBeVisible()
  await expect(page.locator('.resource-pill.ticket strong')).toHaveText('1')
  await expect(page.locator('.resource-pill.mana strong')).toHaveText('11')

  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'だれが つかう？' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: /なまえをきめよう/ })).toBeVisible()
  await dialog.getByRole('button', { name: /みどり/ }).click()

  await expect(page.getByRole('button', { name: 'いまのプレイヤー みどり' })).toBeVisible()
  await expect(page.locator('.resource-pill.ticket strong')).toHaveText('4')
  await expect(page.locator('.resource-pill.mana strong')).toHaveText('22')
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DEVICE_PROFILE_KEY)).toBe('child-2')

  await page.reload()
  await expect(page.getByRole('button', { name: 'いまのプレイヤー みどり' })).toBeVisible()
  await expect(page.locator('.resource-pill.mana strong')).toHaveText('22')

  const games = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).gameByProfile, GAME_KEY)
  expect(games['child-1'].mana).toBe(11)
  expect(games['child-2'].mana).toBe(22)
})

test('Parent can rename a profile and open cloud management without entering the same PIN twice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const fixture = twoProfileFixture()
  await install(page, { ...fixture, pin: '1234' })
  await page.goto('/')

  await page.getByRole('button', { name: /おうちのひと/ }).click()
  await page.locator('.parent-pin-input').fill('1234')
  await page.getByRole('button', { name: '🔓 保護者メニューを ひらく' }).click()

  const nameInput = page.getByRole('textbox', { name: 'なまえをきめようの なまえ' })
  await expect(nameInput).toBeVisible()
  await nameInput.fill('まさき')
  await page.getByRole('button', { name: '名前を保存' }).first().click()
  await expect(page.getByText('✓ いま使っている：まさき')).toBeVisible()

  await page.getByRole('button', { name: '☁️ クラウド・TESTをひらく' }).click()
  const cloud = page.getByRole('dialog', { name: 'アカウントとクラウド保存' })
  await expect(cloud).toBeVisible()
  await expect(page.locator('.adult-cloud-gate')).toHaveCount(0)
  await cloud.getByRole('button', { name: '×' }).click()

  await page.getByRole('button', { name: 'ホームへ' }).click()
  await expect(page.getByRole('button', { name: 'いまのプレイヤー まさき' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'いまのプレイヤー まさき' })).toBeVisible()
})

test('Study presents one guided daily action, a visible grade goal, and always-visible other learning modes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const learning = learningState({ coreDone: false, coreIndex: 0 })
  await install(page, { learning, games: { 'child-1': createGameState() } })
  await page.goto('/')

  await page.getByRole('button', { name: /まなぶ！/ }).click()
  await expect(page.getByRole('button', { name: /おまかせで まなぶ！/ })).toBeVisible()
  await expect(page.locator('.study-task')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'このがくねんのゴール' })).toBeVisible()
  await expect(page.getByText('ほかの まなび', { exact: true })).toBeVisible()
  for (const label of ['じゆうべんきょう', 'とっくん', 'ほしのしれん', 'えいごずかん']) {
    await expect(page.getByRole('button', { name: new RegExp(label) })).toBeVisible()
  }
  await expect(page.getByText(/たんげん/)).toHaveCount(0)
})

test('shared chrome is thinner but keeps 44px-class tap targets in portrait and landscape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const fixture = twoProfileFixture()
  await install(page, fixture)
  await page.goto('/')

  const measure = async () => page.evaluate(() => ({
    header: document.querySelector('.game-header')?.getBoundingClientRect().height || 0,
    nav: document.querySelector('.game-bottom-nav')?.getBoundingClientRect().height || 0,
    navButtons: [...document.querySelectorAll('.game-bottom-nav button')].map((element) => element.getBoundingClientRect().height),
    profile: document.querySelector('.child-profile-trigger')?.getBoundingClientRect().height || 0,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }))

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    const geometry = await measure()
    expect(geometry.header).toBeLessThanOrEqual(68)
    expect(geometry.nav).toBeLessThanOrEqual(64)
    expect(geometry.profile).toBeGreaterThanOrEqual(44)
    expect(geometry.navButtons.every((height) => height >= 44)).toBe(true)
    expect(geometry.overflow).toBeLessThanOrEqual(1)
  }
})

test('Adventure encounter rank and art do not overlap at iPhone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const today = dayNumber()
  const game = addTickets(createGameState(), 3, today)
  await install(page, { learning: learningState({ coreDone: true }), games: { 'child-1': game } })
  await page.goto('/')

  await page.getByRole('navigation', { name: 'メインメニュー' }).getByRole('button', { name: /ぼうけん/ }).click()
  const card = page.locator('.formal-stage-card').first()
  await expect(card).toBeVisible()
  const geometry = await card.evaluate((element) => {
    const number = element.querySelector('.stage-number')?.getBoundingClientRect()
    const art = element.querySelector('.encounter-art')?.getBoundingClientRect()
    const tag = element.querySelector('.recommendation-tag')?.getBoundingClientRect()
    return number && art ? {
      numberRight: number.right,
      artLeft: art.left,
      artRight: art.right,
      tagLeft: tag?.left ?? Number.POSITIVE_INFINITY
    } : null
  })
  expect(geometry).not.toBeNull()
  expect(geometry.numberRight).toBeLessThanOrEqual(geometry.artLeft + 1)
  expect(geometry.artRight).toBeLessThanOrEqual(geometry.tagLeft + 1)
})

test('selected capture ball produces an unmistakably enabled throw CTA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await install(page, { learning: learningState({ coreDone: true }), games: { 'child-1': capturableBattleGame() } })
  await page.goto('/')

  await page.getByRole('button', { name: /ボールを なげる/ }).click()
  const star = page.locator('.capture-item-grid').getByRole('button', { name: /ほしボール/ })
  await star.click()
  const throwButton = page.getByRole('button', { name: /ほしボールを なげる！/ })
  await expect(throwButton).toBeEnabled()
  const style = await throwButton.evaluate((element) => {
    const computed = getComputedStyle(element)
    return { color: computed.color, backgroundImage: computed.backgroundImage, opacity: computed.opacity }
  })
  expect(style.color).toBe('rgb(255, 255, 255)')
  expect(style.backgroundImage).not.toBe('none')
  expect(Number(style.opacity)).toBeGreaterThanOrEqual(0.99)
})
