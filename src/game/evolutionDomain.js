const ACTIVE_SPECIES_MAX = 238
const APPLIED_OPERATION_LIMIT = 500

const TRANSITION_CSV = `
1,m001,m002,level,17
1,m002,m003,level,33
1,m004,m005,level,17
1,m005,m006,level,33
1,m007,m008,level,17
1,m008,m009,level,33
1,m010,m011,level,19
1,m011,m012,level,38
1,m013,m014,level,19
1,m014,m015,level,38
1,m016,m017,level,19
1,m017,m018,level,38
1,m019,m020,level,19
1,m020,m021,level,38
1,m022,m023,level,19
1,m023,m024,level,38
1,m025,m026,level,19
1,m026,m027,stone,thunder
1,m028,m029,level,19
1,m029,m030,level,38
1,m031,m032,level,19
1,m032,m033,level,38
1,m034,m035,level,19
1,m035,m036,level,38
1,m037,m038,level,19
1,m038,m039,stone,water
1,m040,m041,level,19
1,m041,m042,stone,leaf
1,m043,m044,level,19
1,m044,m045,level,38
1,m046,m047,level,19
1,m047,m048,level,38
1,m049,m050,level,21
1,m050,m051,stone,moon
1,m052,m053,level,21
1,m053,m054,level,41
2,m055,m056,level,23
2,m056,m057,stone,fire
2,m058,m059,held_item_levelup,emberwick
2,m059,m060,level,40
2,m061,m062,level,23
2,m062,m063,held_item_levelup,sunscale
2,m064,m065,stone,ancient
2,m065,m066,level,40
2,m067,m068,level,23
2,m068,m069,held_item_levelup,steelplate
2,m070,m071,level,25
2,m071,m072,level,43
2,m073,m074,level,23
2,m074,m075,level,40
2,m076,m077,level,23
2,m077,m078,level,40
2,m079,m080,level,23
2,m080,m081,stone,leaf
2,m082,m083,level,23
2,m083,m084,level,40
2,m085,m086,level,23
2,m086,m087,level,40
2,m088,m089,level,23
2,m089,m090,level,40
2,m091,m092,level,23
2,m092,m093,held_item_levelup,windband
2,m094,m095,level,23
2,m095,m096,level,40
2,m097,m098,level,25
2,m098,m099,level,43
2,m100,m101,level,23
2,m101,m102,level,40
2,m103,m104,level,23
2,m104,m105,level,40
2,m106,m107,level,23
2,m107,m108,level,40
2,m109,m110,level,23
2,m110,m111,level,40
2,m112,m113,level,23
2,m113,m114,stone,dusk
2,m115,m116,level,34
2,m117,m118,level,31
3,m119,m120,level,30
3,m120,m121,stone,ice
3,m122,m123,stone,ice
3,m123,m124,held_item_levelup,frostgem
3,m125,m126,level,30
3,m126,m127,stone,ice
3,m128,m129,level,30
3,m129,m130,level,45
3,m131,m132,level,32
3,m132,m133,stone,water
3,m134,m135,level,30
3,m135,m136,stone,leaf
3,m137,m138,level,30
3,m138,m139,level,45
3,m140,m141,level,30
3,m141,m142,held_item_levelup,barkarmor
3,m143,m144,stone,moon
3,m145,m146,level,30
3,m146,m147,stone,dusk
3,m148,m149,level,30
3,m149,m150,held_item_levelup,nightfeather
3,m151,m152,level,32
3,m152,m153,level,48
3,m154,m155,level,30
3,m155,m156,held_item_levelup,steelplate
3,m157,m158,level,30
3,m158,m159,stone,ancient
3,m160,m161,level,30
3,m161,m162,level,45
3,m163,m164,level,30
3,m164,m165,level,45
3,m166,m167,level,30
3,m167,m168,level,45
3,m169,m170,level,30
3,m170,m171,level,45
3,m172,m173,level,30
3,m173,m174,held_item_levelup,skyplume
3,m175,m176,level,32
3,m176,m177,level,48
3,m178,m179,level,30
3,m179,m180,level,45
3,m181,m182,level,32
3,m182,m183,level,48
4,m184,m185,level,42
4,m185,m186,held_item_levelup,dragonfang
4,m187,m188,level,42
4,m188,m189,stone,ancient
4,m190,m191,level,46
4,m191,m192,stone,moon
4,m193,m194,level,42
4,m194,m195,level,55
4,m196,m197,level,42
4,m197,m198,held_item_levelup,corepart
4,m199,m200,level,42
4,m200,m201,level,55
4,m202,m203,level,42
4,m203,m204,level,55
4,m205,m206,level,42
4,m206,m207,stone,dusk
4,m208,m209,level,42
4,m209,m210,stone,moon
4,m211,m212,level,42
4,m212,m213,level,55
4,m214,m215,level,42
4,m215,m216,level,55
4,m217,m218,stone,thunder
4,m218,m219,level,55
4,m220,m221,level,42
4,m221,m222,level,55
4,m223,m224,level,42
4,m224,m225,level,55
4,m226,m227,level,42
4,m227,m228,level,55
4,m229,m230,level,42
4,m230,m231,level,55
4,m232,m233,level,42
4,m233,m234,level,55
`.trim()

function parseTransition(line) {
  const [area, fromSpeciesId, toSpeciesId, method, rawParam] = line.split(',')
  return Object.freeze({
    area: Number(area),
    fromSpeciesId,
    toSpeciesId,
    method,
    ...(method === 'level' ? { level: Number(rawParam) } : { itemId: rawParam })
  })
}

export const EVOLUTION_TRANSITIONS = Object.freeze(TRANSITION_CSV.split('\n').map(parseTransition))
export const EVOLUTION_TRANSITION_BY_FROM = Object.freeze(Object.fromEntries(EVOLUTION_TRANSITIONS.map((row) => [row.fromSpeciesId, row])))

function positiveInt(value) { return Math.max(0, Math.floor(Number(value) || 0)) }
function cloneGame(game) { return structuredClone(game || {}) }
function isActiveSpeciesId(speciesId) {
  const match = /^m(\d{3})$/.exec(String(speciesId || ''))
  const no = match ? Number(match[1]) : 0
  return no >= 1 && no <= ACTIVE_SPECIES_MAX
}
function operationAlreadyApplied(game, operationId) {
  return !!operationId && Array.isArray(game?.appliedEvolutionOperationIds) && game.appliedEvolutionOperationIds.includes(String(operationId))
}
function recordOperation(game, operationId) {
  if (!operationId) return
  const id = String(operationId)
  game.appliedEvolutionOperationIds = [...new Set([...(game.appliedEvolutionOperationIds || []), id])].slice(-APPLIED_OPERATION_LIMIT)
}
function qualificationIdFor({ sourceOperationId, instanceId, transition }) {
  return `evo:${String(sourceOperationId)}:${String(instanceId)}:${transition.fromSpeciesId}->${transition.toSpeciesId}`
}

export function getEvolutionTransition(speciesId) {
  return EVOLUTION_TRANSITION_BY_FROM[String(speciesId || '')] || null
}

export function normalizePendingEvolution(monster, pending = monster?.pendingEvolution) {
  if (!monster || !pending || typeof pending !== 'object' || Array.isArray(pending)) return null
  const transition = getEvolutionTransition(monster.speciesId)
  if (!transition || transition.method === 'stone') return null
  const qualificationId = String(pending.qualificationId || '')
  const sourceOperationId = String(pending.sourceOperationId || '')
  if (!qualificationId || !sourceOperationId) return null
  if (pending.fromSpeciesId !== monster.speciesId || pending.fromSpeciesId !== transition.fromSpeciesId || pending.toSpeciesId !== transition.toSpeciesId || pending.method !== transition.method) return null
  const normalized = {
    qualificationId,
    sourceOperationId,
    fromSpeciesId: transition.fromSpeciesId,
    toSpeciesId: transition.toSpeciesId,
    method: transition.method,
    qualifiedAtLevel: Math.max(1, positiveInt(pending.qualifiedAtLevel) || positiveInt(monster.level) || 1),
    qualificationKind: String(pending.qualificationKind || 'levelup')
  }
  if (transition.method === 'held_item_levelup') normalized.itemId = String(pending.itemId || transition.itemId)
  return normalized
}

function pendingToken(monster, transition, {
  sourceOperationId,
  qualificationKind = 'levelup',
  itemId = null
}) {
  const source = String(sourceOperationId || '')
  if (!source) return null
  const token = {
    qualificationId: qualificationIdFor({ sourceOperationId: source, instanceId: monster.instanceId, transition }),
    sourceOperationId: source,
    fromSpeciesId: transition.fromSpeciesId,
    toSpeciesId: transition.toSpeciesId,
    method: transition.method,
    qualifiedAtLevel: Math.max(1, positiveInt(monster.level) || 1),
    qualificationKind
  }
  if (transition.method === 'held_item_levelup') token.itemId = String(itemId || transition.itemId)
  return token
}

function setPendingEvolution(game, instanceId, transition, options) {
  const next = cloneGame(game)
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  const existing = normalizePendingEvolution(monster)
  if (existing) {
    next.box[instanceId] = { ...monster, pendingEvolution: existing, evolutionReady: true }
    return { ok: true, game: next, pendingEvolution: existing, alreadyQualified: true }
  }
  const pending = pendingToken(monster, transition, options)
  if (!pending) return { ok: false, game: next, reason: 'SOURCE_OPERATION_ID_REQUIRED' }
  next.box[instanceId] = { ...monster, pendingEvolution: pending, evolutionReady: true }
  return { ok: true, game: next, pendingEvolution: pending, alreadyQualified: false }
}

export function evolutionTriggerStatus(monster, game, {
  trigger,
  previousLevel = null,
  newLevel = null,
  itemId = null
} = {}) {
  if (!monster) return { ready: false, reason: 'UNKNOWN_MONSTER', transition: null }
  const transition = getEvolutionTransition(monster.speciesId)
  if (!transition) return { ready: false, reason: 'NO_EVOLUTION', transition: null }

  if (transition.method === 'stone') {
    if (trigger !== 'stone') return { ready: false, reason: 'STONE_USE_REQUIRED', transition }
    if (itemId !== transition.itemId) return { ready: false, reason: 'WRONG_STONE', transition }
    const owned = positiveInt(game?.evolutionItems?.stones?.[transition.itemId])
    return owned > 0
      ? { ready: true, reason: null, transition }
      : { ready: false, reason: 'ITEM_NOT_OWNED', transition }
  }

  const pending = normalizePendingEvolution(monster)
  if (trigger === 'confirm') {
    return pending
      ? { ready: true, reason: null, transition, pendingEvolution: pending }
      : { ready: false, reason: 'PENDING_EVOLUTION_REQUIRED', transition }
  }

  if (trigger !== 'level_up') return { ready: false, reason: 'LEVEL_UP_REQUIRED', transition }
  const before = positiveInt(previousLevel)
  const after = positiveInt(newLevel)
  if (after <= before || after !== positiveInt(monster.level)) return { ready: false, reason: 'ACTUAL_LEVEL_UP_REQUIRED', transition }
  if (transition.method === 'level') {
    return after >= transition.level
      ? { ready: true, reason: null, transition }
      : { ready: false, reason: 'LEVEL_TOO_LOW', transition }
  }
  if (transition.method === 'held_item_levelup') {
    return monster.heldItemId === transition.itemId
      ? { ready: true, reason: null, transition }
      : { ready: false, reason: 'REQUIRED_HELD_ITEM_NOT_EQUIPPED', transition }
  }
  return { ready: false, reason: 'UNKNOWN_EVOLUTION_METHOD', transition }
}

export function qualifyEvolutionAfterLevelUp(game, {
  instanceId,
  previousLevel = null,
  newLevel = null,
  operationId = null
} = {}) {
  const next = cloneGame(game)
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  const status = evolutionTriggerStatus(monster, next, { trigger: 'level_up', previousLevel, newLevel })
  if (!status.ready) return { ok: false, game: next, reason: status.reason, transition: status.transition }
  const sourceOperationId = operationId || `levelup:${instanceId}:${monster.speciesId}:${positiveInt(previousLevel)}->${positiveInt(newLevel)}`
  const qualified = setPendingEvolution(next, instanceId, status.transition, {
    sourceOperationId,
    qualificationKind: 'levelup',
    itemId: status.transition.method === 'held_item_levelup' ? status.transition.itemId : null
  })
  return {
    ...qualified,
    fromSpeciesId: status.transition.fromSpeciesId,
    toSpeciesId: status.transition.toSpeciesId,
    transition: status.transition
  }
}

export function qualifyMaxLevelHeldItemEvolution(game, {
  instanceId,
  operationId = null
} = {}) {
  const next = cloneGame(game)
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  const transition = getEvolutionTransition(monster.speciesId)
  if (!transition || transition.method !== 'held_item_levelup') return { ok: false, game: next, reason: 'HELD_ITEM_LEVELUP_NOT_APPLICABLE', transition }
  if (positiveInt(monster.level) < 100) return { ok: false, game: next, reason: 'MAX_LEVEL_RECOVERY_NOT_REQUIRED', transition }
  if (monster.heldItemId !== transition.itemId) return { ok: false, game: next, reason: 'REQUIRED_HELD_ITEM_NOT_EQUIPPED', transition }
  const sourceOperationId = operationId || `max-level-held-item:${instanceId}:${transition.fromSpeciesId}->${transition.toSpeciesId}:${transition.itemId}`
  const qualified = setPendingEvolution(next, instanceId, transition, {
    sourceOperationId,
    qualificationKind: 'max-level-held-item-recovery',
    itemId: transition.itemId
  })
  return { ...qualified, fromSpeciesId: transition.fromSpeciesId, toSpeciesId: transition.toSpeciesId, transition }
}

function applyPostCommitQualification(game, instanceId, parentQualificationId) {
  const monster = game?.box?.[instanceId]
  if (!monster) return { game, pendingEvolution: null }
  const transition = getEvolutionTransition(monster.speciesId)
  if (!transition || transition.method === 'stone') return { game, pendingEvolution: null }

  if (transition.method === 'level' && positiveInt(monster.level) >= transition.level) {
    const qualified = setPendingEvolution(game, instanceId, transition, {
      sourceOperationId: `post-confirm:${parentQualificationId}:${instanceId}:${transition.fromSpeciesId}->${transition.toSpeciesId}`,
      qualificationKind: 'post-confirm-threshold'
    })
    return { game: qualified.game, pendingEvolution: qualified.pendingEvolution || null }
  }

  if (transition.method === 'held_item_levelup' && positiveInt(monster.level) >= 100 && monster.heldItemId === transition.itemId) {
    const qualified = qualifyMaxLevelHeldItemEvolution(game, {
      instanceId,
      operationId: `max-level-held-item:${instanceId}:${transition.fromSpeciesId}->${transition.toSpeciesId}:${transition.itemId}`
    })
    return { game: qualified.game, pendingEvolution: qualified.pendingEvolution || null }
  }

  return { game, pendingEvolution: null }
}

function commitTransition(game, {
  instanceId,
  transition,
  operationId,
  parentQualificationId,
  consumeStone = false
}) {
  const next = cloneGame(game)
  if (operationAlreadyApplied(next, operationId)) return { ok: true, alreadyApplied: true, game: next }
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  if (monster.speciesId !== transition.fromSpeciesId) return { ok: false, game: next, reason: 'STALE_EVOLUTION_SOURCE', transition }
  if (!isActiveSpeciesId(transition.fromSpeciesId) || !isActiveSpeciesId(transition.toSpeciesId)) return { ok: false, game: next, reason: 'INACTIVE_SPECIES_TRANSITION' }

  if (consumeStone) {
    const stones = next.evolutionItems?.stones || {}
    const remaining = positiveInt(stones[transition.itemId]) - 1
    if (remaining < 0) return { ok: false, game: next, reason: 'ITEM_NOT_OWNED', transition }
    if (remaining > 0) stones[transition.itemId] = remaining
    else delete stones[transition.itemId]
  }

  const firstEvolutionDiscovery = !next.evolutionDiscoveries?.[transition.toSpeciesId]
  next.box[instanceId] = { ...monster, speciesId: transition.toSpeciesId, pendingEvolution: null, evolutionReady: false }
  next.dex ||= { seen: {}, caught: {} }
  next.dex.seen ||= {}
  next.dex.caught ||= {}
  next.dex.seen[transition.toSpeciesId] = true
  next.dex.caught[transition.toSpeciesId] = true
  next.evolutionDiscoveries ||= {}
  next.evolutionDiscoveries[transition.toSpeciesId] = true
  recordOperation(next, operationId)

  const chained = applyPostCommitQualification(next, instanceId, parentQualificationId || operationId)
  return {
    ok: true,
    game: chained.game,
    fromSpeciesId: transition.fromSpeciesId,
    toSpeciesId: transition.toSpeciesId,
    transition,
    firstEvolutionDiscovery,
    nextPendingEvolution: chained.pendingEvolution
  }
}

export function confirmEvolution(game, {
  instanceId,
  qualificationId
} = {}) {
  const next = cloneGame(game)
  const operationId = qualificationId ? `confirm:${qualificationId}` : null
  if (operationAlreadyApplied(next, operationId)) return { ok: true, alreadyApplied: true, game: next }
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  const pending = normalizePendingEvolution(monster)
  if (!pending) return { ok: false, game: next, reason: 'PENDING_EVOLUTION_REQUIRED' }
  if (!qualificationId || pending.qualificationId !== qualificationId) return { ok: false, game: next, reason: 'STALE_EVOLUTION_QUALIFICATION' }
  const transition = getEvolutionTransition(monster.speciesId)
  return commitTransition(next, {
    instanceId,
    transition,
    operationId,
    parentQualificationId: pending.qualificationId,
    consumeStone: false
  })
}

export function evolveInstance(game, {
  instanceId,
  trigger,
  previousLevel = null,
  newLevel = null,
  itemId = null,
  operationId = null,
  qualificationId = null
} = {}) {
  if (trigger === 'level_up') return qualifyEvolutionAfterLevelUp(game, { instanceId, previousLevel, newLevel, operationId })
  if (trigger === 'confirm') return confirmEvolution(game, { instanceId, qualificationId })
  if (trigger !== 'stone') return { ok: false, game: cloneGame(game), reason: 'UNKNOWN_EVOLUTION_TRIGGER' }

  const next = cloneGame(game)
  if (operationAlreadyApplied(next, operationId)) return { ok: true, alreadyApplied: true, game: next }
  const monster = next.box?.[instanceId]
  if (!monster) return { ok: false, game: next, reason: 'UNKNOWN_MONSTER' }
  const status = evolutionTriggerStatus(monster, next, { trigger: 'stone', itemId })
  if (!status.ready) return { ok: false, game: next, reason: status.reason, transition: status.transition }
  return commitTransition(next, {
    instanceId,
    transition: status.transition,
    operationId: operationId || `stone:${instanceId}:${status.transition.fromSpeciesId}->${status.transition.toSpeciesId}`,
    parentQualificationId: operationId || `stone:${instanceId}:${status.transition.fromSpeciesId}->${status.transition.toSpeciesId}`,
    consumeStone: true
  })
}

// Compatibility name retained for callers; D-030 changes its semantics from
// auto-commit to persistent qualification.
export function evolveAfterLevelUp(game, args = {}) {
  return qualifyEvolutionAfterLevelUp(game, args)
}

export function evolveWithStone(game, args = {}) {
  return evolveInstance(game, { ...args, trigger: 'stone' })
}
