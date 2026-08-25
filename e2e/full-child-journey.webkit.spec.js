import { test, expect } from '@playwright/test'

import { createGameState, addTickets } from '../src/game/progression.js'
import { deriveLearningRewardRuntime } from '../src/kids-quest-study/state/learningRewardRuntime.js'
import { todayKey } from '../src/kids-quest-study/engine/storage.js'
import { dayNumber } from '../src/kids-quest-study/engine/srs.js'

const LEARNING_KEY = 'mana-evo:kids-quest-learning:v2'
const GAME_KEY = 'mana-evo-save-v2'
const REWARD_KEY = 'mana-evo:learning-reward-bridge:v1'

function learningState({ coreDone = false, coreIndex = coreDone ? 5 : 0 } = {}) {
  return {
    version: 4,
    contentVersion: 16,
    grade: 0,
    gradeMax: 0,
    settings: { tts: false, sfx: false, mode: 'normal' },
    unitStats: {},
    writingStats: {},
    englishWordStats: {},
    englishPhraseStats: {},
    starTrials: {},
    lessonSeen: {},
    domainAccuracy: {},
    srs: {},
    daily: {
      date: todayKey(),
      coreDone,
      coreIndex,
      coreTasks: [
        { uid: 'w219-core-1', domainId: 'yomu', questionCount: 4 },
        { uid: 'w219-core-2', domainId: 'suuji', questionCount: 4 },
        { uid: 'w219-core-3', domainId: 'english', questionCount: 4 },
        { uid: 'w219-core-4', domainId: 'seikatsu', questionCount: 4 },
        { uid: 'w219-core-5', domainId: 'doutoku', questionCount: 4 }
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

function canonicalDailyCompletionRuntime() {
  const previous = learningState({ coreDone: false, coreIndex: 4 })
  const next = learningState({ coreDone: true, coreIndex: 5 })
  return deriveLearningRewardRuntime({}, previous, next, {
    type: 'CLEAR_TASK',
    kind: 'core',
    domainId: 'doutoku'
  })
}

async function replaceStorage(page, { learning, games, rewards = {} }) {
  await page.evaluate(({ learningKey, gameKey, rewardKey, learning, games, rewards }) => {
    localStorage.setItem(learningKey, JSON.stringify(learning))
    localStorage.setItem(gameKey, JSON.stringify({ formatVersion: 2, gameByProfile: games }))
    localStorage.setItem(rewardKey, JSON.stringify({ version: 1, byProfile: rewards }))
  }, {
    learningKey: LEARNING_KEY,
    gameKey: GAME_KEY,
    rewardKey: REWARD_KEY,
    learning,
    games,
    rewards
  })
  await page.reload()
}

async function storedGame(page, profileId = 'child-1') {
  return page.evaluate(({ gameKey, profileId }) => {
    const envelope = JSON.parse(localStorage.getItem(gameKey))
    return envelope.gameByProfile[profileId]
  }, { gameKey: GAME_KEY, profileId })
}

async function storedRewardRuntime(page, profileId = 'child-1') {
  return page.evaluate(({ rewardKey, profileId }) => {
    const envelope = JSON.parse(localStorage.getItem(rewardKey))
    return envelope.byProfile?.[profileId]
  }, { rewardKey: REWARD_KEY, profileId })
}

function totalTicketGrantCount(game) {
  return (game.ticketGrants || []).reduce((sum, grant) => sum + Number(grant?.count || 0), 0)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.9
  })
})

test('clean child goes Home -> Study, canonical daily completion applies once, then Home -> Adventure', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: /まなぶ！/ })).toBeVisible()
  await page.getByRole('button', { name: /まなぶ！/ }).click()
  await expect(page.getByRole('heading', { name: /の まなび/ })).toBeVisible()

  const completedLearning = learningState({ coreDone: true, coreIndex: 5 })
  const rewardRuntime = canonicalDailyCompletionRuntime()
  const cleanGame = createGameState()
  const expectedStarRings = (cleanGame.captureItems?.star || 0) + 3
  await replaceStorage(page, {
    learning: completedLearning,
    games: { 'child-1': cleanGame },
    rewards: { 'child-1': rewardRuntime }
  })

  await expect(page.getByRole('button', { name: /ぼうけんへ！/ })).toBeVisible()
  await expect(page.locator('.resource-pill.ticket strong')).toHaveText('3')
  await expect(page.locator('.resource-pill.star strong')).toHaveText(String(expectedStarRings))

  await expect.poll(async () => {
    const game = await storedGame(page)
    return {
      tickets: totalTicketGrantCount(game),
      star: game.captureItems?.star || 0,
      explorePoint: game.explorePoint || 0,
      appliedRewardCount: game.appliedLearningRewardIds?.length || 0,
      appliedSignalCount: game.appliedLearningProgressionSignalIds?.length || 0
    }
  }).toMatchObject({
    tickets: 3,
    star: expectedStarRings,
    explorePoint: 2,
    appliedRewardCount: 1,
    appliedSignalCount: 2
  })

  await expect.poll(async () => {
    const runtime = await storedRewardRuntime(page)
    return {
      rewards: runtime?.pendingGameRewards?.length || 0,
      signals: runtime?.pendingProgressionSignals?.length || 0
    }
  }).toEqual({ rewards: 0, signals: 0 })

  const once = await storedGame(page)
  await page.reload()
  await expect(page.getByRole('button', { name: /ぼうけんへ！/ })).toBeVisible()
  const afterReload = await storedGame(page)
  expect(totalTicketGrantCount(afterReload)).toBe(totalTicketGrantCount(once))
  expect(afterReload.captureItems?.star).toBe(once.captureItems?.star)
  expect(afterReload.explorePoint).toBe(once.explorePoint)
  expect(afterReload.appliedLearningRewardIds).toEqual(once.appliedLearningRewardIds)
  expect(afterReload.appliedLearningProgressionSignalIds).toEqual(once.appliedLearningProgressionSignalIds)

  await page.getByRole('button', { name: /ぼうけんへ！/ }).click()
  await expect(page.locator('.world-overview-heading').getByText(/エリア1/).first()).toBeVisible()
  const visibleDefaultEncounters = page.locator('.stage-card')
  await expect(visibleDefaultEncounters).toHaveCount(5)
})

test('battle focus reserves once across reload and explicit abandon refunds the original ticket', async ({ page }) => {
  await page.goto('/')

  const today = dayNumber()
  const game = addTickets(createGameState(), 1, today)
  await replaceStorage(page, {
    learning: learningState({ coreDone: true, coreIndex: 5 }),
    games: { 'child-1': game }
  })

  const navigation = page.getByRole('navigation', { name: 'メインメニュー' })
  await navigation.getByRole('button', { name: /ぼうけん/ }).click()
  await page.getByRole('button', { name: 'バトル！' }).first().click()

  await expect(navigation).toHaveCount(0)
  const reserved = await storedGame(page)
  expect(reserved.activeBattle?.ticketSettlement).toBe('reserved')
  expect(reserved.activeBattle?.ticketCommitted).toBe(false)
  expect(totalTicketGrantCount(reserved)).toBe(0)
  const battleId = reserved.activeBattle?.battleId

  await page.reload()
  await expect(page.getByRole('button', { name: '✕ やめる' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'メインメニュー' })).toHaveCount(0)
  const resumed = await storedGame(page)
  expect(resumed.activeBattle?.battleId).toBe(battleId)
  expect(resumed.activeBattle?.ticketSettlement).toBe('reserved')
  expect(totalTicketGrantCount(resumed)).toBe(0)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '✕ やめる' }).click()
  await expect(page.getByRole('navigation', { name: 'メインメニュー' })).toBeVisible()

  await expect.poll(async () => {
    const refunded = await storedGame(page)
    return {
      activeBattle: refunded.activeBattle,
      tickets: totalTicketGrantCount(refunded)
    }
  }).toEqual({ activeBattle: null, tickets: 1 })
})

test('manual stone evolution is Monster-owned, modal, and records first evolution discovery', async ({ page }) => {
  await page.goto('/')

  const game = createGameState()
  const instanceId = game.activeMonsterId
  game.box[instanceId] = {
    ...game.box[instanceId],
    speciesId: 'm026',
    level: 30,
    xp: 0,
    heldItemId: null,
    evolutionReady: false
  }
  game.team = [instanceId]
  game.dex.seen.m026 = true
  game.dex.caught.m026 = true
  game.evolutionItems.stones.thunder = 1

  await replaceStorage(page, {
    learning: learningState({ coreDone: true, coreIndex: 5 }),
    games: { 'child-1': game }
  })

  const navigation = page.getByRole('navigation', { name: 'メインメニュー' })
  await expect(navigation.getByRole('button')).toHaveCount(5)
  await expect(navigation.getByRole('button', { name: /ホーム/ })).toBeVisible()
  await expect(navigation.getByRole('button', { name: /まなぶ/ })).toBeVisible()
  await expect(navigation.getByRole('button', { name: /ぼうけん/ })).toBeVisible()
  await expect(navigation.getByRole('button', { name: /モンスター/ })).toBeVisible()
  await expect(navigation.getByRole('button', { name: /あそびかた/ })).toBeVisible()
  await expect(navigation.getByRole('button', { name: /バトル|GET|ずかん|シンカ/ })).toHaveCount(0)

  await navigation.getByRole('button', { name: /モンスター/ }).click()
  const evolve = page.getByRole('button', { name: /いま シンカする！/ })
  await expect(evolve).toBeVisible()
  await evolve.click()

  const celebration = page.getByRole('dialog', { name: 'シンカ！' })
  await expect(celebration).toBeVisible()
  await expect(celebration).toHaveAttribute('aria-modal', 'true')
  await expect(celebration.getByText(/ぼうけんで であえる こうほ/)).toBeVisible()

  await expect.poll(async () => {
    const saved = await storedGame(page)
    return {
      speciesId: saved.box?.[instanceId]?.speciesId,
      discovery: saved.evolutionDiscoveries?.m027 === true,
      stoneCount: saved.evolutionItems?.stones?.thunder || 0
    }
  }).toEqual({ speciesId: 'm027', discovery: true, stoneCount: 0 })

  await celebration.getByRole('button', { name: 'つづける！' }).click()
  await expect(celebration).toHaveCount(0)
})

test('stable learning profile id selects an isolated game save across reload', async ({ page }) => {
  await page.goto('/')

  const today = dayNumber()
  const childOneLearning = learningState({ coreDone: true, coreIndex: 5 })
  const childTwoLearning = learningState({ coreDone: true, coreIndex: 5 })
  const learningEnvelope = {
    ...childOneLearning,
    activeProfileId: 'child-1',
    profiles: {
      'child-1': { name: 'あお', state: childOneLearning },
      'child-2': { name: 'みどり', state: childTwoLearning }
    }
  }
  const childOneGame = addTickets(createGameState(), 1, today)
  childOneGame.mana = 11
  const childTwoGame = addTickets(createGameState(), 4, today)
  childTwoGame.mana = 22

  await replaceStorage(page, {
    learning: learningEnvelope,
    games: { 'child-1': childOneGame, 'child-2': childTwoGame }
  })

  await expect(page.locator('.resource-pill.ticket strong')).toHaveText('1')
  await expect(page.locator('.resource-pill.mana strong')).toHaveText('11')

  await page.evaluate(({ learningKey }) => {
    const current = JSON.parse(localStorage.getItem(learningKey))
    const selected = current.profiles['child-2'].state
    localStorage.setItem(learningKey, JSON.stringify({
      ...current,
      ...selected,
      activeProfileId: 'child-2',
      profiles: current.profiles
    }))
  }, { learningKey: LEARNING_KEY })
  await page.reload()

  await expect(page.locator('.resource-pill.ticket strong')).toHaveText('4')
  await expect(page.locator('.resource-pill.mana strong')).toHaveText('22')

  const games = await page.evaluate(({ gameKey }) => {
    return JSON.parse(localStorage.getItem(gameKey)).gameByProfile
  }, { gameKey: GAME_KEY })
  expect(games['child-1'].mana).toBe(11)
  expect(games['child-2'].mana).toBe(22)
  expect(totalTicketGrantCount(games['child-1'])).toBe(1)
  expect(totalTicketGrantCount(games['child-2'])).toBe(4)
})
