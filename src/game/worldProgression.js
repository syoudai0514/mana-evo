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

function metaForStage(stage) {
  if (['event', 'ex'].includes(stage?.kind) || Number(stage?.area) > 4) return WORLD_AREA_META[4]
  return WORLD_AREA_META.find((meta) => meta.area === Number(stage?.area)) || WORLD_AREA_META[0]
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
  const meta = metaForStage(stage)
  const zone = zoneForStage(meta, stage, species)
  const formStage = Math.max(1, Number(species?.stage) || 1)
  const isFinalEvolution = formStage > 1 && !species?.evolution
  const isEvolvedWild = stage.kind === 'wild' && formStage >= 2
  const isFirstEvolvedForm = isEvolvedWild && !isFinalEvolution
  const next = {
    ...stage,
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
