import test from 'node:test'
import assert from 'node:assert/strict'

import { createGameState } from '../src/game/progression.js'
import {
  GAME_SAVE_KEY,
  LEGACY_GAME_SAVE_KEY,
  loadGameEnvelope,
  loadGameForProfile,
  saveGameForProfile,
  importGameEnvelope
} from '../src/game/saveStore.js'
import {
  KIDS_QUEST_IMPORT_MARKER_KEY,
  KIDS_QUEST_LEGACY_STORAGE_KEY,
  importKidsQuestProgress
} from '../src/platform/kidsQuestImport.js'
import { buildRevisionManifest } from '../scripts/generate-pwa-asset-revisions.mjs'

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries))
    this.writes = []
    this.removes = []
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem(key, value) {
    const text = String(value)
    this.writes.push([key, text])
    this.values.set(key, text)
  }
  removeItem(key) {
    this.removes.push(key)
    this.values.delete(key)
  }
}

function withLocalStorage(storage, run) {
  const previous = globalThis.localStorage
  globalThis.localStorage = storage
  try { return run() } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
}

test('game save stays isolated by stable profile id across A -> B -> A', () => {
  const storage = new MemoryStorage()
  withLocalStorage(storage, () => {
    const a = createGameState()
    const b = createGameState()
    a.mana = 11
    b.mana = 22
    saveGameForProfile('child-a', a)
    saveGameForProfile('child-b', b)

    assert.equal(loadGameForProfile('child-a').mana, 11)
    assert.equal(loadGameForProfile('child-b').mana, 22)

    const aAgain = loadGameForProfile('child-a')
    aAgain.mana = 33
    saveGameForProfile('child-a', aAgain)
    assert.equal(loadGameForProfile('child-a').mana, 33)
    assert.equal(loadGameForProfile('child-b').mana, 22)
    assert.deepEqual(Object.keys(JSON.parse(storage.getItem(GAME_SAVE_KEY)).gameByProfile).sort(), ['child-a', 'child-b'])
  })
})

test('legacy single-game migration is deterministic and does not mutate the legacy key', () => {
  const legacyGame = createGameState()
  legacyGame.mana = 17
  const legacyRaw = JSON.stringify({ game: legacyGame })
  const storage = new MemoryStorage({ [LEGACY_GAME_SAVE_KEY]: legacyRaw })

  withLocalStorage(storage, () => {
    const first = loadGameEnvelope('child-a')
    const persisted = storage.getItem(GAME_SAVE_KEY)
    const second = loadGameEnvelope('child-a')
    assert.deepEqual(second, first)
    assert.equal(storage.getItem(GAME_SAVE_KEY), persisted)
    assert.equal(storage.getItem(LEGACY_GAME_SAVE_KEY), legacyRaw)
    assert.equal(first.gameByProfile['child-a'].mana, 17)
  })
})

test('unsupported backup game envelope is rejected instead of wiping current profiles', () => {
  const storage = new MemoryStorage()
  withLocalStorage(storage, () => {
    const game = createGameState()
    game.mana = 9
    saveGameForProfile('child-a', game)
    const before = storage.getItem(GAME_SAVE_KEY)
    assert.throws(() => importGameEnvelope({ formatVersion: 999, gameByProfile: {} }), /unsupported/)
    assert.equal(storage.getItem(GAME_SAVE_KEY), before)
  })
})

test('Kids Quest import is read-only, learning-only, profile-aware and idempotent', () => {
  const kidsQuestSource = {
    version: 7,
    activeProfileId: 'child-2',
    profiles: {
      'child-1': {
        name: 'あお',
        state: { version: 7, grade: 1, gradeMax: 2, skills: { reading: { level: 2 } }, unlockedMonsters: ['legacy-a'] }
      },
      'child-2': {
        name: 'みどり',
        state: {
          version: 7,
          grade: 3,
          gradeMax: 4,
          streak: 8,
          skills: { numbers: { level: 4 } },
          srs: { 'unit-1': { due: 10 } },
          settings: { tts: false, mode: 'hard', oldGameMode: 'legacy' },
          unlockedMonsters: ['legacy-b'],
          battle: { hp: 1 },
          pendingGameRewards: [{ id: 'must-not-import', kind: 'ticket' }]
        }
      }
    }
  }
  const sourceRaw = JSON.stringify(kidsQuestSource)
  const storage = new MemoryStorage({ [KIDS_QUEST_LEGACY_STORAGE_KEY]: sourceRaw })
  const currentState = {
    version: 8,
    grade: 0,
    gradeMax: 0,
    activeProfileId: 'child-1',
    profiles: {
      'child-1': { name: 'いま', state: { version: 8, grade: 0, gradeMax: 0 } },
      'mana-only': { name: 'Manaだけ', state: { version: 8, grade: 5, gradeMax: 5 } }
    }
  }

  const first = importKidsQuestProgress(currentState, { storage })
  assert.equal(first.status, 'imported')
  assert.equal(first.state.activeProfileId, 'child-2')
  assert.equal(first.state.grade, 3)
  assert.equal(first.state.streak, 8)
  assert.equal(first.state.profiles['child-1'].name, 'あお')
  assert.equal(first.state.profiles['child-2'].name, 'みどり')
  assert.equal(first.state.profiles['mana-only'].name, 'Manaだけ')
  assert.equal(first.state.profiles['child-2'].state.unlockedMonsters, undefined)
  assert.equal(first.state.profiles['child-2'].state.battle, undefined)
  assert.deepEqual(first.state.pendingGameRewards, [])
  assert.deepEqual(first.state.settings, { tts: false, mode: 'hard' })
  assert.equal(storage.getItem(KIDS_QUEST_LEGACY_STORAGE_KEY), sourceRaw)
  assert.deepEqual(storage.removes, [])
  assert.deepEqual([...new Set(storage.writes.map(([key]) => key))], [KIDS_QUEST_IMPORT_MARKER_KEY])

  const writesAfterFirst = storage.writes.length
  const second = importKidsQuestProgress(first.state, { storage })
  assert.equal(second.status, 'already-imported')
  assert.deepEqual(second.state, first.state)
  assert.equal(storage.writes.length, writesAfterFirst)
  assert.equal(storage.getItem(KIDS_QUEST_LEGACY_STORAGE_KEY), sourceRaw)
})

test('monster revision manifest keys only FORMAL art and changes revision when bytes change', () => {
  const canonical = {
    schemaVersion: 1,
    assets: {
      m001: { state: 'CANDIDATE' },
      m002: { state: 'PLACEHOLDER' },
      m003: { state: 'FORMAL', formalAsset: '/monsters/m003.webp' }
    }
  }
  const first = buildRevisionManifest(canonical, () => Buffer.from('formal-v1'))
  const second = buildRevisionManifest(canonical, () => Buffer.from('formal-v2'))

  assert.deepEqual(first.assets.m001, { state: 'CANDIDATE' })
  assert.deepEqual(first.assets.m002, { state: 'PLACEHOLDER' })
  assert.equal(first.assets.m003.url, '/monsters/m003.webp')
  assert.match(first.assets.m003.revision, /^sha256-[a-f0-9]{64}$/)
  assert.equal(first.formalByUrl['/monsters/m003.webp'], first.assets.m003.revision)
  assert.notEqual(second.assets.m003.revision, first.assets.m003.revision)
  assert.equal(first.formalByUrl['/monsters/m001.webp'], undefined)
})
