import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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

function victorySnapshot(game, battle, day) {
  const active = game.box[battle.activeInstanceId]
  return {
    battlesWon: game.battlesWon,
    mana: game.mana,
    stagesCleared: [...(game.stagesCleared || [])],
    activeSpeciesId: active.speciesId,
    activeLevel: active.level,
    activeXp: active.xp,
    ticketSettlement: battle.ticketSettlement,
    tickets: availableTicketCount(game, day),
    team: [...(game.team || [])]
  }
}

test('defeated capturable enemy still allows a ball and successful capture does not replay victory rewards', () => {
  const day = 3300
  const won = winWithDefeatedEnemy(day, { rainbow: 1 })
  const before = victorySnapshot(won.game, won.battle, day)
  const caughtBefore = Number(won.game.monstersCaught) || 0

  assert.equal(canAttemptCapture(won.game, won.battle, 'rainbow'), true)
  const captured = attemptCapture(won.game, won.battle, [1], 'rainbow')

  assert.equal(captured.ok, true)
  assert.equal(captured.caught, true)
  assert.equal(captured.battle.status, 'caught')
  assert.equal(captured.battle.captureAttempts, 1)
  assert.equal(captured.game.captureItems.rainbow, 0)
  assert.equal(captured.game.monstersCaught, caughtBefore + 1)
  assert.equal(captured.game.dex.caught[won.battle.enemy.speciesId], true)
  assert.equal(captured.captureSettlement.status, 'settled')
  assert.equal(captured.xp, 0)
  assert.deepEqual(victorySnapshot(captured.game, captured.battle, day), before)

  const replay = attemptCapture(captured.game, won.battle, [1], 'rainbow')
  assert.equal(replay.ok, false)
  assert.equal(replay.reason, 'CAPTURE_NOT_READY')
  assert.equal(replay.game.monstersCaught, caughtBefore + 1)
})

test('failed post-win capture consumes only the ball and attempt; defeated enemy never retaliates', () => {
  const day = 3400
  const won = winWithDefeatedEnemy(day, { star: 2 })
  const before = victorySnapshot(won.game, won.battle, day)
  const playerHpBefore = won.battle.partyHp[won.battle.activeInstanceId]
  const turnBefore = won.battle.turn
  const caughtBefore = Number(won.game.monstersCaught) || 0

  assert.equal(canAttemptCapture(won.game, won.battle, 'star'), true)
  const failed = attemptCapture(won.game, won.battle, [1], 'star')

  assert.equal(failed.ok, true)
  assert.equal(failed.caught, false)
  assert.equal(failed.battle.status, 'won')
  assert.equal(failed.battle.captureAttempts, 1)
  assert.equal(failed.game.captureItems.star, won.game.captureItems.star - 1)
  assert.equal(failed.battle.partyHp[failed.battle.activeInstanceId], playerHpBefore)
  assert.equal(failed.battle.turn, turnBefore)
  assert.equal(failed.game.monstersCaught, caughtBefore)
  assert.deepEqual(victorySnapshot(failed.game, failed.battle, day), before)
  assert.equal(canAttemptCapture(failed.game, failed.battle, 'star'), true)
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
