import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'))
const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')

function publicAsset(relativePath) {
  return path.join(root, 'public', relativePath)
}

test('iOS touch icon references an existing PNG', () => {
  const match = index.match(/rel="apple-touch-icon"[^>]*href="%BASE_URL%([^\"]+)"/)
  assert.ok(match, 'apple-touch-icon link is required')
  assert.ok(fs.existsSync(publicAsset(match[1])), `missing apple touch icon: ${match[1]}`)
})

test('manifest is pinned to the GitHub Pages subpath', () => {
  for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], '/mana-evo/')
})

test('service worker precache only references existing public assets', () => {
  for (const match of sw.matchAll(/new URL\('([^']+)'\s*,\s*BASE_URL\)/g)) {
    const relativePath = match[1]
    assert.ok(fs.existsSync(publicAsset(relativePath)), `service worker precache asset is missing: ${relativePath}`)
  }
})
