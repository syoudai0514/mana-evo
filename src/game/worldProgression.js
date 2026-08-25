export const WORLD_AREA_META = Object.freeze([
  {
    area: 1,
    name: 'ひかりの のはら',
    icon: '🌿',
    levelMin: 5,
    levelMax: 22,
    levelLabel: 'おすすめ Lv.5〜22',
    zones: [
      { id: 'meadow', name: 'はじまりの そうげん', icon: '🌱', minLevel: 5, maxLevel: 10 },
      { id: 'forest', name: 'こもれびの もり', icon: '🌳', minLevel: 11, maxLevel: 16 },
      { id: 'deep', name: 'ひかりの おくち', icon: '✨', minLevel: 17, maxLevel: 22 }
    ]
  },
  {
    area: 2,
    name: 'ほのおの かざん・すなの たに',
    icon: '🌋',
    levelMin: 18,
    levelMax: 38,
    levelLabel: 'おすすめ Lv.18〜38',
    zones: [
      { id: 'foothill', name: 'かざんの ふもと', icon: '🔥', minLevel: 18, maxLevel: 24 },
      { id: 'magma', name: 'マグマどうくつ', icon: '🌋', minLevel: 25, maxLevel: 31 },
      { id: 'deep', name: 'すなあらしの おくち', icon: '🏜️', minLevel: 32, maxLevel: 38 }
    ]
  },
  {
    area: 3,
    name: 'こおりの うみ・ふかい もり',
    icon: '❄️',
    levelMin: 32,
    levelMax: 58,
    levelLabel: 'おすすめ Lv.32〜58',
    zones: [
      { id: 'coast', name: 'こおりの かいがん', icon: '🧊', minLevel: 32, maxLevel: 40 },
      { id: 'frost', name: 'じゅひょうの もり', icon: '🌲', minLevel: 41, maxLevel: 49 },
      { id: 'deep', name: 'ふかい もりの おく', icon: '🌌', minLevel: 50, maxLevel: 58 }
    ]
  },
  {
    area: 4,
    name: 'ぎんがの みやこ・そらの はて',
    icon: '🌠',
    levelMin: 50,
    levelMax: 80,
    levelLabel: 'おすすめ Lv.50〜80',
    zones: [
      { id: 'city', name: 'ほしの みやこ', icon: '🌃', minLevel: 50, maxLevel: 60 },
      { id: 'skyway', name: 'てんくう かいろう', icon: '☁️', minLevel: 61, maxLevel: 70 },
      { id: 'deep', name: 'ぎんがの はて', icon: '🌌', minLevel: 71, maxLevel: 80 }
    ]
  },
  {
    area: 5,
    name: 'EX いせかい',
    icon: '🌀',
    levelMin: 70,
    levelMax: 100,
    levelLabel: 'おすすめ Lv.70〜100',
    zones: [{ id: 'ex', name: 'EX いせかい', icon: '🌀', minLevel: 70, maxLevel: 100 }]
  }
])

export const MAIN_ADVENTURE_AREAS = Object.freeze([1, 2, 3, 4])
export const ROUTE_CLEAR_TUNING_DEFAULT = 2
export const AREA_BOSS_REQUIREMENT = Object.freeze({ minPoints: 12, minUniqueSkills: 2 })

function positiveInt(value) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function mainArea(value) {
  const area = positiveInt(value)
  return MAIN_ADVENTURE_AREAS.includes(area) ? area : null
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '')).filter(Boolean))]
}

function bossStageId(area) {
  return `a${area}-boss`
}

function clearedStageSet(game) {
  return new Set(Array.isArray(game?.stagesCleared) ? game.stagesCleared : [])
}

function emptyAreaBossProgress() {
  return { points: 0, uniqueSkillIds: [], appliedEventIds: [] }
}

export function areaBossProgressFor(game, area) {
  const normalizedArea = mainArea(area)
  if (!normalizedArea) return emptyAreaBossProgress()
  const raw = game?.areaBossProgress?.[normalizedArea] || game?.areaBossProgress?.[String(normalizedArea)] || {}
  return {
    points: positiveInt(raw.points),
    uniqueSkillIds: uniqueStrings(raw.uniqueSkillIds),
    appliedEventIds: uniqueStrings(raw.appliedEventIds)
  }
}

export function areaBossEligibility(game, area) {
  const normalizedArea = mainArea(area)
  if (!normalizedArea) {
    return {
      eligible: false,
      area: Number(area) || 0,
      points: 0,
      uniqueSkillCount: 0,
      requiredPoints: AREA_BOSS_REQUIREMENT.minPoints,
      requiredUniqueSkills: AREA_BOSS_REQUIREMENT.minUniqueSkills,
      missingPoints: AREA_BOSS_REQUIREMENT.minPoints,
      missingUniqueSkills: AREA_BOSS_REQUIREMENT.minUniqueSkills
    }
  }
  const progress = areaBossProgressFor(game, normalizedArea)
  const uniqueSkillCount = progress.uniqueSkillIds.length
  return {
    eligible: progress.points >= AREA_BOSS_REQUIREMENT.minPoints && uniqueSkillCount >= AREA_BOSS_REQUIREMENT.minUniqueSkills,
    area: normalizedArea,
    points: progress.points,
    uniqueSkillCount,
    requiredPoints: AREA_BOSS_REQUIREMENT.minPoints,
    requiredUniqueSkills: AREA_BOSS_REQUIREMENT.minUniqueSkills,
    missingPoints: Math.max(0, AREA_BOSS_REQUIREMENT.minPoints - progress.points),
    missingUniqueSkills: Math.max(0, AREA_BOSS_REQUIREMENT.minUniqueSkills - uniqueSkillCount)
  }
}

export function applyAreaBossProgressEvent(game, {
  id,
  area,
  points = 0,
  skillId = null,
  skillIds = []
} = {}) {
  const normalizedArea = mainArea(area)
  if (!normalizedArea) return { ok: false, game, reason: 'INVALID_AREA' }
  const eventId = String(id || '')
  if (!eventId) return { ok: false, game, reason: 'MISSING_EVENT_ID' }

  const current = areaBossProgressFor(game, normalizedArea)
  if (current.appliedEventIds.includes(eventId)) {
    return { ok: true, game, changed: false, progress: current, eligibility: areaBossEligibility(game, normalizedArea) }
  }

  const next = structuredClone(game || {})
  next.areaBossProgress ||= {}
  const nextSkills = uniqueStrings([...current.uniqueSkillIds, skillId, ...(Array.isArray(skillIds) ? skillIds : [])])
  next.areaBossProgress[normalizedArea] = {
    points: current.points + positiveInt(points),
    uniqueSkillIds: nextSkills,
    appliedEventIds: [...current.appliedEventIds, eventId]
  }
  return {
    ok: true,
    game: next,
    changed: true,
    progress: areaBossProgressFor(next, normalizedArea),
    eligibility: areaBossEligibility(next, normalizedArea)
  }
}

export function isAdventureAreaUnlocked(game, area, { exUnlocked = null } = {}) {
  const normalized = positiveInt(area)
  if (normalized === 1) return true
  if (normalized >= 2 && normalized <= 4) return clearedStageSet(game).has(bossStageId(normalized - 1))
  if (normalized !== 5) return false

  // CURRENT preserves the existing all-main-bosses EX rule only as a continuity default.
  // A future canonical EX decision can override this without changing Area1-4 progression.
  if (typeof exUnlocked === 'boolean') return exUnlocked
  const cleared = clearedStageSet(game)
  return MAIN_ADVENTURE_AREAS.every((main) => cleared.has(bossStageId(main)))
}

export function applyFirstBossClear(game, area) {
  const normalizedArea = mainArea(area)
  if (!normalizedArea) return { ok: false, game, reason: 'INVALID_AREA' }

  const id = bossStageId(normalizedArea)
  const cleared = clearedStageSet(game)
  const eligibility = areaBossEligibility(game, normalizedArea)
  // A persisted first-clear marker is authoritative for idempotency and legacy-save compatibility.
  // Do not require newly introduced boss-progress state to re-validate an already cleared boss.
  if (cleared.has(id)) {
    return { ok: true, game, firstClear: false, unlockedArea: null, eligibility }
  }
  if (!eligibility.eligible) return { ok: false, game, reason: 'BOSS_NOT_ELIGIBLE', eligibility }

  const next = structuredClone(game || {})
  next.stagesCleared = [...cleared, id]
  next.areaBossProgress ||= {}
  const unlockedArea = normalizedArea < 4 ? normalizedArea + 1 : null
  if (unlockedArea && !next.areaBossProgress[unlockedArea]) {
    next.areaBossProgress[unlockedArea] = emptyAreaBossProgress()
  }
  return { ok: true, game: next, firstClear: true, unlockedArea, eligibility }
}

function numberOf(species) {
  const parsed = Number.parseInt(String(species?.no || '').replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function adventureAreaForStage(stage, species) {
  if (['event', 'ex'].includes(stage?.kind) || Number(stage?.area) > 4) return 5
  const sourceArea = Math.max(1, Number(stage?.area) || 1)
  const formStage = Math.max(1, Number(species?.stage) || 1)
  const isFinalEvolution = formStage > 1 && !species?.evolution
  // Continuity tuning only: source area stays untouched while later wild placement can differ.
  if (stage?.kind === 'wild' && formStage >= 2 && !isFinalEvolution) {
    if (sourceArea === 1) return 3
    if (sourceArea === 2) return 4
  }
  return sourceArea
}

function metaForStage(stage, species) {
  const adventureArea = adventureAreaForStage(stage, species)
  return WORLD_AREA_META.find((meta) => meta.area === adventureArea) || WORLD_AREA_META[0]
}

function zoneForStage(meta, stage, species) {
  if (meta.area === 5) return meta.zones[0]
  if (stage?.kind === 'boss') return meta.zones[meta.zones.length - 1]
  if (['evolution-trial', 'giga-challenge', 'burst-challenge'].includes(stage?.kind)) return meta.zones[meta.zones.length - 1]
  const formStage = Math.max(1, Number(species?.stage) || 1)
  if (formStage >= 2) return meta.zones[meta.zones.length - 1]
  const earlyZones = meta.zones.slice(0, Math.min(2, meta.zones.length))
  return earlyZones[(Math.max(1, numberOf(species)) - 1) % earlyZones.length]
}

export function enrichStage(stage, species) {
  if (!stage || stage.legacy) return stage
  const meta = metaForStage(stage, species)
  const zone = zoneForStage(meta, stage, species)
  const zoneIndex = Math.max(0, meta.zones.findIndex((entry) => entry.id === zone.id))
  const formStage = Math.max(1, Number(species?.stage) || 1)
  const isFinalEvolution = formStage > 1 && !species?.evolution
  const isEvolvedWild = stage.kind === 'wild' && formStage >= 2
  const isFirstEvolvedForm = isEvolvedWild && !isFinalEvolution
  const next = {
    ...stage,
    sourceArea: stage.area,
    adventureArea: meta.area,
    adventureAreaName: meta.name,
    zoneId: zone.id,
    zoneName: zone.name,
    zoneIcon: zone.icon,
    zoneIndex,
    zoneGatePreviousId: zoneIndex > 0 ? meta.zones[zoneIndex - 1]?.id || null : null,
    zoneGateMinClears: zoneIndex > 0 ? ROUTE_CLEAR_TUNING_DEFAULT : 0,
    minEnemyLevel: zone.minLevel,
    maxEnemyLevel: zone.maxLevel,
    levelLabel: `Lv.${zone.minLevel}〜${zone.maxLevel}`,
    firstAcquireByEvolution: isFirstEvolvedForm,
    advancedEvolutionWild: isFirstEvolvedForm
  }

  if (stage.kind === 'wild' && meta.area !== Number(stage.area) && meta.area > 1 && meta.area <= 4) {
    next.areaGateBossId = bossStageId(meta.area - 1)
  }

  if (isFirstEvolvedForm) next.requiresEvolutionDiscoverySpeciesId = species.id

  if (stage.kind === 'wild' && isFinalEvolution) {
    next.hidden = true
    next.captureDisabled = true
    next.finalEvolutionOnly = true
  }

  if (stage.kind === 'boss' && meta.area <= 4) {
    next.requiresAreaBossProgress = true
    next.bossProgressArea = meta.area
    next.bossProgressRequirement = AREA_BOSS_REQUIREMENT
  }
  return next
}

function stagesClearedInZone(game, stages, area, zoneId) {
  const cleared = clearedStageSet(game)
  return new Set((stages || [])
    .filter((stage) => stage?.kind === 'wild')
    .filter((stage) => Number(stage.adventureArea || stage.area) === Number(area))
    .filter((stage) => stage.zoneId === zoneId)
    .filter((stage) => cleared.has(stage.id))
    .map((stage) => stage.id)).size
}

export function adventureZoneProgress(game, stages, area, zoneId, { exUnlocked = null } = {}) {
  const numericArea = positiveInt(area)
  const meta = WORLD_AREA_META.find((entry) => entry.area === numericArea)
  if (!meta) return { unlocked: false, clears: 0, required: 0, remaining: 0, previousZoneName: null, reason: 'UNKNOWN_AREA' }
  if (!isAdventureAreaUnlocked(game, numericArea, { exUnlocked })) {
    return { unlocked: false, clears: 0, required: 0, remaining: 0, previousZoneName: null, reason: 'AREA_LOCKED' }
  }
  const index = meta.zones.findIndex((zone) => zone.id === zoneId)
  if (index < 0) return { unlocked: false, clears: 0, required: 0, remaining: 0, previousZoneName: null, reason: 'UNKNOWN_ZONE' }
  if (numericArea === 5 || index === 0) return { unlocked: true, clears: 0, required: 0, remaining: 0, previousZoneName: null, reason: null }

  const previous = meta.zones[index - 1]
  const required = ROUTE_CLEAR_TUNING_DEFAULT
  const clears = stagesClearedInZone(game, stages, numericArea, previous.id)
  return {
    unlocked: clears >= required,
    clears,
    required,
    remaining: Math.max(0, required - clears),
    previousZoneName: previous.name,
    reason: clears >= required ? null : 'ROUTE_PROGRESS'
  }
}

export function worldStageAvailability(game, stage, stages, { exUnlocked = null } = {}) {
  if (!stage || stage.hidden) return { unlocked: false, reason: 'HIDDEN_STAGE' }
  const area = positiveInt(stage.adventureArea || stage.area)
  if (!isAdventureAreaUnlocked(game, area, { exUnlocked })) return { unlocked: false, reason: 'AREA_LOCKED' }

  if (stage.zoneId) {
    const zone = adventureZoneProgress(game, stages, area, stage.zoneId, { exUnlocked })
    if (!zone.unlocked) return { unlocked: false, reason: zone.reason || 'ZONE_LOCKED', zone }
  }
  if (stage.requiresEvolutionDiscoverySpeciesId && !game?.evolutionDiscoveries?.[stage.requiresEvolutionDiscoverySpeciesId]) {
    return { unlocked: false, reason: 'EVOLUTION_DISCOVERY_REQUIRED' }
  }
  if (stage.kind === 'boss' && area <= 4) {
    const eligibility = areaBossEligibility(game, area)
    if (!eligibility.eligible) return { unlocked: false, reason: 'BOSS_LEARNING_PROGRESS_REQUIRED', eligibility }
  }
  return { unlocked: true, reason: null }
}

export function persistedAdventureLocation(game) {
  const area = positiveInt(game?.adventureLocation?.area)
  const meta = WORLD_AREA_META.find((entry) => entry.area === area)
  const zoneId = String(game?.adventureLocation?.zoneId || '')
  if (!meta || !meta.zones.some((zone) => zone.id === zoneId)) return null
  return { area, zoneId }
}

export function setAdventureLocation(game, location, stages, { exUnlocked = null } = {}) {
  const area = positiveInt(location?.area)
  const zoneId = String(location?.zoneId || '')
  const progress = adventureZoneProgress(game, stages, area, zoneId, { exUnlocked })
  if (!progress.unlocked) return { ok: false, game, reason: progress.reason || 'LOCATION_LOCKED' }
  const next = structuredClone(game || {})
  next.adventureLocation = { area, zoneId }
  return { ok: true, game: next, location: next.adventureLocation }
}

export function clampEnemyLevelToWorldBand(stage, candidateLevel) {
  const min = Math.max(1, positiveInt(stage?.minEnemyLevel) || 1)
  const max = Math.max(min, positiveInt(stage?.maxEnemyLevel) || min)
  return Math.max(min, Math.min(max, Math.max(1, positiveInt(candidateLevel) || min)))
}

function encounterHash(stageId, day) {
  let hash = 2166136261
  const text = `${day}:${stageId}`
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function pickDailyEncounterStages(stages, {
  day = 0,
  limit = 5,
  isUnlocked = () => true,
  isCaught = () => false,
  isCleared = () => false,
  priority = () => 0
} = {}) {
  return [...(stages || [])]
    .sort((a, b) => {
      const unlocked = Number(!isUnlocked(a)) - Number(!isUnlocked(b))
      if (unlocked) return unlocked
      const priorityDiff = Number(priority(a) || 0) - Number(priority(b) || 0)
      if (priorityDiff) return priorityDiff
      const uncaught = Number(isCaught(a)) - Number(isCaught(b))
      if (uncaught) return uncaught
      const uncleared = Number(isCleared(a)) - Number(isCleared(b))
      if (uncleared) return uncleared
      return encounterHash(a.id, day) - encounterHash(b.id, day)
    })
    .slice(0, Math.max(1, Number(limit) || 5))
}
