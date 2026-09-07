import test from 'node:test'
import assert from 'node:assert/strict'
import { SPECIES, STAGES, pickDailyEncounterStages, speciesOf } from '../src/game/content.js'

test('D-031 retires evolved wild forms in place and exposes them only through training after discovery', () => {
  const evolvedWild = STAGES.find((stage) => stage.kind === 'wild' && stage.area === 1 && speciesOf(stage.enemySpeciesId)?.stage === 2)
  assert.ok(evolvedWild)
  assert.equal(evolvedWild.adventureArea, 1)
  assert.equal(evolvedWild.hidden, true)
  assert.equal(evolvedWild.captureDisabled, true)
  assert.equal(evolvedWild.retiredEvolvedWild, true)

  const training = STAGES.find((stage) => stage.kind === 'training' && stage.enemySpeciesId === evolvedWild.enemySpeciesId)
  assert.ok(training)
  assert.equal(training.adventureArea, 1)
  assert.equal(training.captureDisabled, true)
  assert.equal(training.requiresEvolutionDiscoverySpeciesId, evolvedWild.enemySpeciesId)

  const area1First = STAGES.find((stage) => stage.kind === 'wild' && !stage.deepRematch && stage.area === 1 && speciesOf(stage.enemySpeciesId)?.stage === 1)
  assert.ok(area1First)
  assert.equal(area1First.adventureArea, 1)
  assert.equal(area1First.hidden, undefined)
})

test('area1 and area2 normal visible wild pools contain no evolved forms', () => {
  for (const adventureArea of [1, 2]) {
    const evolved = STAGES.filter((stage) => stage.kind === 'wild' && !stage.hidden && stage.adventureArea === adventureArea && (speciesOf(stage.enemySpeciesId)?.stage || 1) > 1)
    assert.equal(evolved.length, 0)
  }
})

test('daily encounter picker is deterministic, capped, and prioritizes useful choices', () => {
  const stages = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, enemySpeciesId: `m${i}` }))
  const options = {
    day: 12345,
    limit: 5,
    isUnlocked: (stage) => !['s0', 's1'].includes(stage.id),
    isCaught: (stage) => ['s2', 's3'].includes(stage.id),
    isCleared: (stage) => ['s4'].includes(stage.id)
  }
  const first = pickDailyEncounterStages(stages, options)
  const second = pickDailyEncounterStages(stages, options)
  assert.equal(first.length, 5)
  assert.deepEqual(first.map((stage) => stage.id), second.map((stage) => stage.id))
  assert.ok(first.every((stage) => !['s0', 's1'].includes(stage.id)))
  assert.ok(first.some((stage) => !['s2', 's3', 's4'].includes(stage.id)))
})

test('all 238 species remain in the content master after D-031 route changes', () => {
  assert.equal(Object.keys(SPECIES).length, 238)
})
