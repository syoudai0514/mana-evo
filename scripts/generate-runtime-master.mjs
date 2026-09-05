import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DESIGN = path.join(ROOT, 'design')
const OUT = path.join(ROOT, 'src', 'game', 'runtimeMaster.generated.js')

const GROWTH_FILES = [
  '13a-monster-growth-area1.csv',
  '13b-monster-growth-area2-part1.csv',
  '13b-monster-growth-area2-part2.csv',
  '13c-monster-growth-area3-part1.csv',
  '13c-monster-growth-area3-part2.csv',
  '13d-monster-growth-area4-part1.csv',
  '13d-monster-growth-area4-part2.csv'
]
const EVOLUTION_FILES = [
  '14a-evolution-balance-area1.csv',
  '14b-evolution-balance-area2.csv',
  '14c-evolution-balance-area3.csv',
  '14d-evolution-balance-area4.csv'
]
const ACQUISITION_FILE = '14e-evolution-item-acquisition-master.csv'

function parseCsv(text) {
  const input = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i += 1 }
      else if (ch === '"') quoted = false
      else field += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
    else field += ch
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row) }
  const [header, ...body] = rows.filter((r) => r.some((value) => value !== ''))
  return body.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ''])))
}

function loadCsv(name) {
  return parseCsv(fs.readFileSync(path.join(DESIGN, name), 'utf8'))
}

const bool = (value) => String(value).toLowerCase() === 'true'
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const no3 = (value) => String(value).padStart(3, '0')

const growth = GROWTH_FILES.flatMap(loadCsv).sort((a, b) => num(a.No) - num(b.No))
const evolutions = EVOLUTION_FILES.flatMap(loadCsv)
const growthByNo = new Map(growth.map((row) => [String(num(row.No)), row]))
const acquisitions = loadCsv(ACQUISITION_FILE).map((row) => ({
  ...row,
  fromId: growthByNo.get(String(num(row.fromNo)))?.id,
  toId: growthByNo.get(String(num(row.toNo)))?.id
}))

if (growth.length !== 238) throw new Error(`Expected 238 monsters, got ${growth.length}`)
if (new Set(growth.map((row) => row.id)).size !== 238) throw new Error('Monster IDs are not unique')
if (evolutions.length !== 155) throw new Error(`Expected 155 evolutions, got ${evolutions.length}`)
if (acquisitions.length !== 32) throw new Error(`Expected 32 item acquisitions, got ${acquisitions.length}`)
if (acquisitions.some((row) => !row.fromId || !row.toId)) throw new Error('Acquisition row has unresolved from/to monster number')

const evolutionByFrom = new Map(evolutions.map((row) => [row.fromId, row]))

const ITEM_NAMES = {
  thunder: 'かみなりのいし', water: 'みずのいし', leaf: 'はっぱのいし', moon: 'つきのいし',
  fire: 'ほのおのいし', ancient: 'いにしえのいし', dusk: 'たそがれのいし', ice: 'こおりのいし',
  emberwick: 'ほのおのしん', sunscale: 'たいようのうろこ', steelplate: 'はがねのプレート',
  windband: 'かぜのバンド', frostgem: 'こおりのほうせき', barkarmor: 'きのよろい',
  nightfeather: 'よるのはね', skyplume: 'そらのはね', dragonfang: 'りゅうのキバ', corepart: 'コアパーツ'
}

const TYPE_MOVE_NAMES = {
  normal: ['たいあたり', 'スピードスター', 'パワーラッシュ', 'ブレイブフィニッシュ'],
  fire: ['ひのこ', 'フレアショット', 'ブレイズラッシュ', 'インフェルノ'],
  water: ['みずでっぽう', 'バブルショット', 'アクアラッシュ', 'タイダルウェーブ'],
  electric: ['でんきショック', 'ボルトショット', 'サンダーラッシュ', 'ライトニング'],
  grass: ['はっぱカッター', 'リーフショット', 'フォレストラッシュ', 'グランドブルーム'],
  ice: ['こおりのつぶて', 'アイスショット', 'フロストラッシュ', 'ブリザード'],
  fighting: ['パンチ', 'きあいづき', 'ファイトラッシュ', 'メガトンブロー'],
  poison: ['どくばり', 'ポイズンショット', 'ベノムラッシュ', 'デッドリーミスト'],
  ground: ['すなかけ', 'マッドショット', 'アースラッシュ', 'グランドクエイク'],
  flying: ['かぜおこし', 'ウイングショット', 'スカイラッシュ', 'テンペスト'],
  psychic: ['ねんりき', 'サイコショット', 'マインドラッシュ', 'サイコノヴァ'],
  bug: ['むしくい', 'ニードルショット', 'バグラッシュ', 'インセクトストーム'],
  rock: ['いわおとし', 'ロックショット', 'ストーンラッシュ', 'メテオロック'],
  ghost: ['したでなめる', 'ゴーストショット', 'シャドウラッシュ', 'ファントムナイト'],
  dragon: ['りゅうのいぶき', 'ドラゴンショット', 'ドラゴンラッシュ', 'ドラゴンノヴァ'],
  dark: ['かみつく', 'ダークショット', 'ナイトラッシュ', 'ブラックアウト'],
  steel: ['メタルクロー', 'スチールショット', 'メタルラッシュ', 'アイアンインパクト'],
  fairy: ['ようせいのかぜ', 'フェアリーショット', 'ミラクルラッシュ', 'スターライト']
}
const TYPE_IDS = Object.keys(TYPE_MOVE_NAMES)
const COVERAGE = Object.fromEntries(TYPE_IDS.map((type, index) => [type, TYPE_IDS[(index + 7) % TYPE_IDS.length]]))
const HEAL_IDS = new Set(['m041','m042','m049','m050','m051','m098','m099','m115','m116','m175','m176','m177','m208','m209','m210','m235'])
const IDENTITY_MOVE_NAMES = { m181: 'きずなリンク', m182: 'こころリレー' }

const moves = {}
const species = {}

function addMove(move) {
  moves[move.id] = { moveId: move.id, ...move }
  return move.id
}

for (const row of growth) {
  const id = row.id
  const stage = num(row.stage, 1)
  const type = row.typeId || 'normal'
  const names = TYPE_MOVE_NAMES[type] || TYPE_MOVE_NAMES.normal
  const stableId = addMove({ id: `${id}-stable`, name: names[0], type, power: 40 + (stage - 1) * 10, accuracy: 100, effect: { type: 'damage' }, role: 'stable' })
  let coverageId
  if (HEAL_IDS.has(id)) {
    coverageId = addMove({ id: `${id}-heal`, name: `${row.name}の いやし`, type, power: 0, accuracy: 100, effect: { type: 'heal', healRatio: 0.20, usesPerBattle: 1 }, role: 'heal' })
  } else {
    const coverageType = COVERAGE[type] || 'normal'
    const coverageName = (TYPE_MOVE_NAMES[coverageType] || TYPE_MOVE_NAMES.normal)[1]
    coverageId = addMove({ id: `${id}-coverage`, name: coverageName, type: coverageType, power: 60, accuracy: 100, effect: { type: 'damage' }, role: 'coverage' })
  }
  const strongId = addMove({ id: `${id}-strong`, name: names[2], type, power: 80, accuracy: 95, effect: { type: 'damage' }, role: 'strong' })
  const finisherId = addMove({ id: `${id}-finisher`, name: IDENTITY_MOVE_NAMES[id] || names[3], type, power: 100, accuracy: 90, effect: { type: 'damage' }, role: IDENTITY_MOVE_NAMES[id] ? 'identity' : 'finisher' })
  let burstMoveId = null
  if (bool(row.burstEligible)) {
    burstMoveId = addMove({ id: `${id}-burst`, name: `${row.name}の キョダイわざ`, type, power: 110, accuracy: 95, effect: { type: 'damage' }, role: 'burst' })
  }

  const evo = evolutionByFrom.get(id)
  let evolution = null
  if (evo) {
    if (evo.method === 'level') evolution = { to: evo.toId, method: 'level', level: num(evo.param, 1) }
    else if (evo.method === 'stone') evolution = { to: evo.toId, method: 'stone', itemId: evo.param }
    else if (evo.method === 'held_item_levelup') evolution = { to: evo.toId, method: 'held_item_levelup', heldItemId: evo.param }
    else throw new Error(`Unknown evolution method: ${evo.method}`)
  }

  species[id] = {
    id,
    no: no3(row.No),
    familyNo: row.familyNo,
    family: row.family,
    name: row.name,
    area: num(row.area, 1),
    areaName: row.areaName,
    stage,
    maxStage: num(row.maxStage, stage),
    types: [type],
    typeLabel: row.type,
    base: { hp: num(row.baseHP, 1), attack: num(row.baseAttack, 1), defense: num(row.baseDefense, 1), speed: num(row.baseSpeed, 1) },
    bst: num(row.BST),
    catchRarity: row.catchRarity,
    powerTierV1: row.powerTierV1,
    sourceRole: row.sourceRole,
    combatRoleV2: row.combatRoleV2,
    catchRank: num(row.catchRank, 1),
    wildCatchable: bool(row.wildCatchable),
    encounterPool: row.encounterPool,
    capturePolicy: row.capturePolicy,
    moveProfile: row.moveProfile,
    gigaEligible: bool(row.gigaEligible),
    burstEligible: bool(row.burstEligible),
    burstMoveId,
    motif: row.motif,
    concept: row.concept,
    description: row.description,
    moves: [stableId, coverageId, strongId, finisherId],
    evolution,
    officialImageUrl: `/monsters/${id}.webp`
  }
}

// World-progression overlay: the original CSV level thresholds were authored before
// the current zone Lv bands. Keep those values as baselines, then raise only level
// evolutions that would otherwise be ready immediately after a normal wild capture.
const EARLY_ZONE_MAX = { 1: [10, 16], 2: [24, 31], 3: [40, 49], 4: [60, 70] }
const FINAL_STAGE_FLOOR = { 1: 30, 2: 38, 3: 52, 4: 72 }
const families = new Map()
for (const monster of Object.values(species)) {
  if (!families.has(monster.familyNo)) families.set(monster.familyNo, [])
  families.get(monster.familyNo).push(monster)
}
for (const family of families.values()) {
  family.sort((a, b) => a.stage - b.stage)
  for (let index = 0; index < family.length; index += 1) {
    const monster = family[index]
    const evo = monster.evolution
    if (!evo || evo.method !== 'level') continue
    const originalLevel = evo.level
    if (monster.stage === 1) {
      const zoneMaxes = EARLY_ZONE_MAX[monster.area] || [10, 16]
      const zoneIndex = (Math.max(1, Number(monster.no)) - 1) % Math.min(2, zoneMaxes.length)
      evo.level = Math.max(originalLevel, zoneMaxes[zoneIndex] + 4)
    } else {
      const previous = family[index - 1]
      const previousAcquireLevel = previous?.evolution?.method === 'level'
        ? previous.evolution.level
        : Math.max(...(EARLY_ZONE_MAX[monster.area] || [10])) + 4
      evo.level = Math.max(originalLevel, FINAL_STAGE_FLOOR[monster.area] || originalLevel, previousAcquireLevel + 10)
    }
    evo.originalLevel = originalLevel
    evo.worldAdjusted = evo.level !== originalLevel
  }
}

const evolutionItems = { stones: {}, heldItems: {} }
for (const row of acquisitions) {
  const bucket = row.method === 'stone' ? evolutionItems.stones : evolutionItems.heldItems
  bucket[row.itemId] ||= { id: row.itemId, name: ITEM_NAMES[row.itemId] || `${row.itemId}のアイテム` }
}

const stages = []
const wildByArea = new Map()
for (const row of growth) {
  if (!bool(row.wildCatchable)) continue
  const area = num(row.area, 1)
  if (!wildByArea.has(area)) wildByArea.set(area, [])
  wildByArea.get(area).push(row)
}

const areaBossIds = { 1: 'a1-boss', 2: 'a2-boss', 3: 'a3-boss', 4: 'a4-boss' }
const bossRanks = { 1: 'C', 2: 'B', 3: 'A', 4: 'S' }

function difficultyForRank(rank) {
  return rank <= 1 ? 'weak' : rank === 2 ? 'normal' : rank === 3 ? 'strong' : rank === 4 ? 'rare' : 'elite'
}

for (let area = 1; area <= 4; area += 1) {
  const areaWild = wildByArea.get(area) || []
  for (const row of areaWild) {
    const rank = num(row.catchRank, 1)
    stages.push({
      id: `a${area}-wild-${no3(row.No)}`,
      kind: 'wild',
      area,
      areaName: row.areaName,
      label: `No.${no3(row.No)} ${row.name}`,
      enemySpeciesId: row.id,
      enemyDifficulty: difficultyForRank(rank),
      enemyLevel: 5,
      mana: 8 + area * 4 + rank * 2,
      areaGateBossId: area > 1 ? areaBossIds[area - 1] : null
    })
  }

  // D-031: zone ③ stays meaningful without exposing evolved-form acquisition.
  // Re-use only first-form species as stronger deep-route rematches. They remain
  // normal wild clears/captures, while evolved forms are handled by training below.
  for (const row of growth.filter((entry) => num(entry.area) === area && num(entry.stage) === 1 && bool(entry.wildCatchable))) {
    const rank = num(row.catchRank, 1)
    stages.push({
      id: `a${area}-deep-${no3(row.No)}`,
      kind: 'wild',
      area,
      areaName: row.areaName,
      label: `つよい No.${no3(row.No)} ${row.name}`,
      enemySpeciesId: row.id,
      enemyDifficulty: difficultyForRank(rank),
      enemyLevel: 5,
      mana: 12 + area * 5 + rank * 2,
      zoneHint: 'deep',
      deepRematch: true,
      areaGateBossId: area > 1 ? areaBossIds[area - 1] : null
    })
  }

  const finals = growth.filter((row) => num(row.area) === area && num(row.stage) === num(row.maxStage))
  const boss = finals.sort((a, b) => num(b.BST) - num(a.BST))[0]
  if (!boss) throw new Error(`Missing boss candidate for area ${area}`)
  stages.push({
    id: areaBossIds[area],
    kind: 'boss',
    area,
    areaName: boss.areaName,
    label: `エリア${area} ボス・${boss.name}`,
    enemySpeciesId: boss.id,
    enemyDifficulty: 'elite',
    bossId: `area-${area}-boss-${boss.id}`,
    bossRank: bossRanks[area],
    enemyLevel: 10 + area * 8,
    mana: 60 + area * 30,
    minAreaClears: Math.max(5, Math.ceil(areaWild.length * 0.5)),
    areaGateBossId: area > 1 ? areaBossIds[area - 1] : null,
    captureDisabled: true
  })
}

// D-031: every self-obtained evolved form gets its own non-capture training battle.
// These stages are intentionally separate from kind=wild so they cannot unlock
// route zones and cannot replace the requirement to explore normal encounters.
for (const monster of Object.values(species).filter((entry) => Number(entry.stage) >= 2)) {
  stages.push({
    id: `a${monster.area}-training-${monster.no}`,
    kind: 'training',
    area: monster.area,
    areaName: monster.areaName,
    label: `${monster.name}の シンカしゅぎょう`,
    enemySpeciesId: monster.id,
    enemyDifficulty: monster.evolution ? 'strong' : 'rare',
    enemyLevel: 5,
    mana: 10 + monster.area * 4,
    zoneHint: 'deep',
    trainingEvolutionStage: monster.stage,
    requiresEvolutionDiscoverySpeciesId: monster.id,
    areaGateBossId: monster.area > 1 ? areaBossIds[monster.area - 1] : null,
    captureDisabled: true
  })
}

for (const row of acquisitions) {
  const from = species[row.fromId]
  if (!from) throw new Error(`Unknown acquisition source ${row.fromId}`)
  const area = num(row.area, from.area)
  const areaWildCount = (wildByArea.get(area) || []).length
  const milestoneRatio = row.unlockMilestone === 'evo-a1' ? 0.50 : 0.35
  stages.push({
    id: `evo-${no3(row.fromNo)}-${no3(row.toNo)}`,
    kind: 'evolution-trial',
    area,
    areaName: from.areaName,
    label: `${from.name}の シンカしれん`,
    enemySpeciesId: row.fromId,
    enemyDifficulty: 'strong',
    enemyLevel: 12 + from.area * 7,
    mana: 35 + from.area * 5,
    requiresOwnedSpeciesId: row.fromId,
    minAreaClears: Math.max(1, Math.ceil(areaWildCount * milestoneRatio)),
    areaGateBossId: from.area > 1 ? areaBossIds[from.area - 1] : null,
    captureDisabled: true,
    evolutionReward: { kind: row.method === 'stone' ? 'stone' : 'held', itemId: row.itemId, count: num(row.grantCount, 1) }
  })
}

for (const monster of Object.values(species)) {
  if (monster.gigaEligible) {
    stages.push({
      id: `giga-${monster.no}`,
      kind: 'giga-challenge', area: monster.area, areaName: monster.areaName,
      label: `${monster.name}の ギガしれん`, enemySpeciesId: monster.id, enemyDifficulty: 'elite',
      bossId: `giga-${monster.id}`, bossRank: 'A', enemyLevel: 45, mana: 100,
      requiresOwnedSpeciesId: monster.id, areaGateBossId: areaBossIds[monster.area], captureDisabled: true,
      specialReward: { type: 'giga', speciesId: monster.id }
    })
  }
  if (monster.burstEligible) {
    stages.push({
      id: `burst-${monster.no}`,
      kind: 'burst-challenge', area: monster.area, areaName: monster.areaName,
      label: `${monster.name}の バーストしれん`, enemySpeciesId: monster.id, enemyDifficulty: 'elite',
      bossId: `burst-${monster.id}`, bossRank: 'A', enemyLevel: 48, mana: 110,
      requiresOwnedSpeciesId: monster.id, areaGateBossId: areaBossIds[monster.area], captureDisabled: true,
      specialReward: { type: 'burst', speciesId: monster.id }
    })
  }
}

for (const monster of Object.values(species).filter((entry) => entry.encounterPool === 'event')) {
  stages.push({
    id: `event-${monster.no}`, kind: 'event', area: monster.area, areaName: monster.areaName,
    label: `スペシャル・${monster.name}`, enemySpeciesId: monster.id, enemyDifficulty: 'elite', enemyLevel: 55,
    mana: 120, requiresAllAreasCleared: true
  })
}

stages.push({
  id: 'all-area-ex', kind: 'ex', area: 5, areaName: 'さいごの しれん', label: 'ぜんエリア EXしれん',
  enemySpeciesId: 'm238', enemyDifficulty: 'elite', bossId: 'all-area-ex', bossRank: 'EX', enemyLevel: 65,
  mana: 200, requiresAllAreasCleared: true, captureDisabled: true, specialReward: { type: 'rainbow', count: 1 }
})

const runtime = {
  generatedAt: new Date().toISOString(),
  speciesCount: Object.keys(species).length,
  moveCount: Object.keys(moves).length,
  stageCount: stages.length,
  evolutionCount: evolutions.length,
  itemTrialCount: acquisitions.length
}

const output = `// AUTO-GENERATED by scripts/generate-runtime-master.mjs. DO NOT EDIT.\n` +
  `export const RUNTIME_META = ${JSON.stringify(runtime, null, 2)}\n\n` +
  `export const RUNTIME_MOVES = ${JSON.stringify(moves, null, 2)}\n\n` +
  `export const RUNTIME_SPECIES = ${JSON.stringify(species, null, 2)}\n\n` +
  `export const RUNTIME_EVOLUTION_ITEMS = ${JSON.stringify(evolutionItems, null, 2)}\n\n` +
  `export const RUNTIME_STAGES = ${JSON.stringify(stages, null, 2)}\n`

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, output)
console.log(`Generated ${runtime.speciesCount} species / ${runtime.moveCount} moves / ${runtime.stageCount} stages -> ${path.relative(ROOT, OUT)}`)