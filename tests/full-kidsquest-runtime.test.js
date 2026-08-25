import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildCoreMission, buildExtraTask, buildFreeTask } from '../src/kids-quest-study/engine/missions.js'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('runtime uses the authentic Kids Quest learning screens instead of simplified study engine', () => {
  const app = read('src/App.jsx')
  for (const screen of ['ActivityPlayer','FreeStudyScreen','ReviewScreen','ChapterTestScreen','EnglishDictionaryScreen']) {
    assert.match(app, new RegExp(`kids-quest-study/.+${screen}`), screen)
  }
  assert.match(app, /parent\/ParentGate\.jsx/)
  assert.match(read('src/parent/ParentGate.jsx'), /kids-quest-study\/screens\/ParentScreen\.jsx/)
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

test('child learning hub cannot change grade, ahead-grade unlock or hard mode', () => {
  const app = read('src/App.jsx')
  const start = app.indexOf('function StudyHub')
  const end = app.indexOf('export default function App')
  const studyHub = app.slice(start, end)
  assert.ok(start >= 0 && end > start)
  assert.doesNotMatch(studyHub, /SET_GRADE/)
  assert.doesNotMatch(studyHub, /FORCE_GRADE_MAX/)
  assert.doesNotMatch(studyHub, /LOWER_GRADE_MAX/)
  assert.doesNotMatch(studyHub, /SET_MIN_SELECTABLE_GRADE/)
  assert.doesNotMatch(studyHub, /grade-picker/)
  assert.doesNotMatch(studyHub, /parent-link/)
  assert.match(studyHub, /study-grade-locked/)
  assert.match(studyHub, /おうちのひとが きめるよ/)
})

test('parent controls are discoverable from home and protected by a four digit PIN gate', () => {
  const app = read('src/App.jsx')
  const gate = read('src/parent/ParentGate.jsx')
  const parent = read('src/kids-quest-study/screens/ParentScreen.jsx')
  assert.match(app, /parent-home-card/)
  assert.match(app, /学年・先取り・むずかしさ・つくよみちゃん設定/)
  assert.match(gate, /mana-evo-parent-pin-v1/)
  assert.match(gate, /\^\\d\{4\}\$/)
  assert.match(gate, /おとなの かくにん/)
  assert.match(parent, /type:'SET_GRADE'/)
  assert.match(parent, /type:'FORCE_GRADE_MAX'/)
  assert.match(parent, /type:'LOWER_GRADE_MAX'/)
  assert.match(parent, /parent-voice/)
  assert.match(parent, /つくよみちゃんを使う場合は/)
  assert.match(parent, /子ども画面からは変更できません/)
})

test('learning focus screens do not stack the ManaEvo header over the Kids Quest header', () => {
  const app = read('src/App.jsx')
  const css = read('src/parent-controls.css')
  assert.match(app, /focusView=\['activity','free','review','trial','dictionary','parent'\]/)
  assert.match(app, /!focusView && <header(?:\s+[^>]*)?>/)
  assert.match(css, /\.app-shell--focus \.topbar\.app-header\{top:0/)
  assert.match(css, /\.app-shell--focus>\.screen\{padding:0 0 28px/)
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
