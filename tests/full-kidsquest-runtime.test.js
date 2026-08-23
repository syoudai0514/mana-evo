import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildCoreMission, buildExtraTask, buildFreeTask } from '../src/kids-quest-study/engine/missions.js'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('runtime uses the authentic Kids Quest learning screens instead of simplified study engine', () => {
  const app = read('src/App.jsx')
  for (const screen of ['ActivityPlayer','FreeStudyScreen','ReviewScreen','ChapterTestScreen','EnglishDictionaryScreen','ParentScreen']) {
    assert.match(app, new RegExp(`kids-quest-study/.+${screen}`), screen)
  }
  assert.doesNotMatch(app, /from ['"]\.\/study\/engine\.js['"]/)
  assert.doesNotMatch(app, /from ['"]\.\/study\/questions\.js['"]/)
})

test('Kids Quest daily mission remains five tasks with authentic per-subject counts', () => {
  const tasks = buildCoreMission(0, 21000)
  assert.equal(tasks.length, 5)
  assert.equal(tasks.find((task) => task.domainId === 'yomu')?.questionCount, 5)
  assert.equal(tasks.find((task) => task.domainId === 'suuji')?.questionCount, 5)
  for (const task of tasks.filter((task) => !['yomu','suuji','doutoku'].includes(task.domainId))) assert.equal(task.questionCount, 4)
  const moral = tasks.find((task) => task.domainId === 'doutoku')
  if (moral) assert.equal(moral.questionCount, 2)
})

test('free study does not mint tickets and extra challenge stays three questions', () => {
  assert.equal(buildFreeTask('yomu').kind, 'free')
  assert.equal(buildFreeTask('yomu').questionCount, 4)
  const extra = buildExtraTask(0, 0)
  assert.equal(extra.kind, 'extra')
  assert.equal(extra.questionCount, 3)
})

test('full learning state supports SRS, lessons, star trial, grade advancement and parent ahead-grade controls', () => {
  const context = read('src/kids-quest-study/state/GameContext.jsx')
  for (const action of ['ANSWER','CLEAR_TASK','PICK_CORE_TASK','LESSON_SEEN','STAR_TRIAL_RESULT','SET_GRADE','FORCE_GRADE_MAX','LOWER_GRADE_MAX','SET_MIN_SELECTABLE_GRADE','ENGLISH_SPEAKING_DONE']) assert.match(context, new RegExp(`['"]${action}['"]`), action)
  for (const field of ['unitStats','writingStats','englishWordStats','englishPhraseStats','starTrials','lessonSeen','domainAccuracy','srs']) assert.match(context, new RegExp(field), field)
})

test('Tsukuyomi narrator runtime is installed, selectable and uses the Kids Quest offline model pipeline', () => {
  const tts = read('src/kids-quest-study/engine/tts.js')
  const parent = read('src/kids-quest-study/screens/ParentScreen.jsx')
  const pkg = JSON.parse(read('package.json'))
  assert.match(tts, /つくよみちゃん（自然な日本語版）/)
  assert.match(tts, /import\('piper-plus'\)/)
  assert.match(tts, /import\('onnxruntime-web\/wasm'\)/)
  assert.match(parent, /つくよみちゃんを端末に保存/)
  assert.equal(pkg.dependencies['piper-plus'], '^0.6.0')
  assert.equal(pkg.dependencies['onnxruntime-web'], '^1.24.3')
  assert.equal(pkg.scripts.postinstall, 'patch-package')
  assert.ok(fs.existsSync(new URL('../patches/piper-plus+0.6.0.patch', import.meta.url)))
})
