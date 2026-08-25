import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src', 'game', 'runtimeMaster.generated.js')
const CURRENT = path.join(ROOT, 'design', 'current')
const DESCRIPTION_FILES = [
  'monsters/descriptions-001-080.json',
  'monsters/descriptions-081-160.json',
  'monsters/descriptions-161-238.json'
]
const ACTIVE_IDS = Array.from({ length: 238 }, (_, index) => `m${String(index + 1).padStart(3, '0')}`)
const ACTIVE_ID_SET = new Set(ACTIVE_IDS)
const ART_STATES = ['FORMAL', 'CANDIDATE', 'PLACEHOLDER']
const ART_STATE_SET = new Set(ART_STATES)

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const sortedIds = (ids) => [...ids].sort((a, b) => a.localeCompare(b))

function assertExactActiveIds(label, ids) {
  const actual = sortedIds(ids)
  if (actual.length !== ACTIVE_IDS.length || actual.some((id, index) => id !== ACTIVE_IDS[index])) {
    throw new Error(`${label} must contain exactly m001-m238 (m239 excluded)`)
  }
}

function familyCode(value) {
  const numeric = Number(String(value).replace(/^F/i, ''))
  return Number.isInteger(numeric) && numeric > 0 ? `F${String(numeric).padStart(3, '0')}` : null
}

function hasApprovalEvidence(value) {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return value === true
}

function expandIdSelector(selector) {
  if (/^m\d{3}$/.test(selector)) return [selector]
  const match = /^(m\d{3})-(m\d{3})$/.exec(selector)
  if (!match) throw new Error(`Unsupported manifest id selector: ${selector}`)
  const first = Number(match[1].slice(1))
  const last = Number(match[2].slice(1))
  if (first > last) throw new Error(`Invalid manifest id range: ${selector}`)
  return Array.from({ length: last - first + 1 }, (_, index) => `m${String(first + index).padStart(3, '0')}`)
}

function publicAssetExists(assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.trim()) return false
  if (/^(https?:|data:|blob:)/.test(assetPath)) return true
  return fs.existsSync(path.join(ROOT, 'public', assetPath.replace(/^\/+/, '')))
}

function replaceCanonicalName(value, oldName, newName) {
  if (typeof value !== 'string' || !oldName || oldName === newName) return value
  return value.split(oldName).join(newName)
}

if (!fs.existsSync(OUT)) throw new Error('runtimeMaster.generated.js must be generated before monster finalization')
const baseRuntime = await import(`${pathToFileURL(OUT).href}?w207=${Date.now()}`)

// W-114 may not be merged yet. Normalize the two accepted Phase 2 shard shapes
// without synthesizing missing lore: W-110 familyConcept/personalityArcContext and
// W-111/W-112 concept/personalityArc.
const descriptionsRaw = DESCRIPTION_FILES.flatMap((relativePath) => readJson(path.join(CURRENT, relativePath)))
assertExactActiveIds('Description shards', descriptionsRaw.map((entry) => entry.speciesId))
if (new Set(descriptionsRaw.map((entry) => entry.speciesId)).size !== 238) throw new Error('Duplicate description speciesId')

const descriptions = {}
for (const entry of descriptionsRaw) {
  const no = Number(entry.no)
  if (entry.speciesId !== `m${String(no).padStart(3, '0')}`) throw new Error(`Description number/id mismatch: ${entry.speciesId}`)
  descriptions[entry.speciesId] = {
    no,
    speciesId: entry.speciesId,
    name: entry.name,
    familyNo: Number(entry.familyNo),
    stage: Number(entry.stage),
    type: entry.type,
    motif: entry.motif ?? null,
    familyConcept: entry.familyConcept ?? entry.concept ?? null,
    personalityArc: entry.personalityArc ?? null,
    personalityArcContext: entry.personalityArcContext ?? null,
    description: entry.description ?? null,
    graphicCore: entry.graphicCore ?? null,
    expressionAndPose: entry.expressionAndPose ?? null,
    silhouette: entry.silhouette ?? null
  }
}
if (descriptions.m236?.name !== 'ホシラディア') throw new Error(`Canonical m236 must be ホシラディア, got ${descriptions.m236?.name ?? 'missing'}`)

assertExactActiveIds('Generated runtime species', Object.keys(baseRuntime.RUNTIME_SPECIES || {}))
const species = structuredClone(baseRuntime.RUNTIME_SPECIES)
for (const speciesId of ACTIVE_IDS) {
  const monster = species[speciesId]
  const description = descriptions[speciesId]
  if (!monster || !description) throw new Error(`Missing active monster identity: ${speciesId}`)
  if (String(monster.no).padStart(3, '0') !== String(description.no).padStart(3, '0')) throw new Error(`Runtime/description No mismatch for ${speciesId}`)
  if (familyCode(monster.familyNo) !== familyCode(description.familyNo)) throw new Error(`Runtime/description family mismatch for ${speciesId}`)
  if (Number(monster.stage) !== description.stage) throw new Error(`Runtime/description stage mismatch for ${speciesId}`)
  // Artwork must never bypass the manifest-driven resolver.
  delete monster.officialImageUrl
}

// Phase 2 final review explicitly classifies the m236 later-master rename as drift.
// Do not blanket-promote other description-shard names into the battle master.
const m236OldName = species.m236.name
const m236CanonicalName = descriptions.m236.name
const nameCorrections = new Map()
if (m236OldName !== m236CanonicalName) {
  nameCorrections.set('m236', { oldName: m236OldName, canonicalName: m236CanonicalName })
  species.m236.name = m236CanonicalName
  if (species.m236.family === m236OldName) species.m236.family = m236CanonicalName
}

const moves = structuredClone(baseRuntime.RUNTIME_MOVES)
for (const [speciesId, { oldName, canonicalName }] of nameCorrections) {
  for (const [moveId, move] of Object.entries(moves)) {
    if (moveId.startsWith(`${speciesId}-`)) move.name = replaceCanonicalName(move.name, oldName, canonicalName)
  }
}
const stages = structuredClone(baseRuntime.RUNTIME_STAGES)
for (const stage of stages) {
  const correction = nameCorrections.get(stage.enemySpeciesId)
  if (correction) stage.label = replaceCanonicalName(stage.label, correction.oldName, correction.canonicalName)
}

const manifest = readJson(path.join(CURRENT, 'monster-asset-manifest.json'))
const scope = manifest?.canonicalScope || {}
if (scope.firstId !== 'm001' || scope.lastId !== 'm238' || Number(scope.speciesCount) !== 238) {
  throw new Error('Monster asset manifest canonical scope must be exactly m001-m238')
}
if (!Array.isArray(scope.excludedReferenceIds) || !scope.excludedReferenceIds.includes('m239')) {
  throw new Error('Monster asset manifest canonicalScope.excludedReferenceIds must include m239')
}
assertExactActiveIds('Monster asset manifest', Object.keys(manifest.assets || {}))

const candidateAssetById = new Map()
for (const preference of manifest.candidatePreference || []) {
  for (const speciesId of expandIdSelector(preference.ids)) {
    if (!ACTIVE_ID_SET.has(speciesId)) throw new Error(`Candidate preference outside active scope: ${speciesId}`)
    const candidateAsset = String(preference.candidateAsset || '').replaceAll('{speciesId}', speciesId)
    if (!candidateAsset) throw new Error(`Candidate asset path missing: ${preference.ids}`)
    const existing = candidateAssetById.get(speciesId)
    if (existing && existing !== candidateAsset) throw new Error(`Conflicting candidate assets for ${speciesId}`)
    if (!publicAssetExists(candidateAsset)) throw new Error(`Candidate asset missing: ${speciesId} -> ${candidateAsset}`)
    candidateAssetById.set(speciesId, candidateAsset)
  }
}

const monsterAssets = {}
const counts = { FORMAL: 0, CANDIDATE: 0, PLACEHOLDER: 0 }
for (const speciesId of ACTIVE_IDS) {
  const source = manifest.assets[speciesId] || {}
  if (!ART_STATE_SET.has(source.state)) throw new Error(`Unknown art state for ${speciesId}: ${source.state}`)
  counts[source.state] += 1
  const formalAsset = source.formalAsset ?? null
  const approvalEvidence = source.approvalEvidence ?? null
  const formalAssetExists = formalAsset ? publicAssetExists(formalAsset) : false
  const candidateAsset = candidateAssetById.get(speciesId) ?? null
  const candidateAssetExists = candidateAsset ? publicAssetExists(candidateAsset) : false

  if (source.state === 'FORMAL') {
    if (!formalAsset) throw new Error(`FORMAL asset path missing for ${speciesId}`)
    if (!hasApprovalEvidence(approvalEvidence)) throw new Error(`FORMAL approval evidence missing for ${speciesId}`)
    if (!formalAssetExists) throw new Error(`FORMAL asset file missing for ${speciesId}: ${formalAsset}`)
  }
  monsterAssets[speciesId] = { speciesId, state: source.state, formalAsset, approvalEvidence, formalAssetExists, candidateAsset, candidateAssetExists }
}
for (const state of ART_STATES) {
  const declared = Number(manifest?.counts?.[state])
  if (Number.isFinite(declared) && declared !== counts[state]) throw new Error(`Manifest ${state} count mismatch: declared ${declared}, actual ${counts[state]}`)
}

const runtimeMeta = {
  ...baseRuntime.RUNTIME_META,
  monsterCanonical: {
    activeSpeciesCount: 238,
    descriptionCount: 238,
    excludedSpeciesIds: ['m239'],
    assetCounts: counts,
    nameCorrections: Object.fromEntries(nameCorrections)
  }
}
if (species.m236?.name !== 'ホシラディア') throw new Error('m236 runtime identity normalization failed')
if (JSON.stringify([species, moves, stages]).includes('ソラリオン')) throw new Error('Unapproved m236 name drift remains in generated runtime')

const output = `// AUTO-GENERATED by scripts/generate-runtime-master.mjs + scripts/finalize-monster-runtime.mjs. DO NOT EDIT.\n` +
  `export const RUNTIME_META = ${JSON.stringify(runtimeMeta, null, 2)}\n\n` +
  `export const RUNTIME_MOVES = ${JSON.stringify(moves, null, 2)}\n\n` +
  `export const RUNTIME_SPECIES = ${JSON.stringify(species, null, 2)}\n\n` +
  `export const RUNTIME_EVOLUTION_ITEMS = ${JSON.stringify(baseRuntime.RUNTIME_EVOLUTION_ITEMS, null, 2)}\n\n` +
  `export const RUNTIME_STAGES = ${JSON.stringify(stages, null, 2)}\n\n` +
  `export const RUNTIME_MONSTER_DESCRIPTIONS = ${JSON.stringify(descriptions, null, 2)}\n\n` +
  `export const RUNTIME_MONSTER_ASSETS = ${JSON.stringify(monsterAssets, null, 2)}\n`
fs.writeFileSync(OUT, output)
console.log(`Finalized canonical monster runtime: 238 active / FORMAL ${counts.FORMAL} / CANDIDATE ${counts.CANDIDATE} / PLACEHOLDER ${counts.PLACEHOLDER}`)
