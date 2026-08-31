import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { CHANGE_PLAN_SCHEMA } from '../scripts/monster-art/formal-replacement.mjs'
import { verifyMonsterArtPrScope } from '../scripts/monster-art/verify-pr-scope.mjs'

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')
const git = (root, args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()

function fakeWebP(fill = 0x41, size = 96) {
  const buffer = Buffer.alloc(size, fill)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WEBP', 8, 'ascii')
  return buffer
}

function writeJson(root, relative, value) {
  const filePath = path.join(root, relative)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function initRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-pr-scope-'))
  git(root, ['init'])
  git(root, ['config', 'user.email', 'test@example.com'])
  git(root, ['config', 'user.name', 'test'])

  const oldBytes = fakeWebP(0x31)
  const oldSha = sha256(oldBytes)
  fs.mkdirSync(path.join(root, 'public/monsters'), { recursive: true })
  fs.writeFileSync(path.join(root, 'public/monsters/m001.webp'), oldBytes)
  fs.writeFileSync(path.join(root, 'public/monsters/m002.webp'), fakeWebP(0x32))
  const m002Sha = sha256(path.join(root, 'public/monsters/m002.webp'))
  writeJson(root, 'design/current/monster-asset-manifest.json', {
    counts: { FORMAL: 2, CANDIDATE: 0, PLACEHOLDER: 0 },
    assets: {
      m001: { state: 'FORMAL', formalAsset: '/monsters/m001.webp', formalSha256: oldSha, approvalEvidence: { source: 'base' } },
      m002: { state: 'FORMAL', formalAsset: '/monsters/m002.webp', formalSha256: m002Sha, approvalEvidence: { source: 'base' } },
    },
  })
  writeJson(root, 'public/monster-asset-revisions.json', {
    assets: {
      m001: { state: 'FORMAL', url: '/monsters/m001.webp', revision: `sha256-${oldSha}` },
      m002: { state: 'FORMAL', url: '/monsters/m002.webp', revision: `sha256-${m002Sha}` },
    },
  })
  writeJson(root, 'design/rebuild/asset-production/candidate-provenance/m001.json', { speciesId: 'm001', events: [{ candidate: { sha256: oldSha } }] })
  writeJson(root, 'design/rebuild/asset-production/candidate-provenance/m002.json', { speciesId: 'm002', events: [{ candidate: { sha256: m002Sha } }] })
  git(root, ['add', '.'])
  git(root, ['commit', '-m', 'base'])
  return { root, baseSha: git(root, ['rev-parse', 'HEAD']), oldSha }
}

function applyPlannedM001(root, baseSha, oldSha) {
  const newBytes = fakeWebP(0x71, 121)
  const newSha = sha256(newBytes)
  fs.writeFileSync(path.join(root, 'public/monsters/m001.webp'), newBytes)
  const history = `design/rebuild/asset-production/candidate-history/m001/${oldSha}.webp`
  fs.mkdirSync(path.dirname(path.join(root, history)), { recursive: true })
  fs.writeFileSync(path.join(root, history), fakeWebP(0x31))
  writeJson(root, 'design/rebuild/asset-production/candidate-provenance/m001.json', { speciesId: 'm001', events: [{ transactionId: 'tx-scope-0001', candidate: { sha256: newSha } }] })

  const manifestPath = path.join(root, 'design/current/monster-asset-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath))
  manifest.assets.m001.formalSha256 = newSha
  manifest.assets.m001.approvalEvidence = { source: 'new' }
  writeJson(root, 'design/current/monster-asset-manifest.json', manifest)

  const revisionsPath = path.join(root, 'public/monster-asset-revisions.json')
  const revisions = JSON.parse(fs.readFileSync(revisionsPath))
  revisions.assets.m001.revision = `sha256-${newSha}`
  writeJson(root, 'public/monster-asset-revisions.json', revisions)

  const planPath = 'design/rebuild/asset-production/change-plans/tx-scope-0001.json'
  writeJson(root, planPath, {
    schema: CHANGE_PLAN_SCHEMA,
    transactionId: 'tx-scope-0001',
    baseHeadSha: baseSha,
    intent: 'REPLACE',
    expectedSpecies: ['m001'],
    species: { m001: { oldSha256: oldSha, expectedCurrentSha256: oldSha, newSha256: newSha } },
    allowedChangedFiles: [
      planPath,
      'design/current/monster-asset-manifest.json',
      'public/monster-asset-revisions.json',
      'public/monsters/m001.webp',
      'design/rebuild/asset-production/candidate-provenance/m001.json',
      history,
    ].sort(),
  })
  git(root, ['add', '.'])
  git(root, ['commit', '-m', 'replace m001'])
  return { newSha }
}

test('PR scope verifier accepts exact planned monster-art transaction', () => {
  const { root, baseSha, oldSha } = initRepo()
  applyPlannedM001(root, baseSha, oldSha)
  const result = verifyMonsterArtPrScope({ root, base: baseSha })
  assert.equal(result.mode, 'VERIFIED_ART_TRANSACTION')
  assert.deepEqual(result.expectedSpecies, ['m001'])
  assert.deepEqual(result.unexpected, [])
})

test('PR scope verifier rejects unrelated monster binary mixed into branch', () => {
  const { root, baseSha, oldSha } = initRepo()
  applyPlannedM001(root, baseSha, oldSha)
  fs.writeFileSync(path.join(root, 'public/monsters/m002.webp'), fakeWebP(0x99, 111))
  git(root, ['add', '.'])
  git(root, ['commit', '-m', 'unexpected m002'])
  assert.throws(() => verifyMonsterArtPrScope({ root, base: baseSha }), /unexpected files|changed monster binaries/)
})

test('PR scope verifier rejects release-state changes without any change plan', () => {
  const { root, baseSha } = initRepo()
  fs.writeFileSync(path.join(root, 'public/monsters/m001.webp'), fakeWebP(0x88, 110))
  git(root, ['add', '.'])
  git(root, ['commit', '-m', 'unplanned art'])
  assert.throws(() => verifyMonsterArtPrScope({ root, base: baseSha }), /without a change plan/)
})
