import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { SPECIES } from '../src/game/content.js'
import {
  activateBurst,
  attemptCapture,
  availableBattleMoveIds,
  makeMonster,
  startBattle,
  switchBattleMonster
} from '../src/game/engine.js'
import {
  addTickets,
  createGameState,
  grantLearningReward,
  specialProgressionStatus
} from '../src/game/progression.js'
import {
  GAME_SAVE_KEY,
  LEGACY_GAME_SAVE_KEY,
  loadGameForProfile,
  saveGameForProfile
} from '../src/game/saveStore.js'
import { parseImport, serializeForExport } from '../src/kids-quest-study/engine/storage.js'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
}

function resetStorage() {
  memory.clear()
}

function preparedGame(speciesId = 'm004', level = 55, day = 9000) {
  let game = createGameState()
  const id = game.activeMonsterId
  game.box[id] = makeMonster(speciesId, level, id)
  game.team = [id]
  game.activeMonsterId = id
  game.dex.seen[speciesId] = true
  game.dex.caught[speciesId] = true
  return addTickets(game, 10, day)
}

test('game progress is isolated by learning profile and legacy save migrates to active profile', () => {
  resetStorage()
  const papa = createGameState()
  papa.mana = 111
  const mama = createGameState()
  mama.mana = 222
  saveGameForProfile('child-a', papa)
  saveGameForProfile('child-b', mama)
  assert.equal(loadGameForProfile('child-a').mana, 111)
  assert.equal(loadGameForProfile('child-b').mana, 222)

  resetStorage()
  const legacy = createGameState()
  legacy.mana = 333
  localStorage.setItem(LEGACY_GAME_SAVE_KEY, JSON.stringify({ game: legacy }))
  assert.equal(loadGameForProfile('child-legacy').mana, 333)
  const migrated = JSON.parse(localStorage.getItem(GAME_SAVE_KEY))
  assert.equal(migrated.formatVersion, 2)
  assert.equal(migrated.gameByProfile['child-legacy'].mana, 333)
})

test('backup and restore carries the full profile game envelope, not learning only', () => {
  resetStorage()
  const game = createGameState()
  game.mana = 777
  game.captureItems.gold = 4
  saveGameForProfile('child-a', game)
  const learning = { version: 4, activeProfileId: 'child-a', grade: 0, gradeMax: 0, skills: {} }
  const exported = serializeForExport(learning)
  const payload = JSON.parse(exported)
  assert.equal(payload.formatVersion, 3)
  assert.equal(payload.gameEnvelope.gameByProfile['child-a'].mana, 777)

  localStorage.removeItem(GAME_SAVE_KEY)
  const restoredLearning = parseImport(exported)
  assert.equal(restoredLearning.activeProfileId, 'child-a')
  assert.equal(loadGameForProfile('child-a').mana, 777)
  assert.equal(loadGameForProfile('child-a').captureItems.gold, 4)
})

test('learning reward bridge is idempotent by reward id', () => {
  const day = 9100
  const once = grantLearningReward(createGameState(), {
    rewardId: 'daily:2026-08-25',
    ticketDelta: 3,
    captureItemDelta: { star: 3 },
    today: day
  })
  const twice = grantLearningReward(once, {
    rewardId: 'daily:2026-08-25',
    ticketDelta: 3,
    captureItemDelta: { star: 3 },
    today: day
  })
  assert.equal(twice.tickets, once.tickets)
  assert.equal(twice.captureItems.star, once.captureItems.star)
  assert.equal(twice.mana, once.mana)
  assert.deepEqual(twice.appliedLearningRewardIds, ['daily:2026-08-25'])
})

test('area 1 boss clear owns the permanent giga key independently from species core', () => {
  const monster = makeMonster('m003', 55, 'giga-test')
  const game = createGameState()
  game.stagesCleared = ['a1-boss']
  game.gigaCoreSpecies.m003 = true
  const status = specialProgressionStatus(monster, game)
  assert.equal(status.giga.hasKey, true)
  assert.equal(status.giga.hasCore, true)
  assert.equal(status.giga.activatable, true)
})

test('burst replaces a normal main move, registers its form and consumes turns on a failed throw', () => {
  const day = 9200
  let game = preparedGame('m060', 70, day)
  game.burstMarks.m060 = true
  const started = startBattle(game, 'a1-wild-001', { dailyCompleted: true, today: day })
  assert.equal(started.ok, true)
  const burst = activateBurst(started.game, started.battle)
  assert.equal(burst.ok, true)
  assert.equal(burst.game.specialDex.burst.m060, true)
  const moves = availableBattleMoveIds(burst.game, burst.battle)
  assert.equal(moves.length, 4)
  assert.ok(moves.includes(SPECIES.m060.burstMoveId))
  assert.ok(!moves.includes('m060-finisher'))

  const captureBattle = structuredClone(burst.battle)
  captureBattle.enemy.hp = Math.floor(captureBattle.enemy.maxHp / 2)
  const failed = attemptCapture(burst.game, captureBattle, [1, 1, 1, 1], 'star')
  assert.equal(failed.ok, true)
  assert.equal(failed.caught, false)
  assert.equal(failed.battle.playerSpecial.turnsLeft, 2)
  assert.match(failed.battle.log.join(' '), /「わ」を なげた/)
})

test('burst duration also advances on voluntary party switch', () => {
  const day = 9300
  let game = preparedGame('m060', 80, day)
  game.burstMarks.m060 = true
  const second = makeMonster('m004', 80, 'second')
  game.box[second.instanceId] = second
  game.team = [game.activeMonsterId, second.instanceId]
  const started = startBattle(game, 'a1-wild-001', { dailyCompleted: true, today: day })
  const burst = activateBurst(started.game, started.battle)
  const switched = switchBattleMonster(burst.game, burst.battle, second.instanceId)
  assert.equal(switched.ok, true)
  assert.equal(switched.battle.playerSpecial.turnsLeft, 2)
})

test('child-facing UI exposes focused ball selection and how-to has no stale fixed stages', () => {
  const capture = fs.readFileSync(new URL('../src/game/screens/CapturePanel.jsx', import.meta.url), 'utf8')
  const howto = fs.readFileSync(new URL('../src/HowToPlay.jsx', import.meta.url), 'utf8')
  assert.match(capture, /どのボールを つかう？/)
  assert.match(capture, /selected\.display\.label}を なげる/)
  assert.match(capture, /おすすめ！/)
  assert.match(capture, /くわしい かくりつ/)
  assert.match(capture, /HPを はんぶんいかに/)
  assert.match(capture, /ボールは なげられない バトル/)
  assert.match(howto, /ボールを なげよう！/)
  assert.match(howto, /held_item_levelup/)
  assert.doesNotMatch(howto, /1-5 ひかりいわば|1-6 きずなのよみち/)
  assert.doesNotMatch(howto, /まだ じゅんびちゅう|いまは まだ つかえない/)
})
