import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')

const facade = read('src/game/GameScreens.jsx')
const adventure = read('src/game/screens/AdventureScreen.jsx')
const battle = read('src/game/screens/BattleScreen.jsx')
const capture = read('src/game/screens/CapturePanel.jsx')
const monster = read('src/game/screens/MonsterScreen.jsx')
const dex = read('src/game/screens/DexScreen.jsx')
const evolution = read('src/game/screens/EvolutionOverlay.jsx')

test('GameScreens is a compatibility facade instead of the monolithic screen owner', () => {
  assert.ok(facade.split('\n').length < 20)
  for (const moduleName of ['AdventureScreen', 'BattleScreen', 'CapturePanel', 'MonsterScreen', 'DexScreen', 'EvolutionOverlay']) {
    assert.ok(facade.includes(moduleName), moduleName)
  }
})

test('Wave B screen ownership has independent physical boundaries', () => {
  assert.ok(adventure.includes('export function AdventureFlow'))
  assert.ok(battle.includes('export function BattleView'))
  assert.ok(capture.includes('export function CapturePanel'))
  assert.ok(monster.includes('export function MonsterScreen'))
  assert.ok(dex.includes('export function DexGrid'))
  assert.ok(evolution.includes('export function EvolutionCelebration'))
})

test('contextual owners are composed rather than promoted to top-level routes', () => {
  assert.ok(adventure.includes('<BattleView'))
  assert.ok(battle.includes('<CapturePanel'))
  assert.ok(battle.includes('<EvolutionCelebration'))
  assert.ok(monster.includes('<DexGrid'))
  assert.ok(monster.includes('<EvolutionCelebration'))
})

test('structural refactor leaves domain engines owned by their existing modules', () => {
  for (const source of [adventure, battle, capture, monster]) {
    assert.ok(!source.includes('function calculateDamage'))
    assert.ok(!source.includes('function captureChance'))
    assert.ok(!source.includes('function evolveInstance'))
  }
})
