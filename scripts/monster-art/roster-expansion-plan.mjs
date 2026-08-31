#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(here, '../..')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function formatSpeciesId(no) {
  return `m${String(no).padStart(3, '0')}`
}

function parseSpeciesNo(id) {
  const match = /^m(\d{3,})$/.exec(id ?? '')
  return match ? Number(match[1]) : null
}

function loadDescriptions(root) {
  const dir = path.join(root, 'design/current/monsters')
  return fs.readdirSync(dir)
    .filter((name) => /^descriptions-\d+-\d+\.json$/.test(name))
    .sort()
    .flatMap((name) => readJson(path.join(dir, name)))
}

export function buildExpansionPlan({ manifest, descriptions, familySize }) {
  if (!Number.isInteger(familySize) || familySize < 1 || familySize > 3) throw new Error('familySize must be 1, 2, or 3')
  const activeIds = Object.keys(manifest?.assets ?? {})
  if (!activeIds.length) throw new Error('CURRENT manifest has no active species')
  if (activeIds.length !== manifest?.canonicalScope?.speciesCount) throw new Error('CURRENT manifest speciesCount is stale')

  const activeNos = activeIds.map(parseSpeciesNo)
  if (activeNos.some((no) => !Number.isInteger(no))) throw new Error('CURRENT manifest contains invalid speciesId')
  const excludedIds = [...(manifest?.canonicalScope?.excludedReferenceIds ?? [])]
  const excludedNos = excludedIds.map(parseSpeciesNo).filter(Number.isInteger)
  const reserved = new Set([...activeNos, ...excludedNos])

  const familyNos = descriptions.map((row) => Number(row.familyNo)).filter((no) => Number.isInteger(no) && no > 0)
  if (!familyNos.length) throw new Error('CURRENT descriptions contain no family numbers')
  const nextFamilyNo = Math.max(...familyNos) + 1

  let cursor = Math.max(...reserved) + 1
  const proposedSpeciesIds = []
  while (proposedSpeciesIds.length < familySize) {
    if (!reserved.has(cursor)) proposedSpeciesIds.push(formatSpeciesId(cursor))
    cursor += 1
  }

  return {
    schemaVersion: 1,
    mode: 'DRY_RUN_ONLY',
    current: {
      firstId: manifest.canonicalScope.firstId,
      lastId: manifest.canonicalScope.lastId,
      speciesCount: activeIds.length,
      familyCount: new Set(familyNos).size,
      excludedReferenceIds: excludedIds,
    },
    proposal: {
      familySize,
      familyNo: nextFamilyNo,
      speciesIds: proposedSpeciesIds,
      resultingSpeciesCount: activeIds.length + familySize,
      resultingFamilyCount: new Set(familyNos).size + 1,
    },
    safety: {
      appendOnlyIds: true,
      excludedIdsReused: false,
      currentSpeciesMutationAllowed: false,
      note: 'This command allocates IDs only. It never edits masters, art, runtime, manifest, or production.',
    },
  }
}

export function planRosterExpansion({ root = defaultRoot, familySize }) {
  const manifest = readJson(path.join(root, 'design/current/monster-asset-manifest.json'))
  const descriptions = loadDescriptions(root)
  return buildExpansionPlan({ manifest, descriptions, familySize })
}

function parseArgs(argv) {
  const args = { root: defaultRoot }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') args.root = path.resolve(argv[++i])
    else if (arg === '--family-size') args.familySize = Number(argv[++i])
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!args.familySize) throw new Error('Usage: roster-expansion-plan.mjs --family-size 1|2|3')
  return args
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    console.log(JSON.stringify(planRosterExpansion(parseArgs(process.argv.slice(2))), null, 2))
  } catch (error) {
    console.error(`FAIL ${error.message}`)
    process.exitCode = 1
  }
}
