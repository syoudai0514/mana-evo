import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  postWinCaptureEligibility
} from '../src/game/postWinCapture.js'
import {
  attemptCapture,
  canAttemptCapture,
  startBattle,
  useMove
} from '../src/game/engine.js'
import {
  addTickets,
  availableTicketCount,
  createGameState
} from '../src/game/progression.js'

const STAGE = 'a1-wild-001'

function winWithDefeatedEnemy(day, captureItems = {}) {
  let game = createGameState()
  game.captureItems = { ...game.captureItems, ...captureItems }
  game = addTickets(game, 1, day)
  const started = startBattle(game, STAGE, { dailyCompleted: true, today: day })
  assert.equal(started.ok, true)

  const weakened = structuredClone(started.battle)
  weakened.enemy.hp = 1
  weakened.partyHp[weakened.activeInstanceId] = 9999
  const won = useMove(started.game, weakened, 'm004-stable')
  assert.equal(won.ok, true)
  assert.equal(won.battle.status, 'won')
  assert.equal(won.battle.enemy.hp, 0)
  assert.equal(won.battle.ticketSettlement, 'committed')
  return won
}

function withCaptureAttempts(result, attempts) {
  const game = structuredClone(result.game)
  const battle = structuredClone(result.battle)
  battle.captureAttempts = attempts
  game.activeBattle = structuredClone(battle)
  return { game, battle }
}

function victorySnapshot(game, battle, day) {
  const teamAtStart = battle.teamAtStart || []
  return {
    battlesWon: game.battlesWon,
    mana: game.mana,
    stagesCleared: structuredClone(game.stagesCleared || []),
    normalStageSnapshots: structuredClone(game.normalStageSnapshots || {}),
    ticketSettlement: battle.ticketSettlement,
    tickets: availableTicketCount(game, day),
    team: [...(game.team || [])],
    teamMonsters: Object.fromEntries(teamAtStart.map((instanceId) => [instanceId, structuredClone(game.box[instanceId])])),
    partyHp: structuredClone(battle.partyHp || {}),
    turn: battle.turn,
    rewardResolutionId: battle.rewardResolutionId
  }
}

test('won + HP0 remains capture-eligible through the dedicated post-win domain while remaining throws exist', () => {
  const day = 3300
  const won = withCaptureAttempts(winWithDefeatedEnemy(day, { star: 2 }), 2)

  assert.deepEqual(postWinCaptureEligibility(won.game, won.battle, 'star'), { eligible: true, reason: null })
  assert.equal(canAttemptCapture(won.game, won.battle, 'star'), true)

  const exhausted = structuredClone(won.battle)
  exhausted.captureAttempts = 3
  const exhaustedGame = structuredClone(won.game)
  exhaustedGame.activeBattle = structuredClone(exhausted)
  assert.deepEqual(postWinCaptureEligibility(exhaustedGame, exhausted, 'star'), { eligible: false, reason: 'CAPTURE_LIMIT' })
  assert.equal(canAttemptCapture(exhaustedGame, exhausted, 'star'), false)
})

test('failed post-win capture consumes only one ring/attempt, never retaliates or replays victory rewards, and rejects the stale pre-throw snapshot', () => {
  const day = 3400
  const won = withCaptureAttempts(winWithDefeatedEnemy(day, { star: 2 }), 1)
  const before = victorySnapshot(won.game, won.battle, day)
  const starBefore = won.game.captureItems.star
  const caughtBefore = Number(won.game.monstersCaught) || 0

  const failed = attemptCapture(won.game, won.battle, 1, 'star')

  assert.equal(failed.ok, true)
  assert.equal(failed.caught, false)
  assert.equal(failed.battle.status, 'won')
  assert.equal(failed.battle.enemy.hp, 0)
  assert.equal(failed.battle.captureAttempts, 2)
  assert.equal(failed.game.captureItems.star, starBefore - 1)
  assert.equal(failed.game.monstersCaught, caughtBefore)
  assert.deepEqual(victorySnapshot(failed.game, failed.battle, day), before)
  assert.equal(canAttemptCapture(failed.game, failed.battle, 'star'), true)

  const staleRingCount = failed.game.captureItems.star
  const staleCaughtCount = failed.game.monstersCaught
  const stale = attemptCapture(failed.game, won.battle, 0, 'star')
  assert.equal(stale.ok, false)
  assert.equal(stale.reason, 'STALE_BATTLE')
  assert.equal(stale.battle.captureAttempts, 2)
  assert.equal(stale.game.captureItems.star, staleRingCount)
  assert.equal(stale.game.monstersCaught, staleCaughtCount)
  assert.deepEqual(victorySnapshot(stale.game, stale.battle, day), before)
})

test('post-win success after reload settles capture only and stale replay cannot spend or reward twice', () => {
  const day = 3500
  const won = withCaptureAttempts(winWithDefeatedEnemy(day, { star: 2, rainbow: 1 }), 1)
  const victory = victorySnapshot(won.game, won.battle, day)

  const failed = attemptCapture(won.game, won.battle, 1, 'star')
  assert.equal(failed.ok, true)
  assert.equal(failed.caught, false)

  const reloadedGame = JSON.parse(JSON.stringify(failed.game))
  const reloadedBattle = reloadedGame.activeBattle
  const rainbowBefore = reloadedGame.captureItems.rainbow
  const caughtBefore = Number(reloadedGame.monstersCaught) || 0

  const captured = attemptCapture(reloadedGame, reloadedBattle, 1, 'rainbow')

  assert.equal(captured.ok, true)
  assert.equal(captured.caught, true)
  assert.equal(captured.battle.status, 'caught')
  assert.equal(captured.battle.captureAttempts, 3)
  assert.equal(captured.game.captureItems.rainbow, rainbowBefore - 1)
  assert.equal(captured.game.monstersCaught, caughtBefore + 1)
  assert.equal(captured.game.dex.caught[won.battle.enemy.speciesId], true)
  assert.equal(captured.captureSettlement.status, 'settled')
  assert.equal(captured.xp, 0)
  assert.deepEqual(captured.xpByInstance, {})
  assert.deepEqual(captured.levelsByInstance, {})

  const captureResultForVictorySnapshot = {
    ...captured.battle,
    ticketSettlement: victory.ticketSettlement,
    partyHp: victory.partyHp,
    turn: victory.turn,
    rewardResolutionId: victory.rewardResolutionId,
    teamAtStart: won.battle.teamAtStart
  }
  assert.deepEqual(victorySnapshot(captured.game, captureResultForVictorySnapshot, day), victory)

  const ringAfter = captured.game.captureItems.rainbow
  const caughtAfter = captured.game.monstersCaught
  const replay = attemptCapture(captured.game, reloadedBattle, 0, 'rainbow')
  assert.equal(replay.ok, false)
  assert.equal(replay.reason, 'STALE_BATTLE')
  assert.equal(replay.game.captureItems.rainbow, ringAfter)
  assert.equal(replay.game.monstersCaught, caughtAfter)
})

test('battle result UI exposes post-win capture without reopening normal battle commands', () => {
  const battleUi = readFileSync(new URL('../src/game/screens/BattleScreen.jsx', import.meta.url), 'utf8')
  const captureUi = readFileSync(new URL('../src/game/screens/CapturePanel.jsx', import.meta.url), 'utf8')

  assert.match(battleUi, /const postWinCapture = battle\.status === 'won' && battle\.enemy\.hp <= 0/)
  assert.match(battleUi, /たおしたあとでも GETできる！/)
  assert.match(battleUi, /const showNormalCommands = !finished/)
  assert.match(captureUi, /失敗しても反撃はないよ/)
  assert.match(captureUi, /sequence\?\.postWin/)
})
