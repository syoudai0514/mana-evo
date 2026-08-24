import {
  RUNTIME_EVOLUTION_ITEMS,
  RUNTIME_META,
  RUNTIME_MOVES,
  RUNTIME_SPECIES,
  RUNTIME_STAGES
} from './runtimeMaster.generated.js'

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

export const MOVES = RUNTIME_MOVES
export const SPECIES = RUNTIME_SPECIES
export const EVOLUTION_ITEMS = RUNTIME_EVOLUTION_ITEMS
export const STAGES = RUNTIME_STAGES
export { RUNTIME_META }

export const AREA_META = [1, 2, 3, 4].map((area) => {
  const first = Object.values(SPECIES).find((species) => species.area === area)
  return { area, name: first?.areaName || `エリア${area}` }
})

export function speciesOf(id) { return SPECIES[id] || null }
export function moveOf(id) { return MOVES[id] || null }
export function typeLabel(id) { return `${TYPE_META[id]?.icon || ''} ${TYPE_META[id]?.label || id}`.trim() }
export function speciesNo(id) { return speciesOf(id)?.no || '---' }
export function stageKindLabel(kind) {
  return ({ wild: 'たんさく', boss: 'ボス', 'evolution-trial': 'シンカしれん', 'giga-challenge': 'ギガしれん', 'burst-challenge': 'バーストしれん', event: 'イベント', ex: 'EX' })[kind] || kind
}
