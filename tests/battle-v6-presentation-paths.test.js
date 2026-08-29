import test from 'node:test'
import assert from 'node:assert/strict'

import { addTickets, createGameState } from '../src/game/progression.js'
import { STAGES } from '../src/game/content.js'
import {
  attemptCapture,
  isStageUnlocked,
  makeMonster,
  startBattle,
  switchBattleMonster,
  useProtect
} from '../src/game/engine.js'

function startedWildBattle({ withBench = false } = {}) {
  const today = 20694
  let game = addTickets(createGameState(), 3, today)
  if (withBench) {
    const active = game.box[game.team[0]]
    const bench = makeMonster(active.speciesId, active.level, 'presentation-bench')
    game = structuredClone(game)
    game.box[bench.instanceId] = bench
    game.team = [game.team[0], bench.instanceId]
  }
  const stage = STAGES.find((entry) => entry.kind === 'wild' && !entry.captureDisabled && isStageUnlocked(game, entry))
  assert.ok(stage)
  const started = startBattle(game, stage.id, {
    dailyCompleted: true,
    dailyDay: today,
    today
  })
  assert.equal(started.ok, true)
  return { game: started.game, battle: started.game.activeBattle, today }
}

function poisonEnemyForEndTurnKo(game) {
  const next = structuredClone(game)
  next.activeBattle.enemy.hp = 1
  next.activeBattle.enemy.status = { type: 'poison' }
  return next
}

test('Protect end-turn DOT KO returns a gated turn presentation ending at enemy HP 0', () => {
  const started = startedWildBattle()
  const game = poisonEnemyForEndTurnKo(started.game)
  const battle = game.activeBattle
  const result = useProtect(game, battle, { today: started.today })

  assert.equal(result.ok, true)
  assert.equal(result.battle.status, 'won')
  assert.equal(result.battle.enemy.hp, 0)
  assert.equal(result.battle.turnPresentation?.actionKind, 'protect')
  assert.equal(result.battle.turnPresentation?.enemyHpBefore, 1)
  assert.equal(result.battle.turnPresentation?.enemyHpAfter, 0)
  assert.equal(result.battle.turnPresentation?.enemyFainted, true)
})

test('voluntary switch end-turn DOT KO returns presentation for the switched-in monster', () => {
  const started = startedWildBattle({ withBench: true })
  const game = poisonEnemyForEndTurnKo(started.game)
  const battle = game.activeBattle
  const benchId = game.team[1]
  const result = switchBattleMonster(game, battle, benchId, { today: started.today })

  assert.equal(result.ok, true)
  assert.equal(result.battle.status, 'won')
  assert.equal(result.battle.activeInstanceId, benchId)
  assert.equal(result.battle.turnPresentation?.actionKind, 'switch')
  assert.equal(result.battle.turnPresentation?.enemyHpBefore, 1)
  assert.equal(result.battle.turnPresentation?.enemyHpAfter, 0)
  assert.equal(result.battle.turnPresentation?.enemyFainted, true)
})

test('failed pre-KO capture followed by DOT KO returns capture-failed presentation', () => {
  const started = startedWildBattle()
  const game = poisonEnemyForEndTurnKo(started.game)
  game.captureItems.star = Math.max(1, Number(game.captureItems.star) || 0)
  const battle = game.activeBattle
  // 1 is above any normal capture chance, forcing escape while still consuming
  // the turn; poison then resolves the enemy KO at the canonical turn boundary.
  const result = attemptCapture(game, battle, 1, 'star', { today: started.today })

  assert.equal(result.ok, true)
  assert.equal(result.caught, false)
  assert.equal(result.battle.status, 'won')
  assert.equal(result.battle.turnPresentation?.actionKind, 'capture-failed')
  assert.equal(result.battle.turnPresentation?.enemyHpBefore, 1)
  assert.equal(result.battle.turnPresentation?.enemyHpAfter, 0)
  assert.equal(result.battle.turnPresentation?.enemyFainted, true)
  assert.ok(Array.isArray(result.capturePresentation?.frames || result.battle.capturePresentation))
})
