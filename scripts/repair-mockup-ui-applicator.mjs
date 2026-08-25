import fs from 'node:fs'

// One-shot repair executed before the applicator so generated JSX and design-index edits fit current main.
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

const designBlock = "replaceOnce(\n  'design/00-README.md',\n  `- \\`design/20-world-map-evolution-progression.md\\``,\n  `- \\`design/20-world-map-evolution-progression.md\\`\\n- \\`design/21-mockup-ui-visual-system.md\\``,\n  'design index link'\n)"
const designReplacement = "append('design/00-README.md', '\\n\\n## UIビジュアル正本\\n\\n- `design/21-mockup-ui-visual-system.md` — 承認済みモックアップを基準にした現行UI\\n')"
if (!source.includes(designBlock)) throw new Error('design index applicator block not found')
source = source.replace(designBlock, designReplacement)

fs.writeFileSync(path, source)
console.log('Repaired mockup applicator templates and design index update')
