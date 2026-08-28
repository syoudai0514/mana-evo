#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const BASELINE = path.join(ROOT, 'design/rebuild/asset-production/visual-audit/223-baseline.json')
const SHARDS = [
  'design/current/monsters/descriptions-001-080.json',
  'design/current/monsters/descriptions-081-160.json',
  'design/current/monsters/descriptions-161-238.json',
]
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))
const OUT = outputArg
  ? path.resolve(ROOT, outputArg.slice('--output='.length))
  : path.join(ROOT, 'artifacts/monster-art-repair-briefs.json')

const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
const descriptions = SHARDS.flatMap((relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8')))
const byId = new Map(descriptions.map((row) => [row.speciesId, row]))
const queues = {
  lowResolutionRemakePriority: baseline.lowResolutionRemakePriority,
  normalizeReviewAfterVisualCheck: baseline.normalizeReviewAfterVisualCheck,
  backgroundRepairReview: baseline.backgroundRepairReview,
}

const wanted = new Set(Object.values(queues).flat())
const briefs = {}
for (const speciesId of [...wanted].sort()) {
  const row = byId.get(speciesId)
  if (!row) throw new Error(`CURRENT description missing for ${speciesId}`)
  briefs[speciesId] = {
    speciesId,
    no: row.no,
    name: row.name,
    familyNo: row.familyNo,
    stage: row.stage,
    type: row.type,
    motif: row.motif,
    familyConcept: row.familyConcept,
    personalityArcContext: row.personalityArcContext,
    description: row.description,
    graphicCore: row.graphicCore,
    expressionAndPose: row.expressionAndPose,
    silhouette: row.silhouette,
  }
}

const out = {
  schemaVersion: 1,
  source: {
    baseline: 'design/rebuild/asset-production/visual-audit/223-baseline.json',
    descriptionShards: SHARDS,
  },
  queues,
  briefs,
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`)
console.log(`repair briefs: ${Object.keys(briefs).length} species -> ${path.relative(ROOT, OUT)}`)
