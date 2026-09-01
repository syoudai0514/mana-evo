import test from 'node:test'
import assert from 'node:assert/strict'
import { layoutSurfaceForApp, LAYOUT_SURFACES } from '../src/ui/layoutSurface.js'

const { COMPACT, WORKSPACE, CONTEXTUAL } = LAYOUT_SURFACES

test('D-021 layout surface is independent from navigation ownership', () => {
  assert.equal(layoutSurfaceForApp({ view: 'home' }), COMPACT)
  assert.equal(layoutSurfaceForApp({ view: 'study' }), COMPACT)
  assert.equal(layoutSurfaceForApp({ view: 'adventure' }), COMPACT)
  assert.equal(layoutSurfaceForApp({ view: 'howto' }), COMPACT)

  assert.equal(layoutSurfaceForApp({ view: 'activity' }), WORKSPACE)
  assert.equal(layoutSurfaceForApp({ view: 'free' }), WORKSPACE)
  assert.equal(layoutSurfaceForApp({ view: 'review' }), WORKSPACE)
  assert.equal(layoutSurfaceForApp({ view: 'trial' }), WORKSPACE)
  assert.equal(layoutSurfaceForApp({ view: 'dictionary' }), WORKSPACE)
  assert.equal(layoutSurfaceForApp({ view: 'parent' }), WORKSPACE)

  // Battle remains under the Adventure navigation owner in CURRENT runtime,
  // but its layout surface is contextual as soon as an active battle exists.
  assert.equal(layoutSurfaceForApp({ view: 'adventure', activeBattle: true }), CONTEXTUAL)

  // Dex remains a Monster-local tab, but explicitly owns Workspace presentation.
  assert.equal(layoutSurfaceForApp({ view: 'monsters', monsterSurface: WORKSPACE }), WORKSPACE)
  assert.equal(layoutSurfaceForApp({ view: 'monsters', monsterSurface: COMPACT }), COMPACT)
})
