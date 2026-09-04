#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { CHANGE_PLAN_SCHEMA } from './formal-replacement.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(here, '../..')
const PLAN_PREFIX = 'design/rebuild/asset-production/change-plans/'

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')
const sorted = (values) => [...values].sort()

function git(root, args, options = {}) {
  return execFileSync('git', ['-C', root, ...args], { encoding: options.binary ? null : 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function gitExists(root, revPath) {
  try {
    git(root, ['cat-file', '-e', revPath])
    return true
  } catch {
    return false
  }
}

function gitJson(root, rev, filePath) {
  return JSON.parse(git(root, ['show', `${rev}:${filePath}`]))
}

function currentJson(root, filePath) {
  return JSON.parse(fs.readFileSync(path.join(root, filePath), 'utf8'))
}

function changedKeys(before = {}, after = {}) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  return sorted([...keys].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])))
}

function speciesIdFromPath(filePath, prefix, suffix) {
  if (!filePath.startsWith(prefix) || !filePath.endsWith(suffix)) return null
  const value = filePath.slice(prefix.length, filePath.length - suffix.length)
  return /^m\d{3,}$/.test(value) ? value : null
}

function sensitiveArtPath(filePath) {
  return /^public\/monsters\/m\d+\.webp$/.test(filePath) ||
    filePath === 'design/current/monster-asset-manifest.json' ||
    filePath === 'public/monster-asset-revisions.json' ||
    /^design\/rebuild\/asset-production\/candidate-provenance\/m\d+\.json$/.test(filePath) ||
    /^design\/rebuild\/asset-production\/candidate-history\/m\d+\/.+\.webp$/.test(filePath) ||
    filePath.startsWith(PLAN_PREFIX)
}

function resolveBase(root, explicitBase = null) {
  if (explicitBase) return explicitBase
  const baseRef = process.env.GITHUB_BASE_REF
  if (!baseRef) throw new Error('PR scope verification needs --base <sha/ref> or GITHUB_BASE_REF')
  return git(root, ['merge-base', 'HEAD', `origin/${baseRef}`]).trim()
}

export function verifyMonsterArtPrScope({ root = defaultRoot, base = null } = {}) {
  const baseSha = resolveBase(root, base)
  const changedFiles = git(root, ['diff', '--name-only', `${baseSha}...HEAD`]).trim().split('\n').filter(Boolean).sort()
  const planFiles = changedFiles.filter((file) => file.startsWith(PLAN_PREFIX) && file.endsWith('.json'))
  const sensitiveFiles = changedFiles.filter(sensitiveArtPath)

  if (planFiles.length === 0) {
    if (sensitiveFiles.length) throw new Error(`monster art release files changed without a change plan: ${sensitiveFiles.join(', ')}`)
    return { mode: 'NO_ART_TRANSACTION', baseSha, changedFiles }
  }
  if (planFiles.length !== 1) throw new Error(`exactly one monster art change plan is required per PR; got ${planFiles.length}`)

  const planFile = planFiles[0]
  const plan = currentJson(root, planFile)
  if (plan.schema !== CHANGE_PLAN_SCHEMA) throw new Error(`unsupported change plan schema: ${plan.schema}`)
  if (plan.baseHeadSha !== baseSha) throw new Error(`change plan baseHeadSha must equal PR merge-base; plan=${plan.baseHeadSha} base=${baseSha}`)
  if (plan.intent !== 'REPLACE') throw new Error('change plan intent must be REPLACE')
  if (!Array.isArray(plan.expectedSpecies) || plan.expectedSpecies.length < 1) throw new Error('change plan expectedSpecies is required')
  const expected = sorted(plan.expectedSpecies)
  if (new Set(expected).size !== expected.length) throw new Error('change plan expectedSpecies contains duplicates')

  const allowed = new Set(plan.allowedChangedFiles ?? [])
  if (!allowed.has(planFile)) throw new Error('change plan must allow its own file')
  const unexpectedFiles = changedFiles.filter((file) => !allowed.has(file))
  if (unexpectedFiles.length) throw new Error(`unexpected files in scoped monster art PR: ${unexpectedFiles.join(', ')}`)

  const requiredCore = new Set([
    planFile,
    'design/current/monster-asset-manifest.json',
    'public/monster-asset-revisions.json',
    ...expected.map((id) => `public/monsters/${id}.webp`),
    ...expected.map((id) => `design/rebuild/asset-production/candidate-provenance/${id}.json`),
  ])
  const missingCore = [...requiredCore].filter((file) => !changedFiles.includes(file))
  if (missingCore.length) throw new Error(`missing expected monster art PR changes: ${missingCore.join(', ')}`)

  const changedBinaryIds = sorted(changedFiles.map((file) => speciesIdFromPath(file, 'public/monsters/', '.webp')).filter(Boolean))
  if (JSON.stringify(changedBinaryIds) !== JSON.stringify(expected)) {
    throw new Error(`changed monster binaries must exactly match expectedSpecies; expected=${expected.join(',')} actual=${changedBinaryIds.join(',')}`)
  }

  const changedProvenanceIds = sorted(changedFiles.map((file) => speciesIdFromPath(file, 'design/rebuild/asset-production/candidate-provenance/', '.json')).filter(Boolean))
  if (JSON.stringify(changedProvenanceIds) !== JSON.stringify(expected)) {
    throw new Error(`changed provenance must exactly match expectedSpecies; expected=${expected.join(',')} actual=${changedProvenanceIds.join(',')}`)
  }

  const manifestPath = 'design/current/monster-asset-manifest.json'
  const beforeManifest = gitJson(root, baseSha, manifestPath)
  const afterManifest = currentJson(root, manifestPath)
  const changedManifestSpecies = changedKeys(beforeManifest.assets, afterManifest.assets)
  if (JSON.stringify(changedManifestSpecies) !== JSON.stringify(expected)) {
    throw new Error(`manifest species changes must exactly match expectedSpecies; expected=${expected.join(',')} actual=${changedManifestSpecies.join(',')}`)
  }

  const revisionPath = 'public/monster-asset-revisions.json'
  const beforeRevisions = gitJson(root, baseSha, revisionPath)
  const afterRevisions = currentJson(root, revisionPath)
  const changedRevisionSpecies = changedKeys(beforeRevisions.assets, afterRevisions.assets)
  if (JSON.stringify(changedRevisionSpecies) !== JSON.stringify(expected)) {
    throw new Error(`revision species changes must exactly match expectedSpecies; expected=${expected.join(',')} actual=${changedRevisionSpecies.join(',')}`)
  }

  const historyFiles = changedFiles.filter((file) => file.startsWith('design/rebuild/asset-production/candidate-history/') && file.endsWith('.webp'))
  for (const file of historyFiles) {
    const match = /^design\/rebuild\/asset-production\/candidate-history\/(m\d+)\/([0-9a-f]{64})\.webp$/.exec(file)
    if (!match) throw new Error(`unexpected history path shape: ${file}`)
    const [, id, archivedSha] = match
    if (!expected.includes(id)) throw new Error(`history changed for unexpected species ${id}`)
    if (plan.species?.[id]?.oldSha256 !== archivedSha) throw new Error(`${id}: history filename must equal planned old SHA`)
  }

  for (const id of expected) {
    const row = plan.species?.[id]
    if (!row) throw new Error(`${id}: change plan species row is missing`)
    const binaryPath = `public/monsters/${id}.webp`
    const currentBytes = fs.readFileSync(path.join(root, binaryPath))
    const currentSha = sha256(currentBytes)
    if (currentSha !== row.newSha256) throw new Error(`${id}: HEAD binary SHA does not match planned new SHA`)
    if (!gitExists(root, `${baseSha}:${binaryPath}`)) throw new Error(`${id}: base binary is missing`)
    const baseBytes = git(root, ['show', `${baseSha}:${binaryPath}`], { binary: true })
    const baseBinarySha = sha256(baseBytes)
    if (baseBinarySha !== row.oldSha256 || baseBinarySha !== row.expectedCurrentSha256) {
      throw new Error(`${id}: base binary SHA does not match change plan old/expected SHA`)
    }
    if (beforeManifest.assets?.[id]?.formalSha256 !== row.oldSha256) throw new Error(`${id}: base manifest SHA does not match plan`)
    if (afterManifest.assets?.[id]?.formalSha256 !== row.newSha256) throw new Error(`${id}: HEAD manifest SHA does not match plan`)
    if (beforeRevisions.assets?.[id]?.revision !== `sha256-${row.oldSha256}`) throw new Error(`${id}: base revision does not match plan`)
    if (afterRevisions.assets?.[id]?.revision !== `sha256-${row.newSha256}`) throw new Error(`${id}: HEAD revision does not match plan`)

    const historyPath = `design/rebuild/asset-production/candidate-history/${id}/${row.oldSha256}.webp`
    const historyExistedAtBase = gitExists(root, `${baseSha}:${historyPath}`)
    if (!historyExistedAtBase && !changedFiles.includes(historyPath)) {
      throw new Error(`${id}: previous FORMAL history archive was missing at base and is missing from PR`)
    }
  }

  return {
    mode: 'VERIFIED_ART_TRANSACTION',
    transactionId: plan.transactionId,
    baseSha,
    expectedSpecies: expected,
    changedFiles,
    missing: [],
    unexpected: [],
  }
}

function parseArgs(argv) {
  const args = { root: defaultRoot, base: null }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') args.root = path.resolve(argv[++i])
    else if (argv[i] === '--base') args.base = argv[++i]
    else throw new Error(`Unknown argument: ${argv[i]}`)
  }
  return args
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    console.log(JSON.stringify(verifyMonsterArtPrScope(parseArgs(process.argv.slice(2))), null, 2))
  } catch (error) {
    console.error(`FAIL ${error.message}`)
    process.exitCode = 1
  }
}
