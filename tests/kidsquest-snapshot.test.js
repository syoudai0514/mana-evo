import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { unitLedger } from '../src/kids-quest-study/engine/learningUnits.js'
import * as lessons from '../src/kids-quest-study/data/lessons.js'
import { reinforcementExtraCount } from '../src/kids-quest-study/engine/reinforcement.js'
import { scheduleNext as runtimeScheduleNext } from '../src/study/srs.js'
import { scheduleNext as sourceScheduleNext } from '../src/kids-quest-study/engine/srs.js'
import { makeSkill as runtimeMakeSkill } from '../src/study/difficulty.js'
import { makeSkill as sourceMakeSkill } from '../src/kids-quest-study/engine/difficulty.js'

const snapshotRoot = fileURLToPath(new URL('../src/kids-quest-study/', import.meta.url))

function filesUnder(root) {
  const out = []
  for (const name of readdirSync(root)) {
    const path = join(root, name)
    if (statSync(path).isDirectory()) out.push(...filesUnder(path))
    else out.push(path)
  }
  return out
}

function relativeImports(text) {
  const out = []
  const re = /(?:from\s+|import\s*\()?['"](\.{1,2}\/[^'"]+)['"]/g
  let match
  while ((match = re.exec(text))) out.push(match[1])
  return out
}

function resolvesRelative(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec)
  return [base, `${base}.js`, `${base}.jsx`, `${base}.json`, join(base, 'index.js'), join(base, 'index.jsx')].some(existsSync)
}

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

test('Kids Quest reinforcement pure learning helper is available', () => {
  assert.equal(reinforcementExtraCount(5, 0, 4), 2)
})

test('all relative imports inside kids-quest-study resolve', () => {
  const failures = []
  for (const file of filesUnder(snapshotRoot).filter((p) => ['.js', '.jsx'].includes(extname(p)))) {
    const text = readFileSync(file, 'utf8')
    for (const spec of relativeImports(text)) if (!resolvesRelative(file, spec)) failures.push(`${file.slice(snapshotRoot.length + 1)} -> ${spec}`)
  }
  assert.deepEqual(failures, [])
})

test('game-specific Kids Quest files are not imported into the study snapshot', () => {
  const forbidden = [
    'engine/battle.js',
    'engine/battleTickets.js',
    'engine/monsterProgress.js',
    'data/monsters.js',
    'data/monsterAssets.js',
    'data/monsterMaster',
    'data/weapons.js',
    'data/planets.js'
  ]
  for (const path of forbidden) assert.equal(existsSync(join(snapshotRoot, path)), false, `${path} must stay out of Mana Evo study snapshot`)
})
