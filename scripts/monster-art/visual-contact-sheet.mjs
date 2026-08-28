#!/usr/bin/env node
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { webkit } from '@playwright/test'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PUBLIC = path.join(ROOT, 'public')
const MONSTERS = path.join(PUBLIC, 'monsters')
const OUTPUT = path.join(ROOT, 'artifacts', 'monster-art-contact-sheets')
const IDS = Array.from({ length: 238 }, (_, i) => `m${String(i + 1).padStart(3, '0')}`)
const PAGE_SIZE = 24

function servePublic() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
      if (pathname === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end('<!doctype html><title>ManaEvo contact sheet</title>')
        return
      }
      const target = path.normalize(path.join(PUBLIC, pathname))
      if (!target.startsWith(PUBLIC) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
        res.statusCode = 404
        res.end('not found')
        return
      }
      res.setHeader('Content-Type', target.endsWith('.webp') ? 'image/webp' : 'application/octet-stream')
      fs.createReadStream(target).pipe(res)
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({ server, origin: `http://127.0.0.1:${address.port}` })
    })
  })
}

function chunks(values, size) {
  const out = []
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size))
  return out
}

async function main() {
  const present = IDS.filter((id) => fs.existsSync(path.join(MONSTERS, `${id}.webp`)))
  fs.mkdirSync(OUTPUT, { recursive: true })

  const { server, origin } = await servePublic()
  const browser = await webkit.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1760 }, deviceScaleFactor: 1 })
    await page.goto(origin)

    let index = 0
    for (const group of chunks(present, PAGE_SIZE)) {
      index += 1
      const cards = group.map((id) => `
        <div class="card">
          <div class="label">${id}</div>
          <div class="checker"><img src="${origin}/monsters/${id}.webp" alt="${id}"></div>
        </div>`).join('')
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #eef3f7; color: #10243a; }
        h1 { margin: 0 0 18px; font-size: 22px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .card { background: white; border: 1px solid #cfd9e2; border-radius: 12px; padding: 10px; }
        .label { font: 700 18px ui-monospace, SFMono-Regular, Menlo, monospace; margin-bottom: 8px; }
        .checker { width: 100%; aspect-ratio: 1; overflow: hidden; border-radius: 8px; background-color: #fff; background-image: linear-gradient(45deg, #dfe4e8 25%, transparent 25%), linear-gradient(-45deg, #dfe4e8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dfe4e8 75%), linear-gradient(-45deg, transparent 75%, #dfe4e8 75%); background-size: 24px 24px; background-position: 0 0, 0 12px, 12px -12px, -12px 0px; }
        img { width: 100%; height: 100%; object-fit: contain; display: block; }
      </style></head><body><h1>ManaEvo candidate visual review — sheet ${String(index).padStart(2, '0')}</h1><div class="grid">${cards}</div></body></html>`
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.screenshot({ path: path.join(OUTPUT, `sheet-${String(index).padStart(2, '0')}.png`), fullPage: true })
    }

    fs.writeFileSync(path.join(OUTPUT, 'index.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), present: present.length, sheets: index, speciesIds: present }, null, 2)}\n`)
    console.log(`contact sheets written: ${index} sheets / ${present.length} candidates`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
