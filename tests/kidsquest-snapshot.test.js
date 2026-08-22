import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { unitLedger } from '../src/kids-quest-study/engine/learningUnits.js'
import * as lessons from '../src/kids-quest-study/data/lessons.js'
import { scheduleNext as runtimeScheduleNext } from '../src/study/srs.js'
import { scheduleNext as sourceScheduleNext } from '../src/kids-quest-study/engine/srs.js'
import { makeSkill as runtimeMakeSkill } from '../src/study/difficulty.js'
import { makeSkill as sourceMakeSkill } from '../src/kids-quest-study/engine/difficulty.js'

test('Kids Quest study snapshot records an exact source commit', () => {
  const sha = readFileSync(new URL('../src/kids-quest-study/SOURCE_COMMIT.txt', import.meta.url), 'utf8').trim()
  assert.match(sha, /^[0-9a-f]{40}$/)
})

test('copied learning unit ledger loads for kindergarten and elementary grades', () => {
  assert.ok(unitLedger(0).length > 0)
  assert.ok(unitLedger(3).length > 0)
})

test('copied lesson catalog is importable', () => {
  assert.ok(Object.keys(lessons).length > 0)
})

test('Mana Evo runtime delegates SRS and difficulty to copied Kids Quest source', () => {
  assert.equal(runtimeScheduleNext, sourceScheduleNext)
  assert.equal(runtimeMakeSkill, sourceMakeSkill)
})

test('game-specific Kids Quest files are not imported into the study snapshot', () => {
  const root = new URL('../src/kids-quest-study/', import.meta.url)
  const forbidden = [
    'engine/battle.js',
    'engine/battleTickets.js',
    'engine/monsterProgress.js',
    'engine/missions.js',
    'data/monsters.js',
    'data/monsterAssets.js',
    'data/monsterMaster',
    'data/weapons.js',
    'data/planets.js'
  ]
  for (const path of forbidden) assert.equal(existsSync(new URL(path, root)), false, `${path} must stay out of Mana Evo study snapshot`)
})
