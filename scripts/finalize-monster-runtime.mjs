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
const MANIFEST_FILE = path.join(CURRENT, 'monster-asset-manifest.json')
const ACTIVE_IDS = Array.from({ length: 238 }, (_, index) => `m${String(index + 1).padStart(3, '0')}`)
const ACTIVE_ID_SET = new Set(ACTIVE_IDS)
const ART_STATES = new Set(['FORMAL', 'CANDIDATE', 'PLACEHOLDER'])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function sortedIds(ids) {
  return [...ids].sort((a, b) => a.localeCompare(b))
}

function assertExactActiveIds(label, ids) {
  const actual = sortedIds(ids)
  if (actual.length !== ACTIVE_IDS.length || actual.some((id, index) => id !== ACTIVE_IDS[index])) {
    throw new Error(`${label} must contain exactly m001-m238 (m239 excluded)`)
  }
}

function familyCode(value) {
  const numeric = Number(String(value).replace(/^F/i, ''))
  if (!Number.isInteger(numeric) || numeric < 1) return null
  return `F${String(numeric).padStart(3, '0')}`
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
  const relative = assetPath.replace(/^\/+/, '')
  return fs.existsSync(path.join(ROOT, 'public', relative))
}

function replaceCanonicalName(value, oldName, newName) {
  if (typeof value !== 'string' || !oldName || oldName === newName) return value
  return value.split(oldName).join(newName)
}

if (!fs.existsSync(OUT)) {
  throw new Error('runtimeMaster.generated.js must be generated before monster finalization')
}

const runtimeUrl = `${pathToFileURL(OUT).href}?w207=${Date.now()}`
const baseRuntime = await import(runtimeUrl)
const descriptionsRaw = DESCRIPTION_FILES.flatMap((relativePath) => readJson(path.join(CURRENT, relativePath)))

assertExactActiveIds('Description shards', descriptionsRaw.map((entry) => entry.speciesId))
if (new Set(descriptionsRaw.map((entry) => entry.speciesId)).size !== ACTIVE_IDS.length) {
  throw new Error('Description shards contain duplicate speciesId values')
}

const descriptions = {}
for (const entry of descriptionsRaw) {
  const speciesId = entry.speciesId
  const no = Number(entry.no)
  if (speciesId !== `m${String(no).padStart(3, '0')}`) {
    throw new Error(`Description number/id mismatch: ${speciesId} / ${entry.no}`)
  }
  descriptions[speciesId] = {
    no,
    speciesId,
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

if (descriptions.m236?.name !== 'ホシラディア') {
  throw new Error(`Canonical m236 must be ホシラディア, got ${descriptions.m236?.name ?? 'missing'}`)
}

const runtimeSpeciesIds = Object.keys(baseRuntime.RUNTIME_SPECIES || {})
assertExactActiveIds('Generated runtime species', runtimeSpeciesIds)
if (runtimeSpeciesIds.includes('m239')) throw new Error('m239 must not enter the active runtime registry')

const familyNames = new Map()
for (const description of Object.values(descriptions)) {
  const code = familyCode(description.familyNo)
  const current = familyNames.get(code)
  if (!current || description.stage < current.stage) familyNames.set(code, { stage: description.stage, name: description.name })
}

const species = structuredClone(baseRuntime.RUNTIME_SPECIES)
const nameCorrections = new Map()
for (const speciesId of ACTIVE_IDS) {
  const monster = species[speciesId]
  const description = descriptions[speciesId]
  if (!monster || !description) throw new Error(`Missing active monster identity: ${speciesId}`)
  if (String(monster.no).padStart(3, '0') !== String(description.no).padStart(3, '0')) {
    throw new Error(`Runtime/description No mismatch for ${speciesId}`)
  }
  if (familyCode(monster.familyNo) !== familyCode(description.familyNo)) {
    throw new Error(`Runtime/description family mismatch for ${speciesId}`)
  }
  if (Number(monster.stage) !== Number(description.stage)) {
    throw new Error(`Runtime/description stage mismatch for ${speciesId}`)
  }

  const oldName = monster.name
  const canonicalName = description.name
  if (oldName !== canonicalName) nameCorrections.set(speciesId, { oldName, canonicalName })
  monster.name = canonicalName
  const canonicalFamilyName = familyNames.get(familyCode(description.familyNo))?.name
  if (canonicalFamilyName) monster.family = canonicalFamilyName

  // Runtime artwork is resolved only through the canonical manifest. The older
  // generated guessed WebP path is deliberately removed here.
  delete monster.officialImageUrl
}

const moves = structuredClone(baseRuntime.RUNTIME_MOVES)
for (const [speciesId, correction] of nameCorrections) {
  for (const [moveId, move] of Object.entries(moves)) {
    if (!moveId.startsWith(`${speciesId}-`)) continue
    move.name = replaceCanonicalName(move.name, correction.oldName, correction.canonicalName)
  }
}

const stages = structuredClone(baseRuntime.RUNTIME_STAGES)
for (const stage of stages) {
  const correction = nameCorrections.get(stage.enemySpeciesId)
  if (!correction) continue
  stage.label = replaceCanonicalName(stage.label, correction.oldName, correction.canonicalName)
}

const manifest = readJson(MANIFEST_FILE)
if (manifest?.canonicalScope?.firstId !== 'm001' || manifest?.canonicalScope?.lastId !== 'm238' || Number(manifest?.canonicalScope?.speciesCount) !== 238) {
  throw new Error('Monster asset manifest canonical scope must be exactly m001-m238')
}
if (!Array.isArray(manifest.excluded) || !manifest.excluded.includes('m239')) {
  throw new Error('Monster asset manifest must explicitly exclude m239')
}

const manifestAssets = manifest.assets || {}
assertExactActiveIds('Monster asset manifest', Object.keys(manifestAssets))

const candidateAssetById = new Map()
for (const preference of manifest.candidatePreference || []) {
  const selectedIds = expandIdSelector(preference.ids)
  for (const speciesId of selectedIds) {
    if (!ACTIVE_ID_SET.has(speciesId)) throw new Error(`Candidate preference is outside active scope: ${speciesId}`)
    const candidateAsset = String(preference.candidateAsset || '').replaceAll('{speciesId}', speciesId)
    if (!candidateAsset) throw new Error(`Candidate preference is missing an asset path: ${preference.ids}`)
    const existing = candidateAssetById.get(speciesId)
    if (existing && existing !== candidateAsset) throw new Error(`Conflicting candidate asset paths for ${speciesId}`)
    if (!publicAssetExists(candidateAsset)) throw new Error(`Candidate asset is missing from repository: ${speciesId} -> ${candidateAsset}`)
    candidateAssetById.set(speciesId, candidateAsset)
  }
}

const monsterAssets = {}
const counts = { FORMAL: 0, CANDIDATE: 0, PLACEHOLDER: 0 }
for (const speciesId of ACTIVE_IDS) {
  const source = manifestAssets[speciesId] || {}
  const state = source.state
  if (!ART_STATES.has(state)) throw new Error(`Unknown art state for ${speciesId}: ${state}`)
  counts[state] += 1

  const formalAsset = source.formalAsset ?? null
  const approvalEvidence = source.approvalEvidence ?? null
  const formalAssetExists = formalAsset ? publicAssetExists(formalAsset) : false
  const candidateAsset = candidateAssetById.get(speciesId) ?? null
  const candidateAssetExists = candidateAsset ? publicAssetExists(candidateAsset) : false

  if (state === 'FORMAL') {
    if (!formalAsset) throw new Error(`FORMAL asset path missing for ${speciesId}`)
    if (!hasApprovalEvidence(approvalEvidence)) throw new Error(`FORMAL approval evidence missing for ${speciesId}`)
    if (!formalAssetExists) throw new Error(`FORMAL asset file missing for ${speciesId}: ${formalAsset}`)
  }

  monsterAssets[speciesId] = {
    speciesId,
    state,
    formalAsset,
    approvalEvidence,
    formalAssetExists,
    candidateAsset,
    candidateAssetExists
  }
}

for (const state of ART_STATES) {
  const declared = Number(manifest?.counts?.[state])
  if (Number.isFinite(declared) && declared !== counts[state]) {
    throw new Error(`Manifest ${state} count mismatch: declared ${declared}, actual ${counts[state]}`)
  }
}

const runtimeMeta = {
  ...baseRuntime.RUNTIME_META,
  monsterCanonical: {
    activeSpeciesCount: ACTIVE_IDS.length,
    descriptionCount: Object.keys(descriptions).length,
    excludedSpeciesIds: ['m239'],
    assetCounts: counts,
    nameCorrections: Object.fromEntries(nameCorrections)
  }
}

if (species.m236?.name !== 'ホシラディア') throw new Error('m236 runtime identity normalization failed')
if (JSON.stringify([species, moves, stages]).includes('ソラリオン')) {
  throw new Error('Unapproved m236 name drift remains in generated runtime')
}

const output = `// AUTO-GENERATED by scripts/generate-runtime-master.mjs + scripts/finalize-monster-runtime.mjs. DO NOT EDIT.\n` +
  `export const RUNTIME_META = ${JSON.stringify(runtimeMeta, null, 2)}\n\n` +
  `export const RUNTIME_MOVES = ${JSON.stringify(moves, null, 2)}\n\n` +
  `export const RUNTIME_SPECIES = ${JSON.stringify(species, null, 2)}\n\n` +
  `export const RUNTIME_EVOLUTION_ITEMS = ${JSON.stringify(baseRuntime.RUNTIME_EVOLUTION_ITEMS, null, 2)}\n\n` +
  `export const RUNTIME_STAGES = ${JSON.stringify(stages, null, 2)}\n\n` +
  `export const RUNTIME_MONSTER_DESCRIPTIONS = ${JSON.stringify(descriptions, null, 2)}\n\n` +
  `export const RUNTIME_MONSTER_ASSETS = ${JSON.stringify(monsterAssets, null, 2)}\n`

fs.writeFileSync(OUT, output)
console.log(`Finalized canonical monster runtime: ${ACTIVE_IDS.length} active / FORMAL ${counts.FORMAL} / CANDIDATE ${counts.CANDIDATE} / PLACEHOLDER ${counts.PLACEHOLDER}`)
