import { makeMonster } from './engine.js'
import { speciesOf } from './content.js'

const CURRENT_VERSION = 2

function starterState(level = 5, xp = 0, speciesId = 'starter-fire-1') {
  const starter = makeMonster(speciesId, Math.max(1, level), 'starter-1')
  starter.xp = Math.max(0, xp || 0)
  return starter
}

export function createGameState() {
  const starter = starterState()
  return {
    version: CURRENT_VERSION,
    tickets: 0,
    mana: 0,
    captureRings: 8,
    gigaKeys: 0,
    gigaCores: 0,
    burstCores: 0,
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
    stagesCleared: []
  }
}

function migrateV1(saved) {
  const legacyMonster = saved?.monsters?.[saved.activeMonsterId] || saved?.monsters?.['starter-001'] || {}
  const legacyStage = Math.max(1, Math.min(3, legacyMonster.stage || 1))
  const speciesId = `starter-fire-${legacyStage}`
  const starter = starterState(legacyMonster.level || 5, legacyMonster.xp || 0, speciesId)
  return {
    ...createGameState(),
    tickets: Math.max(0, saved?.tickets || 0),
    mana: Math.max(0, saved?.mana || 0),
    battlesWon: Math.max(0, saved?.battlesWon || 0),
    box: { [starter.instanceId]: starter },
    team: [starter.instanceId],
    activeMonsterId: starter.instanceId,
    dex: {
      seen: { [speciesId]: true },
      caught: { [speciesId]: true }
    }
  }
}

export function normalizeGameState(saved) {
  if (!saved || typeof saved !== 'object') return createGameState()
  if (!saved.box || !saved.team) return migrateV1(saved)

  const next = {
    ...createGameState(),
    ...structuredClone(saved),
    version: CURRENT_VERSION
  }
  next.tickets = Math.max(0, Number(next.tickets) || 0)
  next.mana = Math.max(0, Number(next.mana) || 0)
  next.captureRings = Math.max(0, Number(next.captureRings) || 0)
  next.gigaKeys = Math.max(0, Number(next.gigaKeys) || 0)
  next.gigaCores = Math.max(0, Number(next.gigaCores) || 0)
  next.burstCores = Math.max(0, Number(next.burstCores) || 0)
  next.battlesStarted = Math.max(0, Number(next.battlesStarted) || 0)
  next.battlesWon = Math.max(0, Number(next.battlesWon) || 0)
  next.monstersCaught = Math.max(0, Number(next.monstersCaught) || 0)
  next.stagesCleared = Array.isArray(next.stagesCleared) ? [...new Set(next.stagesCleared)] : []
  next.dex ||= { seen: {}, caught: {} }
  next.dex.seen ||= {}
  next.dex.caught ||= {}
  next.box ||= {}
  next.team = (Array.isArray(next.team) ? next.team : []).filter((id) => next.box[id]).slice(0, 3)

  if (!next.team.length) {
    const starter = starterState()
    next.box[starter.instanceId] = starter
    next.team = [starter.instanceId]
  }
  if (!next.activeMonsterId || !next.team.includes(next.activeMonsterId)) next.activeMonsterId = next.team[0]
  for (const monster of Object.values(next.box)) {
    if (speciesOf(monster.speciesId)) {
      next.dex.seen[monster.speciesId] = true
      next.dex.caught[monster.speciesId] = true
    }
  }
  return next
}

export function addTickets(game, amount) {
  return { ...game, tickets: Math.max(0, (game.tickets || 0) + amount) }
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
  const isFinal = !!species && !species.evolvesTo
  return {
    giga: {
      label: 'ギガシンカ',
      eligibleSpecies: !!species?.gigaEligible,
      isFinal,
      hasKey: (game?.gigaKeys || 0) > 0,
      hasCore: (game?.gigaCores || 0) > 0,
      // The final review fixes the terminology, but the exact key/core consumption rule
      // is intentionally not guessed here. Activation stays locked until that rule is wired.
      activatable: false
    },
    burst: {
      label: 'キョダイバースト',
      hasCore: (game?.burstCores || 0) > 0,
      activatable: false
    }
  }
}
