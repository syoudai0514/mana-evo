import {
  RUNTIME_EVOLUTION_ITEMS,
  RUNTIME_META as GENERATED_RUNTIME_META,
  RUNTIME_MOVES,
  RUNTIME_SPECIES,
  RUNTIME_STAGES as GENERATED_RUNTIME_STAGES
} from './runtimeMaster.generated.js'
import { WORLD_AREA_META, enrichStage, pickDailyEncounterStages } from './worldProgression.js'

export const TYPES = [
  ['normal', 'ノーマル', '◯'], ['fire', 'ほのお', '🔥'], ['water', 'みず', '💧'], ['electric', 'でんき', '⚡'],
  ['grass', 'くさ', '🌿'], ['ice', 'こおり', '❄️'], ['fighting', 'かくとう', '✊'], ['poison', 'どく', '☠️'],
  ['ground', 'じめん', '⛰️'], ['flying', 'ひこう', '🪽'], ['psychic', 'エスパー', '🔮'], ['bug', 'むし', '🐞'],
  ['rock', 'いわ', '🪨'], ['ghost', 'ゴースト', '👻'], ['dragon', 'ドラゴン', '🐉'], ['dark', 'あく', '🌑'],
  ['steel', 'はがね', '⚙️'], ['fairy', 'フェアリー', '✨']
].map(([id, label, icon]) => ({ id, label, icon }))

export const TYPE_META = Object.fromEntries(TYPES.map((type) => [type.id, type]))

const SUPER = {
  fire: ['grass', 'ice', 'bug', 'steel'], water: ['fire', 'ground', 'rock'], electric: ['water', 'flying'],
  grass: ['water', 'ground', 'rock'], ice: ['grass', 'ground', 'flying', 'dragon'], fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
  poison: ['grass', 'fairy'], ground: ['fire', 'electric', 'poison', 'rock', 'steel'], flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'poison'], bug: ['grass', 'psychic', 'dark'], rock: ['fire', 'ice', 'flying', 'bug'],
  ghost: ['psychic', 'ghost'], dragon: ['dragon'], dark: ['psychic', 'ghost'], steel: ['ice', 'rock', 'fairy'], fairy: ['fighting', 'dragon', 'dark']
}
const RESIST = {
  normal: ['rock', 'steel'], fire: ['fire', 'water', 'rock', 'dragon'], water: ['water', 'grass', 'dragon'],
  electric: ['electric', 'grass', 'dragon'], grass: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
  ice: ['fire', 'water', 'ice', 'steel'], fighting: ['poison', 'flying', 'psychic', 'bug', 'fairy'], poison: ['poison', 'ground', 'rock', 'ghost'],
  ground: ['grass', 'bug'], flying: ['electric', 'rock', 'steel'], psychic: ['psychic', 'steel'], bug: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
  rock: ['fighting', 'ground', 'steel'], ghost: ['dark'], dragon: ['steel'], dark: ['fighting', 'dark', 'fairy'],
  steel: ['fire', 'water', 'electric', 'steel'], fairy: ['fire', 'poison', 'steel']
}
const IMMUNE = { normal: ['ghost'], electric: ['ground'], fighting: ['ghost'], poison: ['steel'], ground: ['flying'], psychic: ['dark'], ghost: ['normal'], dragon: ['fairy'] }

export function typeEffectiveness(attackType, defenderTypes = []) {
  return defenderTypes.reduce((factor, defender) => {
    if (IMMUNE[attackType]?.includes(defender)) return factor * 0
    if (SUPER[attackType]?.includes(defender)) return factor * 2
    if (RESIST[attackType]?.includes(defender)) return factor * 0.5
    return factor
  }, 1)
}

export function effectivenessLabel(factor) {
  if (factor === 0) return '× きかない'
  if (factor >= 2) return '◎ ばつぐん'
  if (factor < 1) return '△ いまひとつ'
  return '○ ふつう'
}

export const CAPTURE_CONFIG = Object.freeze({
  star: { label: 'ほしのわ', icon: '⭐', multiplier: 1.0, guaranteed: false },
  silver: { label: 'ぎんのわ', icon: '⚪', multiplier: 1.2, guaranteed: false },
  gold: { label: 'きんのわ', icon: '🟡', multiplier: 1.5, guaranteed: false },
  rainbow: { label: 'にじのわ', icon: '🌈', multiplier: 1.0, guaranteed: true },
  nonRainbowCap: 0.92
})

const damageEffect = Object.freeze({ type: 'damage' })
const LEGACY_MOVES = {
  tackle: { id: 'tackle', moveId: 'tackle', name: 'たいあたり', type: 'normal', power: 35, accuracy: 100, effect: damageEffect, role: 'stable' },
  ember: { id: 'ember', moveId: 'ember', name: 'ひのこ', type: 'fire', power: 42, accuracy: 100, effect: damageEffect, role: 'stable' },
  flameRush: { id: 'flameRush', moveId: 'flameRush', name: 'ほのおラッシュ', type: 'fire', power: 58, accuracy: 100, effect: damageEffect, role: 'strong' },
  leafShot: { id: 'leafShot', moveId: 'leafShot', name: 'リーフショット', type: 'grass', power: 42, accuracy: 100, effect: damageEffect, role: 'stable' },
  vineHit: { id: 'vineHit', moveId: 'vineHit', name: 'つるアタック', type: 'grass', power: 55, accuracy: 100, effect: damageEffect, role: 'strong' },
  waterShot: { id: 'waterShot', moveId: 'waterShot', name: 'みずショット', type: 'water', power: 42, accuracy: 100, effect: damageEffect, role: 'stable' },
  aquaRush: { id: 'aquaRush', moveId: 'aquaRush', name: 'アクアラッシュ', type: 'water', power: 58, accuracy: 100, effect: damageEffect, role: 'strong' },
  spark: { id: 'spark', moveId: 'spark', name: 'スパーク', type: 'electric', power: 45, accuracy: 100, effect: damageEffect, role: 'stable' },
  thunderDash: { id: 'thunderDash', moveId: 'thunderDash', name: 'いなずまダッシュ', type: 'electric', power: 60, accuracy: 100, effect: damageEffect, role: 'strong' },
  bugBite: { id: 'bugBite', moveId: 'bugBite', name: 'むしバイト', type: 'bug', power: 40, accuracy: 100, effect: damageEffect, role: 'coverage' },
  gust: { id: 'gust', moveId: 'gust', name: 'かぜおこし', type: 'flying', power: 40, accuracy: 100, effect: damageEffect, role: 'coverage' },
  rockHit: { id: 'rockHit', moveId: 'rockHit', name: 'いわアタック', type: 'rock', power: 45, accuracy: 100, effect: damageEffect, role: 'coverage' }
}

const LEGACY_SPECIES = {
  'starter-fire-1': { id: 'starter-fire-1', family: 'starter-fire', stage: 1, name: 'ヒノポ（旧セーブ）', types: ['fire'], base: { hp: 48, attack: 25, defense: 20, speed: 24 }, moves: ['tackle', 'ember', 'flameRush', 'rockHit'], evolution: { to: 'starter-fire-2', method: 'level', level: 8 }, catchRank: 0 },
  'starter-fire-2': { id: 'starter-fire-2', family: 'starter-fire', stage: 2, name: 'メラガミ（旧セーブ）', types: ['fire'], base: { hp: 62, attack: 34, defense: 27, speed: 31 }, moves: ['tackle', 'ember', 'flameRush', 'rockHit'], evolution: { to: 'starter-fire-3', method: 'level', level: 14 }, catchRank: 0 },
  'starter-fire-3': { id: 'starter-fire-3', family: 'starter-fire', stage: 3, name: 'グレンドウ（旧セーブ）', types: ['fire'], base: { hp: 82, attack: 45, defense: 36, speed: 40 }, moves: ['tackle', 'ember', 'flameRush', 'rockHit'], catchRank: 0, gigaEligible: true },
  'wild-grass-1': { id: 'wild-grass-1', family: 'wild-grass', stage: 1, name: 'モコハ（旧）', types: ['grass'], base: { hp: 42, attack: 20, defense: 23, speed: 18 }, moves: ['tackle', 'leafShot', 'vineHit', 'bugBite'], evolution: { to: 'wild-grass-2', method: 'level', level: 10 }, catchRank: 1 },
  'wild-grass-2': { id: 'wild-grass-2', family: 'wild-grass', stage: 2, name: 'ワカバネ（旧）', types: ['grass'], base: { hp: 57, attack: 29, defense: 32, speed: 24 }, moves: ['tackle', 'leafShot', 'vineHit', 'bugBite'], evolution: { to: 'wild-grass-3', method: 'level', level: 18 }, catchRank: 2 },
  'wild-grass-3': { id: 'wild-grass-3', family: 'wild-grass', stage: 3, name: 'ジュランガ（旧）', types: ['grass'], base: { hp: 78, attack: 39, defense: 43, speed: 31 }, moves: ['tackle', 'leafShot', 'vineHit', 'bugBite'], catchRank: 3 },
  'wild-water-1': { id: 'wild-water-1', family: 'wild-water', stage: 1, name: 'シズク（旧）', types: ['water'], base: { hp: 44, attack: 21, defense: 21, speed: 21 }, moves: ['tackle', 'waterShot', 'aquaRush', 'gust'], evolution: { to: 'wild-water-2', method: 'level', level: 10 }, catchRank: 1 },
  'wild-water-2': { id: 'wild-water-2', family: 'wild-water', stage: 2, name: 'ミナモリ（旧）', types: ['water'], base: { hp: 59, attack: 30, defense: 29, speed: 29 }, moves: ['tackle', 'waterShot', 'aquaRush', 'gust'], evolution: { to: 'wild-water-3', method: 'level', level: 18 }, catchRank: 2 },
  'wild-water-3': { id: 'wild-water-3', family: 'wild-water', stage: 3, name: 'ワダツラ（旧）', types: ['water'], base: { hp: 80, attack: 40, defense: 39, speed: 39 }, moves: ['tackle', 'waterShot', 'aquaRush', 'gust'], catchRank: 3 },
  'wild-electric-1': { id: 'wild-electric-1', family: 'wild-electric', stage: 1, name: 'パチネ（旧）', types: ['electric'], base: { hp: 40, attack: 22, defense: 18, speed: 28 }, moves: ['tackle', 'spark', 'thunderDash', 'gust'], evolution: { to: 'wild-electric-2', method: 'level', level: 9 }, catchRank: 1 },
  'wild-electric-2': { id: 'wild-electric-2', family: 'wild-electric', stage: 2, name: 'ビリスケ（旧）', types: ['electric'], base: { hp: 54, attack: 31, defense: 25, speed: 38 }, moves: ['tackle', 'spark', 'thunderDash', 'gust'], evolution: { to: 'wild-electric-3', method: 'level', level: 17 }, catchRank: 2 },
  'wild-electric-3': { id: 'wild-electric-3', family: 'wild-electric', stage: 3, name: 'ライガミ（旧）', types: ['electric'], base: { hp: 73, attack: 42, defense: 33, speed: 50 }, moves: ['tackle', 'spark', 'thunderDash', 'gust'], catchRank: 3 },
  'wild-bug-1': { id: 'wild-bug-1', family: 'wild-bug', stage: 1, name: 'チクリン（旧）', types: ['bug'], base: { hp: 36, attack: 18, defense: 18, speed: 24 }, moves: ['tackle', 'bugBite', 'leafShot', 'gust'], evolution: { to: 'wild-bug-2', method: 'level', level: 7 }, catchRank: 1 },
  'wild-bug-2': { id: 'wild-bug-2', family: 'wild-bug', stage: 2, name: 'ハリバチ（旧）', types: ['bug', 'flying'], base: { hp: 47, attack: 25, defense: 22, speed: 34 }, moves: ['tackle', 'bugBite', 'gust', 'leafShot'], evolution: { to: 'wild-bug-3', method: 'level', level: 12 }, catchRank: 2 },
  'wild-bug-3': { id: 'wild-bug-3', family: 'wild-bug', stage: 3, name: 'クイーンザ（旧）', types: ['bug', 'flying'], base: { hp: 62, attack: 34, defense: 29, speed: 45 }, moves: ['tackle', 'bugBite', 'gust', 'leafShot'], catchRank: 3 },
  'wild-stone-1': { id: 'wild-stone-1', family: 'wild-stone', stage: 1, name: 'いし進化（旧）', types: ['rock'], base: { hp: 48, attack: 27, defense: 32, speed: 14 }, moves: ['tackle', 'rockHit', 'gust', 'bugBite'], evolution: { to: 'wild-stone-2', method: 'stone', itemId: 'glow-stone' }, catchRank: 2 },
  'wild-stone-2': { id: 'wild-stone-2', family: 'wild-stone', stage: 2, name: 'いし進化形（旧）', types: ['rock', 'fairy'], base: { hp: 72, attack: 39, defense: 47, speed: 23 }, moves: ['tackle', 'rockHit', 'gust', 'leafShot'], catchRank: 3 },
  'wild-charm-1': { id: 'wild-charm-1', family: 'wild-charm', stage: 1, name: 'もちもの進化（旧）', types: ['ghost'], base: { hp: 43, attack: 24, defense: 21, speed: 30 }, moves: ['tackle', 'gust', 'bugBite', 'spark'], evolution: { to: 'wild-charm-2', method: 'held_item_levelup', heldItemId: 'bond-charm' }, catchRank: 2 },
  'wild-charm-2': { id: 'wild-charm-2', family: 'wild-charm', stage: 2, name: 'もちもの進化形（旧）', types: ['ghost', 'fairy'], base: { hp: 65, attack: 36, defense: 31, speed: 44 }, moves: ['tackle', 'gust', 'bugBite', 'spark'], catchRank: 3 }
}

const LEGACY_STAGES = [
  { id: '1-1', legacy: true, area: 1, areaName: '旧テスト', label: '1-1 はじめの道', enemySpeciesId: 'wild-grass-1', enemyLevel: 5, enemyDifficulty: 'normal', mana: 15 },
  { id: '1-2', legacy: true, area: 1, areaName: '旧テスト', label: '1-2 みずべ', enemySpeciesId: 'wild-water-1', enemyLevel: 6, enemyDifficulty: 'normal', mana: 17, unlockedBy: '1-1' },
  { id: '1-3', legacy: true, area: 1, areaName: '旧テスト', label: '1-3 いなずま草原', enemySpeciesId: 'wild-electric-1', enemyLevel: 7, enemyDifficulty: 'normal', mana: 19, unlockedBy: '1-2' },
  { id: '1-4', legacy: true, area: 1, areaName: '旧テスト', label: '1-4 むしの小道', enemySpeciesId: 'wild-bug-1', enemyLevel: 8, enemyDifficulty: 'strong', mana: 21, unlockedBy: '1-3' },
  { id: '1-5', legacy: true, area: 1, areaName: '旧テスト', label: '1-5 ひかり岩場', enemySpeciesId: 'wild-stone-1', enemyLevel: 9, enemyDifficulty: 'rare', mana: 23, unlockedBy: '1-4', evolutionReward: { kind: 'stone', itemId: 'glow-stone', count: 1 } },
  { id: '1-6', legacy: true, area: 1, areaName: '旧テスト', label: '1-6 きずなの夜道', enemySpeciesId: 'wild-charm-1', enemyLevel: 9, enemyDifficulty: 'strong', mana: 24, unlockedBy: '1-5', evolutionReward: { kind: 'held', itemId: 'bond-charm', count: 1 } }
]

export const MOVES = Object.freeze({ ...RUNTIME_MOVES, ...LEGACY_MOVES })
export const SPECIES = RUNTIME_SPECIES
export const EVOLUTION_ITEMS = Object.freeze({
  stones: { ...RUNTIME_EVOLUTION_ITEMS.stones, 'glow-stone': { id: 'glow-stone', name: 'ひかりのいし（旧）' } },
  heldItems: { ...RUNTIME_EVOLUTION_ITEMS.heldItems, 'bond-charm': { id: 'bond-charm', name: 'きずなのチャーム（旧）' } }
})

// W-210 canonical exposure boundary. The generated artifact still contains historical
// acquisition metadata for traceability, but shared runtime consumers can never see
// transition-trial stages or minAreaClears. This makes the legacy data structurally
// non-authoritative even when the generator is re-run.
export const RUNTIME_STAGES = Object.freeze(GENERATED_RUNTIME_STAGES
  .filter((stage) => stage.kind !== 'evolution-trial')
  .map((stage) => {
    const { minAreaClears: _legacyMinAreaClears, evolutionReward: _legacyEvolutionReward, ...canonical } = stage
    return Object.freeze(canonical)
  }))
export const RUNTIME_META = Object.freeze({
  ...GENERATED_RUNTIME_META,
  stageCount: RUNTIME_STAGES.length,
  itemTrialCount: 0
})

const BASE_STAGES = [...RUNTIME_STAGES, ...LEGACY_STAGES]
export const STAGES = BASE_STAGES.map((stage) => stage.legacy ? stage : enrichStage(stage, SPECIES[stage.enemySpeciesId]))
export { pickDailyEncounterStages }

export const AREA_META = WORLD_AREA_META.filter((meta) => meta.area <= 4).map((meta) => ({ ...meta }))
export const EX_AREA_META = { ...WORLD_AREA_META.find((meta) => meta.area === 5) }

export function speciesOf(id) { return SPECIES[id] || LEGACY_SPECIES[id] || null }
export function moveOf(id) { return MOVES[id] || null }
export function typeLabel(id) { return `${TYPE_META[id]?.icon || ''} ${TYPE_META[id]?.label || id}`.trim() }
export function speciesNo(id) { return speciesOf(id)?.no || '---' }
export function stageKindLabel(kind) {
  return ({ wild: 'たんさく', boss: 'ボス', 'giga-challenge': 'ギガしれん', 'burst-challenge': 'バーストしれん', event: 'イベント', ex: 'EX' })[kind] || kind
}
