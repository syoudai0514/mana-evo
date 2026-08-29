import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_PATH = path.join(ROOT, 'design/current/canonical-sync-map.json')

export function loadSyncMap() {
  return JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
}

function normalizeFile(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '')
}

export function inferCanonicalDomains(files, map = loadSyncMap()) {
  const normalized = [...new Set((files || []).map(normalizeFile).filter(Boolean))]
  const hits = new Map()
  for (const [domain, config] of Object.entries(map.domains || {})) {
    const matched = normalized.filter((file) => (
      (config.runtimeFiles || []).includes(file) ||
      (config.runtimePrefixes || []).some((prefix) => file.startsWith(prefix))
    ))
    if (matched.length) hits.set(domain, matched)
  }
  return hits
}

function marker(body, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = String(body || '').match(new RegExp(`^\\s*${escaped}\\s*:\\s*(.+?)\\s*$`, 'im'))
  return match ? match[1].trim() : ''
}

export function parseCanonicalDeclaration(body, map = loadSyncMap()) {
  const markers = map.impactMarkers || {}
  const impact = marker(body, markers.impact || 'Canonical-Impact').toLowerCase()
  const domains = marker(body, markers.domains || 'Canonical-Domains')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const reason = marker(body, markers.reason || 'Canonical-Reason')
  return { impact, domains, reason }
}

export function validateCanonicalSync({ files = [], body = '', map = loadSyncMap() } = {}) {
  const changed = [...new Set(files.map(normalizeFile).filter(Boolean))]
  const hits = inferCanonicalDomains(changed, map)
  const inferredDomains = [...hits.keys()]
  if (!inferredDomains.length) {
    return { ok: true, inferredDomains, declaration: parseCanonicalDeclaration(body, map), errors: [], warnings: [] }
  }

  const declaration = parseCanonicalDeclaration(body, map)
  const errors = []
  const warnings = []

  if (!['changed', 'none'].includes(declaration.impact)) {
    errors.push('Protected runtime/art files changed, but PR body is missing `Canonical-Impact: changed` or `Canonical-Impact: none`.')
  }

  if (declaration.impact === 'none') {
    if (declaration.reason.length < 12) {
      errors.push('`Canonical-Impact: none` requires a concrete `Canonical-Reason:` (12+ characters).')
    }
    warnings.push(`Runtime domains touched: ${inferredDomains.join(', ')}. Reviewer must confirm the no-contract-change claim.`)
  }

  if (declaration.impact === 'changed') {
    if (!declaration.domains.length) {
      errors.push('`Canonical-Impact: changed` requires `Canonical-Domains:` with at least one owning domain.')
    }

    const unknown = declaration.domains.filter((domain) => !map.domains?.[domain])
    if (unknown.length) errors.push(`Unknown Canonical-Domains: ${unknown.join(', ')}`)

    const unrelated = declaration.domains.filter((domain) => !hits.has(domain))
    if (unrelated.length) {
      warnings.push(`Declared domains not inferred from protected paths: ${unrelated.join(', ')}. This may be valid for cross-domain behavior; reviewer should verify.`)
    }

    for (const domain of declaration.domains) {
      const docs = map.domains?.[domain]?.currentDocs || []
      if (docs.length && !docs.some((doc) => changed.includes(doc))) {
        errors.push(`Canonical domain '${domain}' changed but none of its CURRENT docs were updated: ${docs.join(', ')}`)
      }
    }

    if (!changed.includes(map.decisionLog)) {
      errors.push(`Canonical behavior changed but ${map.decisionLog} was not updated.`)
    }
  }

  return { ok: errors.length === 0, inferredDomains, declaration, errors, warnings }
}

function changedFilesFromGit(base) {
  const cleanBase = String(base || '').trim()
  if (!cleanBase || /^0+$/.test(cleanBase)) {
    throw new Error('CANONICAL_SYNC_BASE is required for CI drift detection.')
  }
  const output = execFileSync('git', ['diff', '--name-only', `${cleanBase}...HEAD`], {
    cwd: ROOT,
    encoding: 'utf8'
  })
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

function main() {
  const base = process.env.CANONICAL_SYNC_BASE
  const body = process.env.CANONICAL_SYNC_PR_BODY || ''
  const files = changedFilesFromGit(base)
  const result = validateCanonicalSync({ files, body })

  console.log(`[canonical-sync] changed files: ${files.length}`)
  console.log(`[canonical-sync] inferred domains: ${result.inferredDomains.join(', ') || '(none)'}`)
  if (result.declaration.impact) console.log(`[canonical-sync] declared impact: ${result.declaration.impact}`)
  if (result.declaration.domains.length) console.log(`[canonical-sync] declared domains: ${result.declaration.domains.join(', ')}`)
  for (const warning of result.warnings) console.warn(`[canonical-sync] WARNING: ${warning}`)
  for (const error of result.errors) console.error(`[canonical-sync] ERROR: ${error}`)
  if (!result.ok) process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
