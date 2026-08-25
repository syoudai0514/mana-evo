import { RUNTIME_MONSTER_DESCRIPTIONS, RUNTIME_SPECIES } from './runtimeMaster.generated.js'

export const ACTIVE_MONSTER_IDS = Object.freeze(
  Array.from({ length: 238 }, (_, index) => `m${String(index + 1).padStart(3, '0')}`)
)

const ACTIVE_MONSTER_ID_SET = new Set(ACTIVE_MONSTER_IDS)

export function isActiveMonsterSpeciesId(speciesId) {
  return ACTIVE_MONSTER_ID_SET.has(String(speciesId || ''))
}

export function monsterDescriptionOf(speciesId) {
  if (!isActiveMonsterSpeciesId(speciesId)) return null
  return RUNTIME_MONSTER_DESCRIPTIONS[speciesId] || null
}

export function monsterIdentityOf(speciesId) {
  if (!isActiveMonsterSpeciesId(speciesId)) return null
  const species = RUNTIME_SPECIES[speciesId]
  const description = RUNTIME_MONSTER_DESCRIPTIONS[speciesId]
  if (!species || !description) return null
  return {
    speciesId,
    no: species.no,
    name: species.name,
    familyNo: species.familyNo,
    stage: species.stage,
    description
  }
}
