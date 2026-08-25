export const EXPLORATION_COST = 5
export const EVOLUTION_ITEM_RATE = 0.20
export const EXPLORATION_POINT_FIELD = 'explorePoint'
const APPLIED_OPERATION_LIMIT = 500

const ITEMS = [
  ['thunder', 'かみなりのいし', 'stone', 1],
  ['water', 'みずのいし', 'stone', 1],
  ['leaf', 'リーフのいし', 'stone', 1],
  ['moon', 'つきのいし', 'stone', 1],
  ['fire', 'ほのおのいし', 'stone', 2],
  ['emberwick', 'きえないシン', 'held', 2],
  ['sunscale', 'たいようのウロコ', 'held', 2],
  ['ancient', 'いにしえのいし', 'stone', 2],
  ['steelplate', 'はがねのいた', 'held', 2],
  ['windband', 'かぜのハチマキ', 'held', 2],
  ['dusk', 'よいやみのいし', 'stone', 2],
  ['ice', 'こおりのいし', 'stone', 3],
  ['frostgem', 'こおりのハート', 'held', 3],
  ['barkarmor', 'きのよろい', 'held', 3],
  ['nightfeather', 'よるのハネ', 'held', 3],
  ['skyplume', 'そらのカザリ', 'held', 3],
  ['dragonfang', 'りゅうのキバ', 'held', 4],
  ['corepart', 'コアパーツ', 'held', 4]
]

export const EVOLUTION_ITEM_CATALOG = Object.freeze(Object.fromEntries(ITEMS.map(([id, name, kind, unlockArea]) => [
  id,
  Object.freeze({ id, name, kind, unlockArea })
])))
export const REGIONAL_EVOLUTION_ITEMS = Object.freeze(Object.fromEntries([1, 2, 3, 4].map((areaId) => [
  areaId,
  Object.freeze(ITEMS.filter((row) => row[3] === areaId).map((row) => row[0]))
])))

function positiveInt(value) { return Math.max(0, Math.floor(Number(value) || 0)) }
function cloneGame(game) { return structuredClone(game || {}) }
function clampRoll(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(0.999999999999, n))
}
function areaIsUnlocked(areaId, unlockedAreaIds) {
  const area = Number(areaId)
  if (unlockedAreaIds instanceof Set) return unlockedAreaIds.has(area)
  if (Array.isArray(unlockedAreaIds)) return unlockedAreaIds.map(Number).includes(area)
  if (unlockedAreaIds && typeof unlockedAreaIds === 'object') return !!unlockedAreaIds[area]
  return area === 1
}
function applied(game, field, operationId) {
  return !!operationId && Array.isArray(game?.[field]) && game[field].includes(String(operationId))
}
function record(game, field, operationId) {
  if (!operationId) return
  game[field] = [...new Set([...(game[field] || []), String(operationId)])].slice(-APPLIED_OPERATION_LIMIT)
}
function ensureInventory(game) {
  game.evolutionItems ||= {}
  game.evolutionItems.stones ||= {}
  game.evolutionItems.heldItems ||= {}
}
function grantItem(game, itemId) {
  const item = EVOLUTION_ITEM_CATALOG[itemId]
  if (!item) return false
  ensureInventory(game)
  const bucket = item.kind === 'stone' ? game.evolutionItems.stones : game.evolutionItems.heldItems
  bucket[itemId] = positiveInt(bucket[itemId]) + 1
  return true
}
function pityMap(game) {
  game.explorationPityMissesByArea ||= {}
  return game.explorationPityMissesByArea
}

export function eligibleEvolutionItemsForArea(areaId) {
  return [...(REGIONAL_EVOLUTION_ITEMS[Number(areaId)] || [])]
}

export function explorationStatus(game, areaId, unlockedAreaIds = null) {
  const area = Number(areaId)
  const choices = eligibleEvolutionItemsForArea(area)
  const misses = Math.min(5, positiveInt(game?.explorationPityMissesByArea?.[area]))
  const points = positiveInt(game?.[EXPLORATION_POINT_FIELD])
  const unlocked = areaIsUnlocked(area, unlockedAreaIds)
  return {
    areaId: area,
    unlocked,
    points,
    cost: EXPLORATION_COST,
    misses,
    pityChoiceRequired: misses >= 5,
    choices,
    canExplore: unlocked && choices.length > 0 && points >= EXPLORATION_COST
  }
}

export function performEvolutionExploration(game, {
  areaId,
  unlockedAreaIds = null,
  choiceItemId = null,
  rng = Math.random,
  operationId = null
} = {}) {
  const next = cloneGame(game)
  if (applied(next, 'appliedExplorationOperationIds', operationId)) return { ok: true, alreadyApplied: true, game: next }
  const status = explorationStatus(next, areaId, unlockedAreaIds)
  if (!status.unlocked) return { ok: false, game: next, reason: 'AREA_LOCKED' }
  if (!status.choices.length) return { ok: false, game: next, reason: 'NO_REGIONAL_EVOLUTION_ITEMS' }
  if (status.points < EXPLORATION_COST) return { ok: false, game: next, reason: 'NOT_ENOUGH_EXPLORATION_POINTS' }

  if (status.pityChoiceRequired) {
    if (!status.choices.includes(choiceItemId)) {
      return { ok: false, game: next, reason: 'PITY_CHOICE_REQUIRED', choices: status.choices }
    }
    next[EXPLORATION_POINT_FIELD] = status.points - EXPLORATION_COST
    grantItem(next, choiceItemId)
    pityMap(next)[status.areaId] = 0
    record(next, 'appliedExplorationOperationIds', operationId)
    return { ok: true, game: next, result: { kind: 'evolution_item', source: 'pity', itemId: choiceItemId } }
  }

  next[EXPLORATION_POINT_FIELD] = status.points - EXPLORATION_COST
  const outcomeRoll = clampRoll(rng())
  if (outcomeRoll < EVOLUTION_ITEM_RATE) {
    const itemRoll = clampRoll(rng())
    const itemId = status.choices[Math.floor(itemRoll * status.choices.length)]
    grantItem(next, itemId)
    pityMap(next)[status.areaId] = 0
    record(next, 'appliedExplorationOperationIds', operationId)
    return { ok: true, game: next, result: { kind: 'evolution_item', source: 'normal', itemId } }
  }

  const pities = pityMap(next)
  pities[status.areaId] = Math.min(5, status.misses + 1)
  record(next, 'appliedExplorationOperationIds', operationId)
  return { ok: true, game: next, result: { kind: 'material', source: 'normal' } }
}

export function grantBossRegionalEvolutionItem(game, {
  areaId,
  itemId = null,
  operationId = null
} = {}) {
  const next = cloneGame(game)
  if (applied(next, 'appliedBossEvolutionBonusIds', operationId)) return { ok: true, alreadyApplied: true, game: next }
  const eligible = eligibleEvolutionItemsForArea(areaId)
  if (!eligible.length) return { ok: false, game: next, reason: 'NO_REGIONAL_EVOLUTION_ITEMS' }
  if (!itemId) return { ok: false, game: next, reason: 'BOSS_ITEM_SELECTION_UNRESOLVED', eligibleItemIds: eligible }
  if (!eligible.includes(itemId)) return { ok: false, game: next, reason: 'ITEM_NOT_ELIGIBLE_FOR_AREA', eligibleItemIds: eligible }
  grantItem(next, itemId)
  record(next, 'appliedBossEvolutionBonusIds', operationId)
  return { ok: true, game: next, itemId }
}
