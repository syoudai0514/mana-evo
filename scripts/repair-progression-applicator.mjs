import fs from 'node:fs'
const path = 'scripts/apply-progression-review-fixes.mjs'
let source = fs.readFileSync(path, 'utf8')
const bad = "locked ? `${'${progress.previousZoneName}'} あと${'${progress.remaining}'}かい` : danger"
const good = "locked ? progress.previousZoneName + ' あと' + progress.remaining + 'かい' : danger"
if (!source.includes(bad)) throw new Error('problematic nested template not found')
source = source.replace(bad, good)
fs.writeFileSync(path, source)
console.log('Repaired applicator quoting')
