import { EVOLUTION_ITEMS, STAGES, speciesOf } from './content.js'

export const CURRENT_GAME_VERSION = 6
export const CAPTURE_ITEM_IDS = ['star', 'silver', 'gold', 'rainbow']
export const TICKET_TTL_DAYS = 7

function localDayNumber(d = new Date()) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor(local.getTime() / 86400000)
}

function starterState(level = 5, xp = 0, speciesId = 'starter-fire-1') {
  return {
    instanceId: 'starter-1',
    speciesId,
    level: Math.max(1, Number(level) || 1),
    xp: Math.max(0, Number(xp) || 0),
    heldItemId: null,
    evolutionReady: false,
    caughtAt: Date.now()
  }
}

function positiveInt(value) { return Math.max(0, Math.floor(Number(value) || 0)) }
function ticketId(prefix = 'ticket') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

function makeTicketGrant(count, earnedDay, prefix = 'grant') {
  return { id: ticketId(prefix), count: positiveInt(count), earnedDay, expiresDay: earnedDay + TICKET_TTL_DAYS }
}

export function createGameState() {
  const starter = starterState()
  return {
    version: CURRENT_GAME_VERSION,
    tickets: 0,
    ticketGrants: [],
    mana: 0,
    captureItems: { star: 8, silver: 0, gold: 0, rainbow: 0 },
    evolutionItems: { stones: {}, heldItems: {} },
    gigaKeyOwned: false,
    gigaCoreSpecies: {},
    burstMarks: {},
    bossBalanceSnapshots: {},
    normalStageSnapshots: {},
    battlesStarted: 0,
    battlesWon: 0,
    battlesAbandoned: 0,
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

function normalizeTicketGrants(saved, today) {
  const raw = Array.isArray(saved?.ticketGrants) ? saved.ticketGrants : null
  if (!raw) {
    const legacyCount = positiveInt(saved?.tickets)
    return legacyCount ? [makeTicketGrant(legacyCount, today, 'legacy')] : []
  }
  return raw
    .map((grant, index) => ({
      id: String(grant?.id || `migrated-${today}-${index}`),
      count: positiveInt(grant?.count),
      earnedDay: Number.isFinite(Number(grant?.earnedDay)) ? Math.floor(Number(grant.earnedDay)) : today,
      expiresDay: Number.isFinite(Number(grant?.expiresDay)) ? Math.floor(Number(grant.expiresDay)) : today + TICKET_TTL_DAYS
    }))
    .filter((grant) => grant.count > 0 && grant.expiresDay > today)
    .sort((a, b) => a.expiresDay - b.expiresDay || a.earnedDay - b.earnedDay || a.id.localeCompare(b.id))
}

export function availableTicketCount(game, today = localDayNumber()) {
  const grants = Array.isArray(game?.ticketGrants)
    ? game.ticketGrants
    : positiveInt(game?.tickets) > 0 ? [makeTicketGrant(game.tickets, today, 'legacy-view')] : []
  return grants.reduce((sum, grant) => grant?.expiresDay > today ? sum + positiveInt(grant.count) : sum, 0)
}

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
  const clean = (value, allowed) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).map(([id, count]) => [id, positiveInt(count)]).filter(([id, count]) => count > 0 && allowed(id)))
    : {}
  return {
    stones: clean(evo.stones, (id) => EVOLUTION_ITEMS.stones[id]),
    heldItems: clean(evo.heldItems, (id) => EVOLUTION_ITEMS.heldItems[id])
  }
}

function normalizeBossBalanceSnapshots(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result = {}
  for (const [stageId, raw] of Object.entries(value)) {
    const stage = STAGES.find((entry) => entry.id === stageId && entry.bossRank)
    if (!stage || !raw || typeof raw !== 'object') continue
    const lockedLevel = Math.max(1, Math.min(100, positiveInt(raw.lockedLevel) || 1))
    const multipliers = raw.statMultipliers || {}
    result[stageId] = {
      stageId,
      bossId: String(raw.bossId || stage.bossId || stage.enemySpeciesId),
      bossRank: String(raw.bossRank || stage.bossRank),
      lockedLevel,
      referencePower: Math.max(1, Number(raw.referencePower) || 1),
      targetPower: Math.max(1, Number(raw.targetPower) || 1),
      statMultipliers: {
        hp: Math.max(1, Number(multipliers.hp) || 1),
        attack: Math.max(1, Number(multipliers.attack) || 1),
        defense: Math.max(1, Number(multipliers.defense) || 1),
        speed: Math.max(1, Number(multipliers.speed) || 1)
      },
      balanceVersion: positiveInt(raw.balanceVersion) || 1
    }
  }
  return result
}

function normalizeNormalStageSnapshots(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result = {}
  for (const [stageId, raw] of Object.entries(value)) {
    const stage = STAGES.find((entry) => entry.id === stageId && !entry.bossRank)
    const firstClearReferencePower = Number(raw?.firstClearReferencePower)
    if (!stage || !raw || typeof raw !== 'object' || !Number.isFinite(firstClearReferencePower) || firstClearReferencePower <= 0) continue
    result[stageId] = {
      stageId,
      firstClearReferencePower: Math.max(1, firstClearReferencePower),
      balanceVersion: positiveInt(raw.balanceVersion) || 1
    }
  }
  return result
}

function normalizeBox(savedBox) {
  const box = {}
  for (const [instanceId, raw] of Object.entries(savedBox || {})) {
    if (!raw || !speciesOf(raw.speciesId)) continue
    const heldItemId = raw.heldItemId && EVOLUTION_ITEMS.heldItems[raw.heldItemId] ? raw.heldItemId : null
    box[instanceId] = {
      instanceId,
      speciesId: raw.speciesId,
      level: Math.max(1, positiveInt(raw.level) || 1),
      xp: positiveInt(raw.xp),
      heldItemId,
      evolutionReady: !!raw.evolutionReady,
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
  const ticketSource = raw.ticketSource && typeof raw.ticketSource === 'object'
    ? {
        id: String(raw.ticketSource.id || 'unknown'),
        earnedDay: Math.floor(Number(raw.ticketSource.earnedDay) || 0),
        expiresDay: Math.floor(Number(raw.ticketSource.expiresDay) || 0)
      }
    : null
  const teamAtStart = (Array.isArray(raw.teamAtStart) ? raw.teamAtStart : team)
    .filter((id, index, all) => !!box[id] && all.indexOf(id) === index)
    .slice(0, 3)
  return {
    ...structuredClone(raw),
    activeInstanceId: activeId,
    partyHp,
    teamAtStart,
    ticketSource,
    ticketRefunded: !!raw.ticketRefunded,
    captureAttempts: Math.max(0, Math.min(3, positiveInt(raw.captureAttempts))),
    captureStars: Math.max(0, Math.min(4, positiveInt(raw.captureStars)))
  }
}

function migrateV1(saved, today) {
  const legacyMonster = saved?.monsters?.[saved.activeMonsterId] || saved?.monsters?.['starter-001'] || {}
  const legacyStage = Math.max(1, Math.min(3, Number(legacyMonster.stage) || 1))
  const speciesId = `starter-fire-${legacyStage}`
  const starter = starterState(legacyMonster.level || 5, legacyMonster.xp || 0, speciesId)
  const next = {
    ...createGameState(),
    mana: Math.max(0, Number(saved?.mana) || 0),
    battlesWon: Math.max(0, Number(saved?.battlesWon) || 0),
    box: { [starter.instanceId]: starter },
    team: [starter.instanceId],
    activeMonsterId: starter.instanceId,
    dex: { seen: { [speciesId]: true }, caught: { [speciesId]: true } },
    ticketGrants: normalizeTicketGrants(saved, today)
  }
  next.tickets = availableTicketCount(next, today)
  return next
}

export function normalizeGameState(saved, today = localDayNumber()) {
  if (!saved || typeof saved !== 'object') return createGameState()
  if (!saved.box || !saved.team) return migrateV1(saved, today)

  const base = createGameState()
  const box = normalizeBox(saved.box)
  if (!Object.keys(box).length) {
    const starter = starterState()
    box[starter.instanceId] = starter
  }
  let team = (Array.isArray(saved.team) ? saved.team : []).filter((id) => box[id]).filter((id, index, all) => all.indexOf(id) === index).slice(0, 3)
  if (!team.length) team = [Object.keys(box)[0]]
  const activeMonsterId = team.includes(saved.activeMonsterId) ? saved.activeMonsterId : team[0]
  const ticketGrants = normalizeTicketGrants(saved, today)

  const next = {
    ...base,
    version: CURRENT_GAME_VERSION,
    ticketGrants,
    tickets: 0,
    mana: positiveInt(saved.mana),
    captureItems: normalizeCaptureItems(saved),
    evolutionItems: normalizeInventory(saved),
    gigaKeyOwned: !!saved.gigaKeyOwned || positiveInt(saved.gigaKeys) > 0,
    gigaCoreSpecies: normalizeOwnershipMap(saved.gigaCoreSpecies),
    burstMarks: normalizeOwnershipMap(saved.burstMarks),
    bossBalanceSnapshots: normalizeBossBalanceSnapshots(saved.bossBalanceSnapshots),
    normalStageSnapshots: normalizeNormalStageSnapshots(saved.normalStageSnapshots),
    battlesStarted: positiveInt(saved.battlesStarted),
    battlesWon: positiveInt(saved.battlesWon),
    battlesAbandoned: positiveInt(saved.battlesAbandoned),
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
  next.dex.seen = Object.fromEntries(Object.entries(next.dex.seen).filter(([id, value]) => value && speciesOf(id)))
  next.dex.caught = Object.fromEntries(Object.entries(next.dex.caught).filter(([id, value]) => value && speciesOf(id)))
  next.activeBattle = normalizeActiveBattle(saved.activeBattle, next.box, next.team)
  next.tickets = availableTicketCount(next, today)
  return next
}

export function grantTickets(game, amount, today = localDayNumber()) {
  const next = structuredClone(normalizeGameState(game, today))
  const count = positiveInt(amount)
  if (count > 0) next.ticketGrants.push(makeTicketGrant(count, today))
  next.ticketGrants.sort((a, b) => a.expiresDay - b.expiresDay || a.earnedDay - b.earnedDay)
  next.tickets = availableTicketCount(next, today)
  return next
}

export function addTickets(game, amount, today = localDayNumber()) {
  if ((Number(amount) || 0) <= 0) return normalizeGameState(game, today)
  return grantTickets(game, amount, today)
}

export function consumeTicket(game, today = localDayNumber()) {
  const next = structuredClone(normalizeGameState(game, today))
  const index = next.ticketGrants.findIndex((grant) => grant.expiresDay > today && grant.count > 0)
  if (index < 0) return { ok: false, game: next, reason: 'NO_TICKET' }
  const grant = next.ticketGrants[index]
  const consumed = { id: grant.id, earnedDay: grant.earnedDay, expiresDay: grant.expiresDay }
  grant.count -= 1
  if (grant.count <= 0) next.ticketGrants.splice(index, 1)
  next.tickets = availableTicketCount(next, today)
  return { ok: true, game: next, consumed }
}

export function refundTicket(game, ticketSource, today = localDayNumber()) {
  const next = structuredClone(normalizeGameState(game, today))
  if (!ticketSource || Number(ticketSource.expiresDay) <= today) return { game: next, refunded: false, reason: 'TICKET_EXPIRED' }
  const sourceId = String(ticketSource.id || 'refund')
  const existing = next.ticketGrants.find((grant) => grant.id === sourceId && grant.earnedDay === ticketSource.earnedDay && grant.expiresDay === ticketSource.expiresDay)
  if (existing) existing.count += 1
  else next.ticketGrants.push({ id: sourceId, count: 1, earnedDay: ticketSource.earnedDay, expiresDay: ticketSource.expiresDay })
  next.ticketGrants.sort((a, b) => a.expiresDay - b.expiresDay || a.earnedDay - b.earnedDay)
  next.tickets = availableTicketCount(next, today)
  return { game: next, refunded: true }
}

export function grantEvolutionItem(game, kind, itemId, count = 1, today = localDayNumber()) {
  const next = structuredClone(normalizeGameState(game, today))
  const bucket = kind === 'stone' ? 'stones' : kind === 'held' ? 'heldItems' : null
  const catalog = kind === 'stone' ? EVOLUTION_ITEMS.stones : kind === 'held' ? EVOLUTION_ITEMS.heldItems : null
  if (!bucket || !catalog?.[itemId]) return { ok: false, game: next, reason: 'UNKNOWN_EVOLUTION_ITEM' }
  next.evolutionItems[bucket][itemId] = positiveInt(next.evolutionItems[bucket][itemId]) + positiveInt(count)
  return { ok: true, game: next }
}

export function equipHeldItem(game, instanceId, itemId, today = localDayNumber()) {
  const next = structuredClone(normalizeGameState(game, today))
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  if (!EVOLUTION_ITEMS.heldItems[itemId]) return { ok: false, game: next, reason: 'UNKNOWN_HELD_ITEM' }
  if ((next.evolutionItems.heldItems[itemId] || 0) < 1) return { ok: false, game: next, reason: 'ITEM_NOT_OWNED' }
  if (monster.heldItemId === itemId) return { ok: true, game: next }
  if (monster.heldItemId) next.evolutionItems.heldItems[monster.heldItemId] = (next.evolutionItems.heldItems[monster.heldItemId] || 0) + 1
  next.evolutionItems.heldItems[itemId] -= 1
  if (next.evolutionItems.heldItems[itemId] <= 0) delete next.evolutionItems.heldItems[itemId]
  monster.heldItemId = itemId
  monster.evolutionReady = false
  return { ok: true, game: next }
}

export function grantLearningReward(game, {
  ticketDelta = 0,
  captureItemDelta = null,
  unitMastered = false,
  hardMastered = false,
  today = localDayNumber()
} = {}) {
  let next = structuredClone(normalizeGameState(game, today))
  if (ticketDelta > 0) next = grantTickets(next, ticketDelta, today)
  if (ticketDelta > 0) next.mana += ticketDelta * 5
  for (const id of CAPTURE_ITEM_IDS) next.captureItems[id] += positiveInt(captureItemDelta?.[id])
  if (unitMastered) {
    next.mana += 40
    next.captureItems.silver += 1
  }
  if (hardMastered) {
    next.mana += 80
    next.captureItems.gold += 1
  }
  next.tickets = availableTicketCount(next, today)
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
      activatable: false
    },
    burst: {
      label: 'キョダイバースト',
      hasMark: !!game?.burstMarks?.[monster?.speciesId],
      activatable: false
    }
  }
}
