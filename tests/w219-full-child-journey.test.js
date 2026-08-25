import test from 'node:test'
import assert from 'node:assert/strict'

import { STAGES, speciesOf } from '../src/game/content.js'
import {
  abandonBattle,
  isStageUnlocked,
  startBattle,
  useMove
} from '../src/game/engine.js'
import { evolveAfterLevelUp, evolveWithStone } from '../src/game/evolutionDomain.js'
import {
  addTickets,
  availableTicketCount,
  createGameState
} from '../src/game/progression.js'
import { applyLearningQueues } from '../src/game/sharedRuntime.js'
import {
  AREA_BOSS_REQUIREMENT,
  applyAreaBossProgressEvent,
  areaBossEligibility,
  worldStageAvailability
} from '../src/game/worldProgression.js'
import { deriveLearningRewardRuntime } from '../src/kids-quest-study/state/learningRewardRuntime.js'
import {
  TOP_LEVEL_CHILD_VIEWS,
  shouldShowTopLevelNavigation
} from '../src/navigation/viewOwnership.js'

const DAY = 9000

function learningState({ coreDone, coreIndex }) {
  return {
    grade: 0,
    gradeMax: 0,
    unitStats: {},
    writingStats: {},
    englishWordStats: {},
    englishPhraseStats: {},
    starTrials: {},
    lessonSeen: {},
    domainAccuracy: {},
    srs: {},
    daily: {
      date: '2099-01-01',
      coreDone,
      coreIndex,
      coreTasks: [
        { uid: 'w219-core-1', domainId: 'yomu', questionCount: 4 },
        { uid: 'w219-core-2', domainId: 'suuji', questionCount: 4 },
        { uid: 'w219-core-3', domainId: 'english', questionCount: 4 },
        { uid: 'w219-core-4', domainId: 'seikatsu', questionCount: 4 },
        { uid: 'w219-core-5', domainId: 'doutoku', questionCount: 4 }
      ],
      tasksClearedToday: coreIndex,
      correctToday: 0,
      attemptsToday: 0,
      perDomainToday: {},
      ticketsEarnedToday: 0
    }
  }
}

function dailyCompletionRuntime() {
  return deriveLearningRewardRuntime(
    {},
    learningState({ coreDone: false, coreIndex: 4 }),
    learningState({ coreDone: true, coreIndex: 5 }),
    { type: 'CLEAR_TASK', kind: 'core', domainId: 'doutoku' }
  )
}

function routeStages(area = 3) {
  const zoneIdsByArea = {
    1: ['meadow', 'forest', 'deep'],
    2: ['foothill', 'magma', 'deep'],
    3: ['coast', 'frost', 'deep'],
    4: ['city', 'skyway', 'deep']
  }
  return (zoneIdsByArea[area] || ['ex']).flatMap((zoneId) => (
    [1, 2, 3].map((n) => ({
      id: `w219-a${area}-${zoneId}-${n}`,
      kind: 'wild',
      adventureArea: area,
      zoneId
    }))
  ))
}

test('vertical learning reward is exactly once and boss remains learning-gated after route clears', () => {
  const runtime = dailyCompletionRuntime()
  assert.equal(runtime.pendingGameRewards.length, 1)
  assert.equal(runtime.pendingProgressionSignals.length, 2)

  const initial = createGameState()
  initial.adventureLocation = { area: 1, zoneId: 'meadow' }

  const first = applyLearningQueues(initial, {
    rewards: runtime.pendingGameRewards,
    signals: runtime.pendingProgressionSignals,
    today: DAY
  })
  assert.deepEqual(first.appliedRewardIds, runtime.pendingGameRewards.map((reward) => reward.id))
  assert.deepEqual(first.appliedSignalIds, runtime.pendingProgressionSignals.map((signal) => signal.id))
  assert.equal(availableTicketCount(first.game, DAY), 3)
  assert.equal(first.game.captureItems.star, 3)
  assert.equal(first.game.explorePoint, 2)
  assert.equal(first.game.areaBossProgress[1].points, 1)
  assert.equal(first.game.areaBossProgress[1].uniqueSkillIds.length, 1)

  const replay = applyLearningQueues(first.game, {
    rewards: runtime.pendingGameRewards,
    signals: runtime.pendingProgressionSignals,
    today: DAY
  })
  assert.deepEqual(replay.appliedRewardIds, [])
  assert.deepEqual(replay.appliedSignalIds, [])
  assert.equal(availableTicketCount(replay.game, DAY), 3)
  assert.equal(replay.game.captureItems.star, 3)
  assert.equal(replay.game.explorePoint, 2)
  assert.equal(replay.game.areaBossProgress[1].points, 1)

  assert.deepEqual(AREA_BOSS_REQUIREMENT, { minPoints: 12, minUniqueSkills: 2 })
  const boss = STAGES.find((stage) => stage.id === 'a1-boss')
  assert.ok(boss)

  let routeCleared = structuredClone(replay.game)
  const bossRoute = STAGES
    .filter((stage) => stage.kind === 'wild')
    .filter((stage) => Number(stage.adventureArea || stage.area) === 1)
    .filter((stage) => stage.zoneId === boss.zoneGatePreviousId)
    .slice(0, 2)
  routeCleared.stagesCleared = [...new Set([...(routeCleared.stagesCleared || []), ...bossRoute.map((stage) => stage.id)])]
  assert.equal(isStageUnlocked(routeCleared, boss), false)

  routeCleared = applyAreaBossProgressEvent(routeCleared, {
    id: 'w219-learning-a',
    area: 1,
    points: 5,
    skillId: 'w219-skill-a'
  }).game
  routeCleared = applyAreaBossProgressEvent(routeCleared, {
    id: 'w219-learning-b',
    area: 1,
    points: 6,
    skillId: 'w219-skill-b'
  }).game

  assert.equal(areaBossEligibility(routeCleared, 1).eligible, true)
  assert.equal(isStageUnlocked(routeCleared, boss), true)
})

test('one ticket reserves, survives reload semantics, refunds on abandon, and commits on victory', () => {
  const firstWild = STAGES.find((stage) => stage.kind === 'wild' && !stage.hidden)
  assert.ok(firstWild)

  let game = addTickets(createGameState(), 1, DAY)
  const started = startBattle(game, firstWild.id, {
    dailyCompleted: true,
    dailyDay: DAY,
    today: DAY
  })
  assert.equal(started.ok, true)
  assert.equal(started.battle.ticketSettlement, 'reserved')
  assert.equal(availableTicketCount(started.game, DAY), 0)

  const resumed = startBattle(started.game, firstWild.id, {
    dailyCompleted: true,
    dailyDay: DAY,
    today: DAY
  })
  assert.equal(resumed.ok, false)
  assert.equal(resumed.reason, 'BATTLE_ALREADY_ACTIVE')
  assert.equal(resumed.battle.battleId, started.battle.battleId)
  assert.equal(availableTicketCount(resumed.game, DAY), 0)

  const abandoned = abandonBattle(started.game, { today: DAY })
  assert.equal(abandoned.ok, true)
  assert.equal(abandoned.refunded, true)
  assert.equal(availableTicketCount(abandoned.game, DAY), 1)

  const restarted = startBattle(abandoned.game, firstWild.id, {
    dailyCompleted: true,
    dailyDay: DAY,
    today: DAY
  })
  assert.equal(restarted.ok, true)
  const battle = structuredClone(restarted.battle)
  battle.enemy.hp = 1
  const moveId = speciesOf(restarted.game.box[battle.activeInstanceId].speciesId).moves[0]
  const won = useMove(restarted.game, battle, moveId, { today: DAY })
  assert.equal(won.ok, true)
  assert.equal(won.battle.status, 'won')
  assert.equal(won.battle.ticketSettlement, 'committed')
  assert.equal(won.battle.ticketCommitted, true)
  assert.equal(availableTicketCount(won.game, DAY), 0)
})

test('manual stone evolution records discovery and own evolution gates later-world encounter behavior', () => {
  const stoneGame = createGameState()
  const stoneInstanceId = stoneGame.activeMonsterId
  stoneGame.box[stoneInstanceId] = {
    ...stoneGame.box[stoneInstanceId],
    speciesId: 'm026',
    level: 30,
    xp: 0,
    heldItemId: null,
    evolutionReady: false
  }
  stoneGame.evolutionItems.stones.thunder = 1
  const stone = evolveWithStone(stoneGame, {
    instanceId: stoneInstanceId,
    itemId: 'thunder',
    operationId: 'w219-stone'
  })
  assert.equal(stone.ok, true)
  assert.equal(stone.game.box[stoneInstanceId].speciesId, 'm027')
  assert.equal(stone.game.evolutionItems.stones.thunder || 0, 0)
  assert.equal(stone.game.evolutionDiscoveries.m027, true)

  const levelGame = createGameState()
  const levelInstanceId = levelGame.activeMonsterId
  levelGame.box[levelInstanceId].speciesId = 'm001'
  levelGame.box[levelInstanceId].level = 17
  const level = evolveAfterLevelUp(levelGame, {
    instanceId: levelInstanceId,
    previousLevel: 16,
    newLevel: 17,
    operationId: 'w219-level'
  })
  assert.equal(level.ok, true)
  assert.equal(level.game.box[levelInstanceId].speciesId, 'm002')
  assert.equal(level.game.evolutionDiscoveries.m002, true)

  const stages = routeStages(3)
  const evolvedWild = {
    id: 'w219-a3-evolved-m002',
    kind: 'wild',
    area: 1,
    adventureArea: 3,
    zoneId: 'deep',
    requiresEvolutionDiscoverySpeciesId: 'm002'
  }
  stages.push(evolvedWild)

  const gatedGame = structuredClone(level.game)
  gatedGame.stagesCleared = [
    'a1-boss',
    'a2-boss',
    'w219-a3-coast-1',
    'w219-a3-coast-2',
    'w219-a3-frost-1',
    'w219-a3-frost-2'
  ]
  delete gatedGame.evolutionDiscoveries.m002
  gatedGame.dex.caught.m002 = true
  assert.equal(worldStageAvailability(gatedGame, evolvedWild, stages).reason, 'EVOLUTION_DISCOVERY_REQUIRED')

  gatedGame.evolutionDiscoveries.m002 = true
  assert.equal(worldStageAvailability(gatedGame, evolvedWild, stages).unlocked, true)
})

test('child navigation ownership is exactly five top-level destinations and active battle suppresses it', () => {
  assert.deepEqual(TOP_LEVEL_CHILD_VIEWS, ['home', 'study', 'adventure', 'monsters', 'howto'])
  for (const view of TOP_LEVEL_CHILD_VIEWS) {
    assert.equal(shouldShowTopLevelNavigation(view), true)
    assert.equal(shouldShowTopLevelNavigation(view, { activeBattle: true }), false)
  }
  for (const focused of ['activity', 'free', 'review', 'trial', 'dictionary', 'parent', 'battle', 'capture', 'dex', 'evolution']) {
    assert.equal(shouldShowTopLevelNavigation(focused), false)
  }
})
