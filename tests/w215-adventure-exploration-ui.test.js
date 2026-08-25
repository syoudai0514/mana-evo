import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createGameState } from '../src/game/progression.js'
import { EVOLUTION_ITEM_RATE, eligibleEvolutionItemsForArea } from '../src/game/explorationDomain.js'
import { explorationStatusForGame, performGameExploration } from '../src/game/sharedRuntime.js'

const source = fs.readFileSync('src/game/screens/AdventureScreen.jsx', 'utf8')

function sequenceRng(values) {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]
}

test('Adventure delegates canonical exploration to the shared runtime', () => {
  assert.match(source, /explorationStatusForGame/)
  assert.match(source, /performGameExploration/)
  assert.equal(source.includes('Math.random'), false)
  assert.equal(source.includes('EVOLUTION_ITEM_RATE'), false)

  const base = createGameState()
  base.explorePoint = 10
  base.explorationPityMissesByArea = { 1: 0 }
  const status = explorationStatusForGame(base, 1)
  assert.equal(status.cost, 5)
  assert.equal(status.points, 10)
  assert.equal(status.canExplore, true)

  const material = performGameExploration(base, { areaId: 1, rng: () => EVOLUTION_ITEM_RATE + 0.01 })
  assert.equal(material.ok, true)
  assert.equal(material.result.kind, 'material')
  assert.equal(material.game.explorePoint, 5)
  assert.equal(material.game.explorationPityMissesByArea[1], 1)

  const item = performGameExploration(base, { areaId: 1, rng: sequenceRng([EVOLUTION_ITEM_RATE - 0.01, 0]) })
  assert.equal(item.ok, true)
  assert.equal(item.result.kind, 'evolution_item')
  assert.equal(item.game.explorePoint, 5)
  assert.ok(eligibleEvolutionItemsForArea(1).includes(item.result.itemId))
})

test('sixth exploration exposes and accepts only domain-returned regional choices', () => {
  const game = createGameState()
  game.explorePoint = 10
  game.explorationPityMissesByArea = { 1: 5 }
  const status = explorationStatusForGame(game, 1)
  assert.equal(status.pityChoiceRequired, true)
  assert.deepEqual(status.choices, eligibleEvolutionItemsForArea(1))

  const foreignChoice = eligibleEvolutionItemsForArea(2).find((itemId) => !status.choices.includes(itemId))
  assert.ok(foreignChoice)
  const rejected = performGameExploration(game, { areaId: 1, choiceItemId: foreignChoice })
  assert.equal(rejected.ok, false)
  assert.equal(rejected.reason, 'PITY_CHOICE_REQUIRED')
  assert.deepEqual(rejected.choices, status.choices)

  const selected = status.choices[0]
  const accepted = performGameExploration(game, { areaId: 1, choiceItemId: selected })
  assert.equal(accepted.ok, true)
  assert.deepEqual(accepted.result, { kind: 'evolution_item', source: 'pity', itemId: selected })
  assert.equal(accepted.game.explorePoint, 5)
  assert.equal(accepted.game.explorationPityMissesByArea[1], 0)
})

test('Adventure removes superseded trial UI and keeps browse controls progressive', () => {
  assert.equal(source.includes('evolution-trial'), false)
  assert.equal(source.includes('evolutionReward'), false)
  assert.equal(source.includes('minAreaClears'), false)
  assert.equal(source.includes("['evo'"), false)
  assert.equal(source.includes('world-area-tabs'), false)
  assert.equal((source.match(/world-area-route/g) || []).length, 1)
  assert.match(source, /showAll && <section className="encounter-browse-controls"/)
  assert.match(source, /limit: 5/)
})

test('Adventure boss lock copy uses canonical learning progress instead of clear count', () => {
  assert.match(source, /areaBossEligibility/)
  assert.match(source, /まなびポイント あと/)
  assert.match(source, /ちがうスキル あと/)
})
