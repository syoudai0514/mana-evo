import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  UNNAMED_PROFILE_LABEL,
  isLegacyAutoProfileName,
  profileDisplayName,
  profileEditableName
} from '../src/platform/profileUi.js'
import { profilesForPersistence } from '../src/platform/cloudSnapshot.js'
import { makeCloudPayload, payloadHash } from '../src/platform/cloudSaveModel.js'

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const parentSource = fs.readFileSync(new URL('../src/kids-quest-study/screens/ParentScreen.jsx', import.meta.url), 'utf8')
const navSource = fs.readFileSync(new URL('../src/navigation/AppNavigation.jsx', import.meta.url), 'utf8')
const cssSource = fs.readFileSync(new URL('../src/ui/ux-bundle-a.css', import.meta.url), 'utf8')
const cssDeclarations = cssSource.replace(/\/\*[\s\S]*?\*\//g, '')
const mainSource = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8')
const switcherSource = fs.readFileSync(new URL('../src/platform/ChildProfileSwitcher.jsx', import.meta.url), 'utf8')
const evolutionSource = fs.readFileSync(new URL('../src/game/screens/EvolutionOverlay.jsx', import.meta.url), 'utf8')

test('Bundle A hides legacy automatic adventurer names but preserves real names', () => {
  assert.equal(UNNAMED_PROFILE_LABEL, 'なまえをきめよう')
  for (const value of ['ぼうけんしゃ 1', 'ぼうけんしゃ1', 'ぼうけんしゃ', ' ぼうけんしゃ 12 ']) {
    assert.equal(isLegacyAutoProfileName(value), true, value)
    assert.equal(profileDisplayName({ name: value }), 'なまえをきめよう')
    assert.equal(profileEditableName({ name: value }), '')
  }
  assert.equal(profileDisplayName({ name: 'まさき' }), 'まさき')
  assert.equal(profileEditableName({ name: 'まさき' }), 'まさき')
})

test('Bundle A display placeholder never rewrites the raw profile name used by cloud hashing', () => {
  const childState = { grade: 0, daily: { coreDone: false } }
  const learning = {
    version: 4,
    contentVersion: 16,
    ...childState,
    activeProfileId: 'child-1',
    profiles: {
      'child-1': { name: 'ぼうけんしゃ 1', state: childState }
    }
  }
  const profiles = profilesForPersistence(learning)
  assert.equal(profileDisplayName(profiles['child-1']), 'なまえをきめよう')
  assert.equal(profiles['child-1'].name, 'ぼうけんしゃ 1')

  const rawPayload = makeCloudPayload({
    learning: { version: 4, contentVersion: 16, profiles },
    gameEnvelope: { formatVersion: 2, gameByProfile: { 'child-1': { marker: 'same' } } },
    learningRewardEnvelope: { version: 1, byProfile: {} },
    capturedAt: '2026-09-02T00:00:00.000Z'
  })
  const displayMutatedPayload = structuredClone(rawPayload)
  displayMutatedPayload.learning.profiles['child-1'].name = 'なまえをきめよう'
  assert.notEqual(payloadHash(rawPayload), payloadHash(displayMutatedPayload))
  assert.equal(rawPayload.learning.profiles['child-1'].name, 'ぼうけんしゃ 1')
})

test('Bundle A Home and Study use the approved child-facing hierarchy', () => {
  assert.match(appSource, /まなぶと、<strong>進化<\/strong>する。/)
  assert.match(appSource, /おまかせで まなぶ！/)
  assert.match(appSource, /このがくねんの ゴール/)
  assert.match(appSource, /ほかの まなび/)
  assert.doesNotMatch(appSource, /すきな じゅんばんで えらべるよ/)
  assert.doesNotMatch(appSource, /<details className="study-secondary-modes"/)
  assert.doesNotMatch(appSource, /たんげん/)
  assert.doesNotMatch(appSource, /PICK_CORE_TASK/)
})

test('Bundle A exposes child profile switching while keeping rename and cloud management in Parent', () => {
  assert.match(appSource, /ChildProfileSwitcher/)
  assert.match(appSource, /rememberDeviceProfile/)
  assert.match(parentSource, /RENAME_PROFILE/)
  assert.match(parentSource, /名前を保存/)
  assert.match(parentSource, /クラウド・TESTをひらく/)
  assert.match(parentSource, /openAdultCloudControls/)
})

test('Bundle A profile switching participates in the Evolution acknowledgement interaction lock', () => {
  assert.match(evolutionSource, /setChildProfileSwitchLock\('evolution-acknowledgement', true\)/)
  assert.match(evolutionSource, /setChildProfileSwitchLock\('evolution-acknowledgement', false\)/)
  assert.match(switcherSource, /subscribeChildProfileSwitchLock/)
  assert.match(switcherSource, /effectivelyDisabled = disabled \|\| interactionLocked/)
})

test('Bundle A compacts shared chrome without shrinking tap targets below 44px', () => {
  assert.match(navSource, /game-bottom-nav--compact/)
  assert.match(cssSource, /padding-bottom:calc\(62px \+ var\(--safe-bottom\)\)/)
  assert.match(cssSource, /game-header\.game-header--compact[\s\S]*min-height:calc\(54px \+ var\(--safe-top\)\)/)
  assert.match(cssSource, /game-bottom-nav\.game-bottom-nav--compact button[\s\S]*min-height:46px/)
  assert.match(cssSource, /child-profile-trigger[\s\S]*min-height:44px/)
  assert.doesNotMatch(cssDeclarations, /!\s*important\b/)
})

test('Bundle A does not regress D-020 startup invariants', () => {
  assert.match(mainSource, /navigator\.serviceWorker\.register/)
  assert.doesNotMatch(mainSource, /registration\.update\s*\(/)
  assert.doesNotMatch(mainSource, /MANA_EVO_DEX_ART_REFRESH_MANIFEST/)
})
