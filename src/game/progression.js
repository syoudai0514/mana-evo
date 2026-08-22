import { STAGES, speciesOf } from './content.js'

export const CURRENT_GAME_VERSION = 3
export const CAPTURE_ITEM_IDS = ['star', 'silver', 'gold', 'rainbow']

function starterState(level = 5, xp = 0, speciesId = 'starter-fire-1') {
  return {
    instanceId: 'starter-1',
    speciesId,
    level: Math.max(1, Number(level) || 1),
    xp: Math.max(0, Number(xp) || 0),
    heldItemId: null,
    caughtAt: Date.now()
  }
}

export function createGameState() {
  const starter = starterState()
  return {
    version: CURRENT_GAME_VERSION,
    tickets: 0,
    mana: 0,
    captureItems: { star: 8, silver: 0, gold: 0, rainbow: 0 },
    evolutionItems: { stones: {}, heldItems: {} },
    gigaKeyOwned: false,
    gigaCoreSpecies: {},
    burstMarks: {},
    battlesStarted: 0,
    battlesWon: 0,
    monstersCaught: 0,
    box: { [starter.instanceId]: starter },
    team: [starter.instanceId],
    activeMonsterId: starter.instanceId,
    dex: {
      seen: { [starter.speciesId]: true },
      caught: { [starter.speciesId]: true }
    },
    stagesCleared: [],
    activeBattle: null
  }
}

function migrateV1(saved) {
  const legacyMonster = saved?.monsters?.[saved.activeMonsterId] || saved?.monsters?.['starter-001'] || {}
  const legacyStage = Math.max(1, Math.min(3, Number(legacyMonster.stage) || 1))
  const speciesId = `starter-fire-${legacyStage}`
  const starter = starterState(legacyMonster.level || 5, legacyMonster.xp || 0, speciesId)
  return {
    ...createGameState(),
    tickets: Math.max(0, Number(saved?.tickets) || 0),
    mana: Math.max(0, Number(saved?.mana) || 0),
    battlesWon: Math.max(0, Number(saved?.battlesWon) || 0),
    box: { [starter.instanceId]: starter },
    team: [starter.instanceId],
    activeMonsterId: starter.instanceId,
    dex: { seen: { [speciesId]: true }, caught: { [speciesId]: true } }
  }
}

function positiveInt(value) { return Math.max(0, Math.floor(Number(value) || 0)) }

function normalizeCaptureItems(saved) {
  const raw = saved?.captureItems || {}
  const legacyStar = saved?.captureRings
  return Object.fromEntries(CAPTURE_ITEM_IDS.map((id) => [id, positiveInt(raw[id] ?? (id === 'star' ? legacyStar ?? 0 : 0))]))
}

function normalizeOwnershipMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([speciesId, owned]) => !!owned && !!speciesOf(speciesId)).map(([speciesId]) => [speciesId, true]))
}

function normalizeInventory(saved) {
  const evo = saved?.evolutionItems || {}
  const clean = (value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).map(([id, count]) => [id, positiveInt(count)]).filter(([, count]) => count > 0))
    : {}
  return { stones: clean(evo.stones), heldItems: clean(evo.heldItems) }
}

function normalizeBox(savedBox) {
  const box = {}
  for (const [instanceId, raw] of Object.entries(savedBox || {})) {
    if (!raw || !speciesOf(raw.speciesId)) continue
    box[instanceId] = {
      instanceId,
      speciesId: raw.speciesId,
      level: Math.max(1, positiveInt(raw.level) || 1),
      xp: positiveInt(raw.xp),
      heldItemId: raw.heldItemId || null,
      caughtAt: Number(raw.caughtAt) || Date.now()
    }
  }
  return box
}

function normalizeActiveBattle(raw, box, team) {
  if (!raw || typeof raw !== 'object') return null
  const stage = STAGES.find((entry) => entry.id === raw.stageId)
  if (!stage || raw.enemy?.speciesId !== stage.enemySpeciesId) return null
  const activeId = team.includes(raw.activeInstanceId) ? raw.activeInstanceId : team[0]
  if (!activeId || !box[activeId]) return null
  const partyHp = {}
  for (const id of team) partyHp[id] = Math.max(0, Number(raw.partyHp?.[id]) || 0)
  return {
    ...structuredClone(raw),
    activeInstanceId: activeId,
    partyHp,
    captureAttempts: Math.max(0, Math.min(3, positiveInt(raw.captureAttempts))),
    captureStars: Math.max(0, Math.min(4, positiveInt(raw.captureStars)))
  }
}

export function normalizeGameState(saved) {
  if (!saved || typeof saved !== 'object') return createGameState()
  if (!saved.box || !saved.team) return migrateV1(saved)

  const base = createGameState()
  const box = normalizeBox(saved.box)
  if (!Object.keys(box).length) {
    const starter = starterState()
    box[starter.instanceId] = starter
  }
  let team = (Array.isArray(saved.team) ? saved.team : []).filter((id) => box[id]).filter((id, index, all) => all.indexOf(id) === index).slice(0, 3)
  if (!team.length) team = [Object.keys(box)[0]]
  const activeMonsterId = team.includes(saved.activeMonsterId) ? saved.activeMonsterId : team[0]

  const next = {
    ...base,
    version: CURRENT_GAME_VERSION,
    tickets: positiveInt(saved.tickets),
    mana: positiveInt(saved.mana),
    captureItems: normalizeCaptureItems(saved),
    evolutionItems: normalizeInventory(saved),
    // v2 used global counters. They cannot be safely mapped to species-specific permanent
    // ownership without inventing which species earned them, so only explicit v3 ownership migrates.
    gigaKeyOwned: !!saved.gigaKeyOwned || positiveInt(saved.gigaKeys) > 0,
    gigaCoreSpecies: normalizeOwnershipMap(saved.gigaCoreSpecies),
    burstMarks: normalizeOwnershipMap(saved.burstMarks),
    battlesStarted: positiveInt(saved.battlesStarted),
    battlesWon: positiveInt(saved.battlesWon),
    monstersCaught: positiveInt(saved.monstersCaught),
    box,
    team,
    activeMonsterId,
    dex: { seen: { ...(saved.dex?.seen || {}) }, caught: { ...(saved.dex?.caught || {}) } },
    stagesCleared: Array.isArray(saved.stagesCleared) ? [...new Set(saved.stagesCleared.filter((id) => STAGES.some((s) => s.id === id)))] : []
  }

  for (const monster of Object.values(next.box)) {
    next.dex.seen[monster.speciesId] = true
    next.dex.caught[monster.speciesId] = true
  }
  // Remove dex entries for species that no longer exist. This makes later character-table
  // replacement/migrations fail closed instead of crashing rendering code.
  next.dex.seen = Object.fromEntries(Object.entries(next.dex.seen).filter(([id, value]) => value && speciesOf(id)))
  next.dex.caught = Object.fromEntries(Object.entries(next.dex.caught).filter(([id, value]) => value && speciesOf(id)))
  next.activeBattle = normalizeActiveBattle(saved.activeBattle, next.box, next.team)
  return next
}

export function addTickets(game, amount) {
  const next = normalizeGameState(game)
  return { ...next, tickets: Math.max(0, next.tickets + (Number(amount) || 0)) }
}

export function grantLearningReward(game, { ticketDelta = 0, unitMastered = false, hardMastered = false } = {}) {
  const next = structuredClone(normalizeGameState(game))
  next.tickets = Math.max(0, next.tickets + ticketDelta)
  if (ticketDelta > 0) next.mana += ticketDelta * 5
  if (unitMastered) next.mana += 40
  if (hardMastered) next.mana += 80
  return next
}

export function specialProgressionStatus(monster, game) {
  const species = monster ? speciesOf(monster.speciesId) : null
  const isFinal = !!species && !species.evolution
  return {
    giga: {
      label: 'ギガシンカ',
      eligibleSpecies: !!species?.gigaEligible,
      isFinal,
      hasKey: !!game?.gigaKeyOwned,
      hasCore: !!game?.gigaCoreSpecies?.[monster?.speciesId],
      // Acquisition conditions remain unresolved. The data shape now represents permanent
      // ownership without guessing those conditions.
      activatable: false
    },
    burst: {
      label: 'キョダイバースト',
      hasMark: !!game?.burstMarks?.[monster?.speciesId],
      activatable: false
    }
  }
}
