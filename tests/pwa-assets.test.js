import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Keep the exact PWA icon files, canonical launch URL and dimensions under CI.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'))
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
const main = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8')
const canonicalUrl = 'https://syoudai0514.github.io/mana-evo/'

function publicAsset(relativePath) {
  return path.join(root, 'public', relativePath)
}

function pngDimensions(file) {
  const png = fs.readFileSync(file)
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${file} must be PNG`)
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

test('iOS touch icon references the dedicated attached-artwork PNG', () => {
  const match = index.match(/rel="apple-touch-icon"[^>]*sizes="180x180"[^>]*href="%BASE_URL%([^\"]+)"/)
  assert.ok(match, '180x180 apple-touch-icon link is required')
  assert.equal(match[1], 'icons/apple-touch-icon.png')
  const file = publicAsset(match[1])
  assert.ok(fs.existsSync(file), `missing apple touch icon: ${match[1]}`)
  assert.deepEqual(pngDimensions(file), [180, 180])
})

test('PWA icons have the required PNG dimensions', () => {
  assert.deepEqual(pngDimensions(publicAsset('icons/icon-192.png')), [192, 192])
  assert.deepEqual(pngDimensions(publicAsset('icons/icon-512.png')), [512, 512])
})

test('manifest is pinned to the full canonical GitHub Pages app URL', () => {
  for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], canonicalUrl)
  assert.match(index, /rel="canonical" href="https:\/\/syoudai0514\.github\.io\/mana-evo\/"/)
  assert.match(index, /property="og:url" content="https:\/\/syoudai0514\.github\.io\/mana-evo\/"/)
  assert.match(main, /CANONICAL_PATH = '\/mana-evo\/'/)
  assert.match(main, /location\.replace/)
})

test('service worker precache only references existing public assets', () => {
  for (const match of sw.matchAll(/new URL\('([^']+)'\s*,\s*BASE_URL\)/g)) {
    const relativePath = match[1]
    assert.ok(fs.existsSync(publicAsset(relativePath)), `service worker precache asset is missing: ${relativePath}`)
  }
  assert.match(sw, /CACHE_NAME = `\$\{CACHE_PREFIX\}v7`/)
  assert.match(sw, /icons\/apple-touch-icon\.png/)
})
