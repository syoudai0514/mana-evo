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

function numberOf(species) {
  const parsed = Number.parseInt(String(species?.no || '').replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function adventureAreaForStage(stage, species) {
  if (['event', 'ex'].includes(stage?.kind) || Number(stage?.area) > 4) return 5
  const sourceArea = Math.max(1, Number(stage?.area) || 1)
  const formStage = Math.max(1, Number(species?.stage) || 1)
  const isFinalEvolution = formStage > 1 && !species?.evolution
  // 当初方針: エリア1/2の通常野生は進化前中心。
  // A1系列の第2形態はA3奥地、A2系列の第2形態はA4奥地へ送る。
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
  return earlyZones[numberOf(species) % earlyZones.length]
}

export function enrichStage(stage, species) {
  if (!stage || stage.legacy) return stage
  const meta = metaForStage(stage, species)
  const zone = zoneForStage(meta, stage, species)
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
    minEnemyLevel: zone.minLevel,
    maxEnemyLevel: zone.maxLevel,
    levelLabel: `Lv.${zone.minLevel}〜${zone.maxLevel}`,
    firstAcquireByEvolution: isFirstEvolvedForm,
    advancedEvolutionWild: isFirstEvolvedForm
  }

  // 冒険エリアの解放条件は、制作上のareaではなく実際の配置先で決める。
  if (stage.kind === 'wild' && meta.area !== Number(stage.area) && meta.area > 1 && meta.area <= 4) next.areaGateBossId = `a${meta.area - 1}-boss`

  // 第2形態の初回入手は自力進化。進化後に dex.caught が立つので奥地野生が解禁される。
  if (isFirstEvolvedForm) next.requiresOwnedSpeciesId = species.id

  // 最終進化形は通常野生では出さない。単段階種(stage=1)は例外。
  if (stage.kind === 'wild' && isFinalEvolution) {
    next.hidden = true
    next.captureDisabled = true
    next.finalEvolutionOnly = true
  }

  // ストーリー進行を大量収集チェックから切り離す。
  if (stage.kind === 'boss' && meta.area <= 4) next.minAreaClears = 5
  return next
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
  isCleared = () => false
} = {}) {
  return [...(stages || [])]
    .sort((a, b) => {
      const unlocked = Number(!isUnlocked(a)) - Number(!isUnlocked(b))
      if (unlocked) return unlocked
      const uncaught = Number(isCaught(a)) - Number(isCaught(b))
      if (uncaught) return uncaught
      const uncleared = Number(isCleared(a)) - Number(isCleared(b))
      if (uncleared) return uncleared
      return encounterHash(a.id, day) - encounterHash(b.id, day)
    })
    .slice(0, Math.max(1, Number(limit) || 5))
}
