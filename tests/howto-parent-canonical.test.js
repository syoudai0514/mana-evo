import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('HowTo is topic-based and explains only the CURRENT child loop', () => {
  const howto = read('src/HowToPlay.jsx')

  assert.match(howto, /まなぶ → チケット → ぼうけん → バトル → GET → そだてる → じぶんで シンカ/)
  for (const topic of ['まなび と チケット', 'ぼうけん と たんさく', 'バトル と GET', 'そだてる・シンカ', 'とくべつな すがた']) {
    assert.match(howto, new RegExp(topic))
  }
  assert.match(howto, /なにを しりたい？/)
  assert.match(howto, /しつもんを えらびなおす/)

  assert.doesNotMatch(howto, /シンカしれん/)
  assert.doesNotMatch(howto, /3もん中2もん|2もん できたら/)
  assert.doesNotMatch(howto, /しっぱいすると あいてが 1かい こうげき/)
  assert.doesNotMatch(howto, /スター覚醒|Star Awakening/)
})

test('HowTo explains canonical learning rewards and ticket reservation without stale thresholds', () => {
  const howto = read('src/HowToPlay.jsx')

  assert.match(howto, /5つ ぜんぶ おわると、はじめの 1かいだけ チケット3まい・ほしのわ3こ・たんさくポイント2ポイント/)
  assert.match(howto, /1もん クリアするたびに チケット1まい と たんさくポイント1ポイント/)
  assert.match(howto, /せいかいが 3こ たまるごとに、ほしのわ1こ/)
  assert.match(howto, /じゆうべんきょうは、ちょくせつ チケットを ふやさない/)

  assert.match(howto, /チケットを 1まい あずける/)
  assert.match(howto, /かつか GETできたら その1まいを つかい/)
  assert.match(howto, /まけたり バトルを やめたりしたときは もどってくる/)
})

test('HowTo explains canonical exploration, capture and self-evolution boundaries', () => {
  const howto = read('src/HowToPlay.jsx')

  assert.match(howto, /5ポイント つかうと/)
  assert.match(howto, /ふつうの そざいが 80%、シンカアイテムが 20%/)
  assert.match(howto, /5かい つづけて でなかったら、6かいめ/)
  assert.match(howto, /そのエリアの シンカアイテムを 1こ えらべる/)

  assert.match(howto, /HPが はんぶんいか/)
  assert.match(howto, /さいだい 3かいまで/)
  assert.match(howto, /ほしのわの 1\.2ばい/)
  assert.match(howto, /ほしのわの 1\.5ばい/)
  assert.match(howto, /にじのわ[\s\S]*かならず GET/)
  assert.match(howto, /4つの ほしが 1こずつ ひかって/)

  assert.match(howto, /いしを 1こ つかうと シンカ/)
  assert.match(howto, /「モンスター」で もたせる → そのあと ほんとうに レベルアップすると シンカ/)
  assert.match(howto, /じぶんで シンカさせた すがたは きろくされる/)
  assert.doesNotMatch(howto, /シンカしても そのまま もっている/)
})

test('Parent remains behind the established PIN gate with adult-only controls', () => {
  const gate = read('src/parent/ParentGate.jsx')
  const parent = read('src/kids-quest-study/screens/ParentScreen.jsx')

  assert.match(gate, /mana-evo-parent-pin-v1/)
  assert.match(gate, /\^\\d\{4\}\$/)
  assert.match(gate, /おとなの かくにん/)
  assert.match(gate, /if \(unlocked\) return <ParentScreen onBack=\{exit\}/)
  assert.match(gate, /setUnlocked\(false\)/)

  for (const adultControl of [
    "type:'SET_GRADE'",
    "type:'FORCE_GRADE_MAX'",
    "type:'LOWER_GRADE_MAX'",
    "setSetting('mode'",
    "setSetting('tts'",
    "type:'SWITCH_PROFILE'",
    "type:'CREATE_PROFILE'",
    'serializeForExport',
    'parseImport',
    'importKidsQuestProgress'
  ]) assert.match(parent, new RegExp(adultControl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  assert.match(parent, /子ども画面からは変更できません/)
  assert.match(parent, /Kids Quest側の保存やモンスター・バトル状態は変更しません/)
})

test('Kids Quest import remains one-way and never writes to the Kids Quest source key', () => {
  const importer = read('src/platform/kidsQuestImport.js')

  assert.match(importer, /storage\?\.getItem\(KIDS_QUEST_LEGACY_STORAGE_KEY\)/)
  assert.match(importer, /storage\?\.setItem\(KIDS_QUEST_IMPORT_MARKER_KEY/)
  assert.doesNotMatch(importer, /setItem\(KIDS_QUEST_LEGACY_STORAGE_KEY/)
  assert.doesNotMatch(importer, /removeItem\(KIDS_QUEST_LEGACY_STORAGE_KEY/)
  assert.match(importer, /pendingGameRewards = \[\]/)
})
