#!/usr/bin/env node
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { webkit } from '@playwright/test'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PUBLIC = path.join(ROOT, 'public')
const MONSTER_DIR = path.join(PUBLIC, 'monsters')
const IDS = Array.from({ length: 238 }, (_, i) => `m${String(i + 1).padStart(3, '0')}`)

const ALPHA_VISIBLE = 8
const ALPHA_SOLID = 224
const EDGE_BAND = 4

function contentType(filePath) {
  if (filePath.endsWith('.webp')) return 'image/webp'
  if (filePath.endsWith('.svg')) return 'image/svg+xml'
  if (filePath.endsWith('.json')) return 'application/json'
  return 'application/octet-stream'
}

function servePublic() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
      const target = path.normalize(path.join(PUBLIC, pathname))
      if (!target.startsWith(PUBLIC) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
        res.statusCode = 404
        res.end('not found')
        return
      }
      res.setHeader('Content-Type', contentType(target))
      fs.createReadStream(target).pipe(res)
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({ server, origin: `http://127.0.0.1:${address.port}` })
    })
  })
}

function classify(m) {
  if (!m.exists) return 'MISSING'
  if (m.fullyOpaqueCanvas || m.edgeOpaqueRatio >= 0.35 || m.opaqueCornerCount >= 3) return 'REPAIR_REVIEW'
  if (m.visibleHeightRatio < 0.68 || m.visibleWidthRatio < 0.42) return 'NORMALIZE_REVIEW'
  if (Math.abs(m.centerOffsetX) > 0.09 || Math.abs(m.centerOffsetY) > 0.09) return 'NORMALIZE_REVIEW'
  if (m.visibleHeightRatio > 0.94 || m.visibleWidthRatio > 0.94) return 'CROP_RISK_REVIEW'
  return 'PASS_METRICS'
}

async function inspect(page, origin, speciesId) {
  const repoPath = path.join(MONSTER_DIR, `${speciesId}.webp`)
  if (!fs.existsSync(repoPath)) return { speciesId, exists: false, disposition: 'MISSING' }

  const metrics = await page.evaluate(async ({ src, visibleAlpha, solidAlpha, edgeBand }) => {
    const img = new Image()
    img.src = src
    await img.decode()

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const w = canvas.width
    const h = canvas.height

    let minX = w, minY = h, maxX = -1, maxY = -1
    let visible = 0, solid = 0, edgeVisible = 0, edgeSolid = 0
    let weightedX = 0, weightedY = 0, alphaWeight = 0

    const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
    let opaqueCornerCount = 0
    for (const [x, y] of corners) {
      const a = data[(y * w + x) * 4 + 3]
      if (a >= solidAlpha) opaqueCornerCount += 1
    }

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const a = data[(y * w + x) * 4 + 3]
        if (a > visibleAlpha) {
          visible += 1
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
          weightedX += x * a
          weightedY += y * a
          alphaWeight += a
          if (x < edgeBand || x >= w - edgeBand || y < edgeBand || y >= h - edgeBand) edgeVisible += 1
        }
        if (a >= solidAlpha) {
          solid += 1
          if (x < edgeBand || x >= w - edgeBand || y < edgeBand || y >= h - edgeBand) edgeSolid += 1
        }
      }
    }

    const total = w * h
    const edgePixels = total - Math.max(0, w - edgeBand * 2) * Math.max(0, h - edgeBand * 2)
    const bboxWidth = maxX >= minX ? maxX - minX + 1 : 0
    const bboxHeight = maxY >= minY ? maxY - minY + 1 : 0
    const centerX = alphaWeight ? weightedX / alphaWeight : w / 2
    const centerY = alphaWeight ? weightedY / alphaWeight : h / 2

    return {
      width: w,
      height: h,
      visiblePixelRatio: visible / total,
      solidPixelRatio: solid / total,
      visibleWidthRatio: bboxWidth / w,
      visibleHeightRatio: bboxHeight / h,
      bbox: bboxWidth ? { minX, minY, maxX, maxY, width: bboxWidth, height: bboxHeight } : null,
      centerOffsetX: (centerX - w / 2) / w,
      centerOffsetY: (centerY - h / 2) / h,
      edgeVisibleRatio: edgePixels ? edgeVisible / edgePixels : 0,
      edgeOpaqueRatio: edgePixels ? edgeSolid / edgePixels : 0,
      opaqueCornerCount,
      fullyOpaqueCanvas: solid / total > 0.985,
    }
  }, {
    src: `${origin}/monsters/${speciesId}.webp`,
    visibleAlpha: ALPHA_VISIBLE,
    solidAlpha: ALPHA_SOLID,
    edgeBand: EDGE_BAND,
  })

  const result = { speciesId, exists: true, repositoryPath: `public/monsters/${speciesId}.webp`, ...metrics }
  result.disposition = classify(result)
  return result
}

function summarize(rows) {
  const dispositions = {}
  for (const row of rows) dispositions[row.disposition] = (dispositions[row.disposition] ?? 0) + 1
  return {
    totalSpecies: IDS.length,
    webpPresent: rows.filter((r) => r.exists).length,
    missing: rows.filter((r) => !r.exists).length,
    dispositions,
  }
}

async function main() {
  const outputArg = process.argv.find((arg) => arg.startsWith('--output='))
  const outputPath = outputArg
    ? path.resolve(ROOT, outputArg.slice('--output='.length))
    : path.join(ROOT, 'design/rebuild/asset-production/visual-audit/visual-audit.json')

  const { server, origin } = await servePublic()
  const browser = await webkit.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const rows = []
    for (const speciesId of IDS) rows.push(await inspect(page, origin, speciesId))

    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      scope: { firstId: 'm001', lastId: 'm238', speciesCount: 238, excluded: ['m239'] },
      policy: {
        purpose: 'Detection only. This audit never edits, normalizes, repairs, regenerates, promotes, or deploys artwork.',
        alphaVisibleThreshold: ALPHA_VISIBLE,
        alphaSolidThreshold: ALPHA_SOLID,
        edgeBandPixels: EDGE_BAND,
        intendedVisibleHeightGuidance: 'roughly 0.70-0.85; use family/silhouette review rather than a hard production gate',
      },
      summary: summarize(rows),
      assets: Object.fromEntries(rows.map((row) => [row.speciesId, row])),
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
    console.log(JSON.stringify(report.summary, null, 2))
    console.log(`visual audit written: ${path.relative(ROOT, outputPath)}`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
