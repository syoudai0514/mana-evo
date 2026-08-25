import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const growthFiles = [
  '13a-monster-growth-area1.csv',
  '13b-monster-growth-area2-part1.csv',
  '13b-monster-growth-area2-part2.csv',
  '13c-monster-growth-area3-part1.csv',
  '13c-monster-growth-area3-part2.csv',
  '13d-monster-growth-area4-part1.csv',
  '13d-monster-growth-area4-part2.csv'
]

const evolutionFiles = [
  '14a-evolution-balance-area1.csv',
  '14b-evolution-balance-area2.csv',
  '14c-evolution-balance-area3.csv',
  '14d-evolution-balance-area4.csv'
]

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''))
    rows.push(row)
  }
  const [header, ...body] = rows.filter((entry) => entry.some((value) => value !== ''))
  return body.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ''])))
}

function readDesignCsv(name) {
  return parseCsv(readFileSync(new URL(`../design/${name}`, import.meta.url), 'utf8'))
}

const growth = growthFiles.flatMap(readDesignCsv)
const evolutions = evolutionFiles.flatMap(readDesignCsv)

const rarityRank = { common: 1, rare: 2, epic: 3, legend: 4 }
const bool = (value) => String(value).toLowerCase() === 'true'
const transitionKey = (row) => `${Number(row.fromNo)}-${Number(row.toNo)}`

function roleSemanticIssue(row) {
  const role = row.combatRoleV2
  const hp = Number(row.baseHP)
  const attack = Number(row.baseAttack)
  const defense = Number(row.baseDefense)
  const speed = Number(row.baseSpeed)
  const bst = Number(row.BST)
  if (role === 'fastGlass') return !(speed > defense && defense / bst <= 0.22)
  if (role === 'slowPower') return speed !== Math.min(hp, attack, defense, speed)
  if (role === 'hpTank') return hp < defense
  if (role === 'defenseTank') return defense < attack
  if (role === 'guard') return defense < speed
  return false
}

test('PR15 growth master is exactly No.001-238, 83 families and 18 types', () => {
  assert.equal(growth.length, 238)
  const numbers = growth.map((row) => Number(row.No)).sort((a, b) => a - b)
  assert.deepEqual(numbers, Array.from({ length: 238 }, (_, i) => i + 1))
  assert.equal(new Set(growth.map((row) => row.id)).size, 238)
  assert.equal(new Set(growth.map((row) => row.familyNo)).size, 83)
  assert.equal(new Set(growth.map((row) => row.typeId)).size, 18)
  assert.equal(growth.some((row) => Number(row.No) === 239 || row.id === 'm239'), false)
})

test('all 238 catchRank values follow each form own catchRarity plus stage offset', () => {
  for (const row of growth) {
    const expected = Math.min(5, rarityRank[row.catchRarity] + (Number(row.stage) - 1))
    assert.equal(Number(row.catchRank), expected, `No.${row.No} ${row.name}`)
  }
})

test('special-form allocation is 12 giga plus 8 burst with no overlap and canonical No.142', () => {
  const giga = growth.filter((row) => bool(row.gigaEligible))
  const burst = growth.filter((row) => bool(row.burstEligible))
  assert.equal(giga.length, 12)
  assert.equal(burst.length, 8)
  const gigaIds = new Set(giga.map((row) => row.id))
  assert.equal(burst.some((row) => gigaIds.has(row.id)), false)
  const no142 = growth.find((row) => Number(row.No) === 142)
  assert.equal(no142.id, 'm142')
  assert.equal(no142.name, 'ヘラクレオン')
  assert.equal(bool(no142.burstEligible), true)
})

test('155 evolution transitions stay 123 level / 21 stone / 11 held-item-levelup and never reduce base stats', () => {
  assert.equal(evolutions.length, 155)
  const counts = Object.fromEntries(['level', 'stone', 'held_item_levelup'].map((method) => [method, evolutions.filter((row) => row.method === method).length]))
  assert.deepEqual(counts, { level: 123, stone: 21, held_item_levelup: 11 })
  for (const row of evolutions) {
    assert.equal(bool(row.nonDecrease), true, transitionKey(row))
    for (const field of ['deltaBaseHP', 'deltaBaseAttack', 'deltaBaseDefense', 'deltaBaseSpeed']) {
      assert.ok(Number(row[field]) >= 0, `${transitionKey(row)} ${field}`)
    }
  }
})

test('all held-item evolutions have no fixed level and explicitly trigger on the next actual level-up', () => {
  const held = evolutions.filter((row) => row.method === 'held_item_levelup')
  assert.equal(held.length, 11)
  for (const row of held) {
    assert.ok(row.param, transitionKey(row))
    assert.match(row.triggerRule, /次のLvUP時に進化Ready/)
    assert.doesNotMatch(row.triggerRule, /Lv\.\d+到達/)
  }
})

test('all 32 item evolutions retain canonical item parameters without making transition trials authoritative', () => {
  const itemEvolutions = evolutions.filter((row) => row.method !== 'level')
  assert.equal(itemEvolutions.length, 32)
  for (const evo of itemEvolutions) {
    assert.ok(evo.param, transitionKey(evo))
    assert.ok(['stone', 'held_item_levelup'].includes(evo.method), transitionKey(evo))
    assert.ok(Number(evo.area) >= 1 && Number(evo.area) <= 4, transitionKey(evo))
  }
  assert.equal(new Set(itemEvolutions.map(transitionKey)).size, 32)
})

test('role semantic validator flags No.142 instead of treating fastGlass metadata as runtime truth', () => {
  const no142 = growth.find((row) => Number(row.No) === 142)
  assert.equal(no142.combatRoleV2, 'fastGlass')
  assert.equal(roleSemanticIssue(no142), true)
  assert.ok(Number(no142.baseDefense) > Number(no142.baseSpeed))
})
