import { EVOLUTION_ITEMS, SPECIES, STAGES } from '../game/content.js'
import { EVOLUTION_TRANSITIONS } from '../game/evolutionDomain.js'
import { createGameState, normalizeGameState } from '../game/progression.js'
import { xpToNext } from '../game/engine.js'

export const TEST_FIXTURE_LABELS = Object.freeze({
  all: '全開放・全キャラ',
  stage1: '第1形態・進化できる',
  stage2: '第2形態・最終進化できる'
})

function localDayNumber(d = new Date()) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor(local.getTime() / 86400000)
}

function activeSpecies() {
  return Object.values(SPECIES)
    .filter((species) => /^m\d{3}$/.test(species?.id || ''))
    .filter((species) => Number(species.id.slice(1)) <= 238)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function instance(speciesId, level = 50, extra = {}) {
  return {
    instanceId: `test-${speciesId}`,
    speciesId,
    level,
    xp: 0,
    heldItemId: null,
    evolutionReady: false,
    caughtAt: 1,
    ...extra
  }
}

function generousInventory() {
  return {
    stones: Object.fromEntries(Object.keys(EVOLUTION_ITEMS.stones || {}).map((id) => [id, 99])),
    heldItems: Object.fromEntries(Object.keys(EVOLUTION_ITEMS.heldItems || {}).map((id) => [id, 99]))
  }
}

function commonFixtureBase() {
  const today = localDayNumber()
  const base = createGameState()
  return {
    ...base,
    mana: 999999,
    captureItems: { star: 99, silver: 99, gold: 99, rainbow: 99 },
    evolutionItems: generousInventory(),
    ticketGrants: [{ id: 'test-long-lived', count: 99, earnedDay: today, expiresDay: today + 365 }],
    tickets: 99,
    activeBattle: null
  }
}

export function createAllClearGameFixture() {
  const species = activeSpecies()
  const owned = Object.fromEntries(species.map((entry) => [entry.id, true]))
  const box = Object.fromEntries(species.map((entry) => {
    const monster = instance(entry.id, Math.max(60, Number(entry.evolution?.level) || 60))
    return [monster.instanceId, monster]
  }))
  const team = species.slice(0, 3).map((entry) => `test-${entry.id}`)
  const game = {
    ...commonFixtureBase(),
    box,
    team,
    activeMonsterId: team[0],
    dex: { seen: owned, caught: owned },
    evolutionDiscoveries: Object.fromEntries(species.filter((entry) => Number(entry.stage) > 1).map((entry) => [entry.id, true])),
    stagesCleared: STAGES.filter((stage) => !stage.legacy).map((stage) => stage.id),
    adventureLocation: { area: 5, zoneId: 'ex' },
    gigaKeyOwned: true,
    gigaCoreSpecies: owned,
    burstMarks: owned,
    specialDex: { giga: owned, burst: owned },
    monstersCaught: species.length,
    battlesWon: 999
  }
  return normalizeGameState(game, localDayNumber())
}

function evolutionReadyMonster(transition) {
  if (transition.method === 'level') {
    const level = Math.max(1, Number(transition.level) || 1)
    return instance(transition.fromSpeciesId, level, {
      xp: Math.max(0, xpToNext(level) - 1),
      evolutionReady: true
    })
  }
  if (transition.method === 'held_item_levelup') {
    const level = 40
    return instance(transition.fromSpeciesId, level, {
      xp: Math.max(0, xpToNext(level) - 1),
      heldItemId: transition.itemId,
      evolutionReady: true
    })
  }
  return instance(transition.fromSpeciesId, 40, { evolutionReady: true })
}

export function createEvolutionTestGameFixture(stage) {
  const wantedStage = Number(stage)
  if (![1, 2].includes(wantedStage)) throw new Error('test evolution stage must be 1 or 2')
  const transitions = EVOLUTION_TRANSITIONS.filter((transition) => Number(SPECIES[transition.fromSpeciesId]?.stage) === wantedStage)
  const box = Object.fromEntries(transitions.map((transition) => {
    const monster = evolutionReadyMonster(transition)
    return [monster.instanceId, monster]
  }))
  const ids = transitions.map((transition) => transition.fromSpeciesId)
  const owned = Object.fromEntries(ids.map((id) => [id, true]))
  const team = Object.keys(box).slice(0, 3)
  const game = {
    ...commonFixtureBase(),
    box,
    team,
    activeMonsterId: team[0],
    dex: { seen: owned, caught: owned },
    evolutionDiscoveries: wantedStage === 2 ? owned : {},
    stagesCleared: STAGES.filter((stageEntry) => !stageEntry.legacy).map((stageEntry) => stageEntry.id),
    adventureLocation: { area: 4, zoneId: 'city' },
    monstersCaught: ids.length
  }
  return normalizeGameState(game, localDayNumber())
}

export function createTestGameFixture(kind) {
  if (kind === 'all') return createAllClearGameFixture()
  if (kind === 'stage1') return createEvolutionTestGameFixture(1)
  if (kind === 'stage2') return createEvolutionTestGameFixture(2)
  throw new Error(`unknown test fixture: ${kind}`)
}

export function activeSpeciesCount() {
  return activeSpecies().length
}
