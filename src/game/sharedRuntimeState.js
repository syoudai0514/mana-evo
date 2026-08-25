const MAIN_AREAS = [1, 2, 3, 4]

function positiveInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function idList(value, limit = 4000) {
  return Array.isArray(value)
    ? [...new Set(value.map((id) => String(id || '').trim()).filter(Boolean))].slice(-limit)
    : []
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function normalizeAreaBossProgress(value) {
  const source = objectValue(value)
  return Object.fromEntries(MAIN_AREAS.map((area) => {
    const raw = objectValue(source[area] ?? source[String(area)])
    return [area, {
      points: positiveInt(raw.points),
      uniqueSkillIds: idList(raw.uniqueSkillIds, 500),
      appliedEventIds: idList(raw.appliedEventIds, 4000)
    }]
  }))
}

function normalizePity(value) {
  const source = objectValue(value)
  const result = {}
  for (const area of MAIN_AREAS) {
    const misses = Math.min(5, positiveInt(source[area] ?? source[String(area)]))
    if (misses > 0) result[area] = misses
  }
  return result
}

function normalizeCaptureDomain(value) {
  const source = objectValue(value)
  return {
    settlements: structuredClone(objectValue(source.settlements)),
    shardRedemptions: structuredClone(objectValue(source.shardRedemptions))
  }
}

export function sharedRuntimeStateFrom(source = {}) {
  return {
    explorePoint: positiveInt(source.explorePoint),
    explorationPityMissesByArea: normalizePity(source.explorationPityMissesByArea),
    appliedLearningProgressionSignalIds: idList(source.appliedLearningProgressionSignalIds),
    areaBossProgress: normalizeAreaBossProgress(source.areaBossProgress),
    captureDomain: normalizeCaptureDomain(source.captureDomain),
    growthShards: positiveInt(source.growthShards),
    appliedEvolutionOperationIds: idList(source.appliedEvolutionOperationIds, 500),
    appliedExplorationOperationIds: idList(source.appliedExplorationOperationIds, 500),
    appliedBossEvolutionBonusIds: idList(source.appliedBossEvolutionBonusIds, 500)
  }
}

export function withSharedRuntimeState(target = {}, source = target) {
  return {
    ...(target || {}),
    ...sharedRuntimeStateFrom(source || {})
  }
}
