import { SPECIES, speciesOf } from './content.js'

function speciesNoValue(species) {
  const value = Number(species?.no)
  if (Number.isFinite(value)) return value
  const match = /m(\d+)/.exec(String(species?.id || ''))
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

const FAMILY_MIN_NO = (() => {
  const values = new Map()
  for (const species of Object.values(SPECIES || {})) {
    const family = species.family || species.id
    values.set(family, Math.min(values.get(family) ?? Number.MAX_SAFE_INTEGER, speciesNoValue(species)))
  }
  return values
})()

export function boxFamilyKey(monster) {
  const species = speciesOf(monster?.speciesId)
  return species?.family || species?.id || monster?.speciesId || 'unknown'
}

export function compareBoxEvolutionOrder(a, b) {
  const aSpecies = speciesOf(a.speciesId)
  const bSpecies = speciesOf(b.speciesId)
  const aFamily = boxFamilyKey(a)
  const bFamily = boxFamilyKey(b)
  const familyDiff = (FAMILY_MIN_NO.get(aFamily) ?? speciesNoValue(aSpecies)) - (FAMILY_MIN_NO.get(bFamily) ?? speciesNoValue(bSpecies))
  if (familyDiff) return familyDiff
  const stageDiff = Number(aSpecies?.stage || 1) - Number(bSpecies?.stage || 1)
  if (stageDiff) return stageDiff
  const speciesDiff = speciesNoValue(aSpecies) - speciesNoValue(bSpecies)
  if (speciesDiff) return speciesDiff
  const levelDiff = Number(b.level || 1) - Number(a.level || 1)
  if (levelDiff) return levelDiff
  return String(a.instanceId).localeCompare(String(b.instanceId))
}

export function compareBoxLevelOrder(a, b) {
  const levelDiff = Number(b.level || 1) - Number(a.level || 1)
  if (levelDiff) return levelDiff
  const speciesDiff = speciesNoValue(speciesOf(a.speciesId)) - speciesNoValue(speciesOf(b.speciesId))
  if (speciesDiff) return speciesDiff
  return String(a.instanceId).localeCompare(String(b.instanceId))
}

export function projectBoxMonsters(game, {
  sort = 'evolution',
  evolvableOnly = false,
  canEvolve = () => false
} = {}) {
  const source = Object.values(game?.box || {})
  const filtered = evolvableOnly ? source.filter((monster) => canEvolve(monster, game)) : source
  return [...filtered].sort(sort === 'level' ? compareBoxLevelOrder : compareBoxEvolutionOrder)
}

export function groupBoxByFamily(monsters = []) {
  const groups = []
  for (const monster of monsters) {
    const family = boxFamilyKey(monster)
    const last = groups[groups.length - 1]
    if (last?.family === family) last.monsters.push(monster)
    else groups.push({ family, monsters: [monster] })
  }
  return groups
}
