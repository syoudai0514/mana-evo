import fs from 'node:fs'
import { execSync } from 'node:child_process'

const path = 'scripts/apply-progression-review-fixes.mjs'
let source = fs.readFileSync(path, 'utf8')

const replacements = [
  ["locked ? `${'${progress.previousZoneName}'} あと${'${progress.remaining}'}かい` : danger", "locked ? progress.previousZoneName + ' あと' + progress.remaining + 'かい' : danger"],
  ['元CSV値は `evolution.originalLevel` としてruntime監査可能にする。', "元CSV値は 'evolution.originalLevel' としてruntime監査可能にする。"],
  ['第2形態の奥地野生解禁は `dex.caught` ではなく `evolutionDiscoveries` を正とする。`evolveInstance()` 成功時', "第2形態の奥地野生解禁は 'dex.caught' ではなく 'evolutionDiscoveries' を正とする。'evolveInstance()' 成功時"],
  ['`adventureLocation = { area, zoneId }` をプロフィール別ゲームセーブへ保存する。', "'adventureLocation = { area, zoneId }' をプロフィール別ゲームセーブへ保存する。"],
  ["`${'${species.id}'} evo ${'${species.evolution.level}'} vs wild max ${'${stage.maxEnemyLevel}'}`", "species.id + ' evo ' + species.evolution.level + ' vs wild max ' + stage.maxEnemyLevel"],
  ["`${'${species.id}'}`", 'species.id'],
  ['const zoneIndex = Number(monster.no) % Math.min(2, zoneMaxes.length)', 'const zoneIndex = (Math.max(1, Number(monster.no)) - 1) % Math.min(2, zoneMaxes.length)']
]

for (const [bad, good] of replacements) {
  if (!source.includes(bad)) throw new Error(`problematic template not found: ${bad.slice(0, 60)}`)
  source = source.replace(bad, good)
}
fs.writeFileSync(path, source)

// Keep No.001 and the odd-numbered first forms on the entrance side of each area.
const worldPath = 'src/game/worldProgression.js'
let world = fs.readFileSync(worldPath, 'utf8')
const oldZone = 'return earlyZones[numberOf(species) % earlyZones.length]'
const newZone = 'return earlyZones[(Math.max(1, numberOf(species)) - 1) % earlyZones.length]'
if (!world.includes(oldZone)) throw new Error('world entry-zone assignment target not found')
world = world.replace(oldZone, newZone)
fs.writeFileSync(worldPath, world)

// Restore the canonical existing game tests, then update only the intentional save-version assertion.
execSync('git checkout origin/main -- tests/game.test.js')
const gameTestPath = 'tests/game.test.js'
let gameTest = fs.readFileSync(gameTestPath, 'utf8')
if (!gameTest.includes('assert.equal(CURRENT_GAME_VERSION, 8)')) throw new Error('save version assertion not found')
gameTest = gameTest.replace('assert.equal(CURRENT_GAME_VERSION, 8)', 'assert.equal(CURRENT_GAME_VERSION, 9)')
fs.writeFileSync(gameTestPath, gameTest)

// Update the pre-existing world test to assert self-evolution discovery instead of mere ownership,
// while opening the route to the moved deep-zone encounter.
const worldTestPath = 'tests/world-progression.test.js'
let worldTest = fs.readFileSync(worldTestPath, 'utf8')
if (!worldTest.includes('assert.equal(stage.requiresOwnedSpeciesId, stage.enemySpeciesId)')) throw new Error('old ownership assertion not found')
worldTest = worldTest.replace(
  'assert.equal(stage.requiresOwnedSpeciesId, stage.enemySpeciesId)',
  'assert.equal(stage.requiresEvolutionDiscoverySpeciesId, stage.enemySpeciesId)'
)
const oldSetup = "  game.stagesCleared = ['a1-boss', 'a2-boss']\n  assert.equal(isStageUnlocked(game, stage), false)"
const newSetup = "  game.stagesCleared = ['a1-boss', 'a2-boss']\n  for (const zoneId of ['coast', 'frost', 'city', 'skyway']) {\n    const route = STAGES.filter((entry) => entry.kind === 'wild' && entry.adventureArea === stage.adventureArea && entry.zoneId === zoneId).slice(0, 2)\n    if (route.length === 2) game.stagesCleared.push(...route.map((entry) => entry.id))\n  }\n  assert.equal(isStageUnlocked(game, stage), false)"
if (!worldTest.includes(oldSetup)) throw new Error('world route setup target not found')
worldTest = worldTest.replace(oldSetup, newSetup)
worldTest = worldTest.replace(
  '  assert.equal(evolved.game.dex.caught[stage.enemySpeciesId], true)\n  assert.equal(isStageUnlocked(evolved.game, stage), true)',
  '  assert.equal(evolved.game.dex.caught[stage.enemySpeciesId], true)\n  assert.equal(evolved.game.evolutionDiscoveries[stage.enemySpeciesId], true)\n  assert.equal(isStageUnlocked(evolved.game, stage), true)'
)
fs.writeFileSync(worldTestPath, worldTest)

console.log('Repaired applicator and progression fixtures')
