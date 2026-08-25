import fs from 'node:fs'

const path = 'scripts/apply-mockup-ui-v3.mjs'
let source = fs.readFileSync(path, 'utf8')
const replacements = [
  ["dailyCompleted ? '🎉 ミッション クリア！' : `あと ${leftTasks} きょうか！`", "dailyCompleted ? '🎉 ミッション クリア！' : 'あと ' + leftTasks + ' きょうか！'"],
  ["evolutionLeft != null ? `あと ${evolutionLeft}Lvで ${nextEvolution.name}` : `つぎは ${nextEvolution.name}`", "evolutionLeft != null ? 'あと ' + evolutionLeft + 'Lvで ' + nextEvolution.name : 'つぎは ' + nextEvolution.name"]
]
for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error('repair target not found: ' + before)
  source = source.replace(before, after)
}
fs.writeFileSync(path, source)
console.log('Repaired mockup applicator templates')
