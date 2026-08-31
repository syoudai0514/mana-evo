import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptDir, '..')

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizedLocalAssetPath(assetUrl) {
  if (typeof assetUrl !== 'string' || !assetUrl.trim()) throw new Error('FORMAL asset requires formalAsset')
  const clean = assetUrl.trim().split(/[?#]/, 1)[0]
  if (!clean.startsWith('/monsters/') || clean.includes('..')) {
    throw new Error(`FORMAL asset must be a local /monsters/ path: ${assetUrl}`)
  }
  return clean
}

export function buildRevisionManifest(canonicalManifest, readAsset) {
  if (!canonicalManifest || typeof canonicalManifest !== 'object') throw new Error('invalid monster asset manifest')
  const assets = {}
  const formalByUrl = {}
  let totalBytes = 0
  const manifestRows = []

  for (const [speciesId, entry] of Object.entries(canonicalManifest.assets || {}).sort(([a], [b]) => a.localeCompare(b))) {
    const state = entry?.state || 'PLACEHOLDER'
    assets[speciesId] = { state }
    if (state !== 'FORMAL') continue

    const assetUrl = normalizedLocalAssetPath(entry.formalAsset)
    const bytes = readAsset(assetUrl)
    const byteLength = Number(bytes.byteLength ?? bytes.length ?? 0)
    const revision = `sha256-${sha256(bytes)}`
    assets[speciesId] = { state: 'FORMAL', url: assetUrl, revision, byteLength }
    formalByUrl[assetUrl] = revision
    totalBytes += byteLength
    manifestRows.push(`${speciesId}\t${assetUrl}\t${revision}\t${byteLength}`)
  }

  const manifestRevision = `sha256-${sha256(manifestRows.join('\n'))}`

  return {
    schemaVersion: 2,
    sourceSchemaVersion: canonicalManifest.schemaVersion ?? null,
    sourcePath: 'design/current/monster-asset-manifest.json',
    manifestRevision,
    formalCount: manifestRows.length,
    totalBytes,
    assets,
    formalByUrl
  }
}

export function generateRevisionManifest({ root = defaultRoot } = {}) {
  const canonicalPath = path.join(root, 'design/current/monster-asset-manifest.json')
  const outputPath = path.join(root, 'public/monster-asset-revisions.json')
  const canonicalManifest = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'))
  const generated = buildRevisionManifest(canonicalManifest, (assetUrl) => {
    const relative = assetUrl.replace(/^\//, '')
    return fs.readFileSync(path.join(root, 'public', relative))
  })
  fs.writeFileSync(outputPath, `${JSON.stringify(generated, null, 2)}\n`)
  return generated
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const generated = generateRevisionManifest()
  console.log(`Generated PWA monster revisions: ${generated.formalCount} formal assets / ${generated.totalBytes} bytes / ${generated.manifestRevision}`)
}
