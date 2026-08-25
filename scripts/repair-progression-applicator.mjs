import fs from 'node:fs'
const path = 'scripts/apply-progression-review-fixes.mjs'
let source = fs.readFileSync(path, 'utf8')

const replacements = [
  ["locked ? `${'${progress.previousZoneName}'} あと${'${progress.remaining}'}かい` : danger", "locked ? progress.previousZoneName + ' あと' + progress.remaining + 'かい' : danger"],
  ['元CSV値は `evolution.originalLevel` としてruntime監査可能にする。', "元CSV値は 'evolution.originalLevel' としてruntime監査可能にする。"],
  ['第2形態の奥地野生解禁は `dex.caught` ではなく `evolutionDiscoveries` を正とする。`evolveInstance()` 成功時', "第2形態の奥地野生解禁は 'dex.caught' ではなく 'evolutionDiscoveries' を正とする。'evolveInstance()' 成功時"],
  ['`adventureLocation = { area, zoneId }` をプロフィール別ゲームセーブへ保存する。', "'adventureLocation = { area, zoneId }' をプロフィール別ゲームセーブへ保存する。"],
  ["`${'${species.id}'} evo ${'${species.evolution.level}'} vs wild max ${'${stage.maxEnemyLevel}'}`", "species.id + ' evo ' + species.evolution.level + ' vs wild max ' + stage.maxEnemyLevel"],
  ["`${'${species.id}'}`", 'species.id']
]

for (const [bad, good] of replacements) {
  if (!source.includes(bad)) throw new Error(`problematic template not found: ${bad.slice(0, 60)}`)
  source = source.replace(bad, good)
}

fs.writeFileSync(path, source)
console.log('Repaired applicator quoting')
