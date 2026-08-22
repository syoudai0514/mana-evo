export const SUBJECTS = [
  { id: 'kokugo', label: 'こくご', icon: 'あ' },
  { id: 'sansu', label: 'さんすう', icon: '＋' },
  { id: 'english', label: 'えいご', icon: 'A' },
  { id: 'rika', label: 'りか', icon: '🌱' },
  { id: 'thinking', label: 'しこう', icon: '🧩' }
]

// First vertical slice. The data shape intentionally mirrors Kids Quest's itemKey/unitId model
// so full content can be migrated without changing the Mana Evo progression engine.
export const QUESTIONS = [
  { id: 'k0-1', subject: 'kokugo', grade: 0, unitId: 'reading:0:kana-words', itemKey: 'w:inu', difficulty: 1, prompt: '「いぬ」の はじめの もじは？', choices: ['い', 'ぬ', 'う', 'ね'], answer: 'い', explanation: '「い・ぬ」だから、はじめは「い」だよ。' },
  { id: 'k0-2', subject: 'kokugo', grade: 0, unitId: 'reading:0:kana-words', itemKey: 'w:neko', difficulty: 1, prompt: '「ねこ」と おなじ はじめの おとは？', choices: ['ねずみ', 'いぬ', 'さる', 'くま'], answer: 'ねずみ', explanation: '「ねこ」も「ねずみ」も「ね」から はじまるよ。' },
  { id: 'k0-3', subject: 'kokugo', grade: 0, unitId: 'reading:0:kana-words', itemKey: 'w:small-tsu', difficulty: 2, prompt: 'ちいさい「っ」が はいる ことばは？', choices: ['きって', 'きりん', 'くるま', 'さかな'], answer: 'きって', explanation: '「きって」は「き・っ・て」。ちいさい「っ」が はいるよ。' },
  { id: 'k0-h1', subject: 'kokugo', grade: 0, unitId: 'hard:reading:kana', itemKey: 'hard:w:kana-order', difficulty: 3, hard: true, prompt: '「か・さ・た」を 50おんじゅんに ならべると？', choices: ['か→さ→た', 'さ→か→た', 'た→さ→か', 'か→た→さ'], answer: 'か→さ→た', explanation: 'か行、さ行、た行の じゅんだよ。' },

  { id: 'm0-1', subject: 'sansu', grade: 0, unitId: 'math:make10', itemKey: 'n:make10#1', difficulty: 1, prompt: '6に いくつ たすと 10？', choices: ['2', '3', '4', '5'], answer: '4', explanation: '6 + 4 = 10。10の まとまりを おぼえよう。' },
  { id: 'm0-2', subject: 'sansu', grade: 0, unitId: 'math:add10', itemKey: 'n:add10#1', difficulty: 1, prompt: '7 + 2 = ?', choices: ['8', '9', '10', '11'], answer: '9', explanation: '7から 2つ すすんで 9。' },
  { id: 'm0-3', subject: 'sansu', grade: 0, unitId: 'math:addCarry', itemKey: 'n:addCarry#1', difficulty: 2, prompt: '8 + 5 = ?', choices: ['11', '12', '13', '14'], answer: '13', explanation: '8に2をたして10、のこり3。10+3=13。' },
  { id: 'm0-h1', subject: 'sansu', grade: 0, unitId: 'hard:math:pattern', itemKey: 'hard:n:pattern#1', difficulty: 3, hard: true, prompt: '2, 4, 6, □, 10。□は？', choices: ['7', '8', '9', '12'], answer: '8', explanation: '2ずつ ふえているから 8。' },

  { id: 'e0-1', subject: 'english', grade: 0, unitId: 'english:0:greetings', itemKey: 'e:hello', difficulty: 1, prompt: '“Hello” は どんな ときに いう？', choices: ['あいさつ', 'おやすみ', 'ありがとう', 'ごめんね'], answer: 'あいさつ', explanation: 'Hello は「こんにちは」の あいさつだよ。', speak: 'Hello' },
  { id: 'e0-2', subject: 'english', grade: 0, unitId: 'english:0:colors', itemKey: 'e:red', difficulty: 1, prompt: '“red” は どの いろ？', choices: ['あか', 'あお', 'きいろ', 'みどり'], answer: 'あか', explanation: 'red は「あか」。', speak: 'red' },
  { id: 'e0-3', subject: 'english', grade: 0, unitId: 'english:0:numbers', itemKey: 'e:three', difficulty: 2, prompt: '“three” は いくつ？', choices: ['1', '2', '3', '4'], answer: '3', explanation: 'one, two, three。three は 3。', speak: 'three' },
  { id: 'e0-h1', subject: 'english', grade: 0, unitId: 'hard:english:phrase', itemKey: 'hard:e:how-many', difficulty: 3, hard: true, prompt: '“How many?” に いちばん ちかい いみは？', choices: ['いくつ？', 'だれ？', 'どこ？', 'いつ？'], answer: 'いくつ？', explanation: 'How many? は「いくつ？」と かずを きく ことば。' },

  { id: 'r0-1', subject: 'rika', grade: 0, unitId: 'science:0:plants', itemKey: 'r:plant-water', difficulty: 1, prompt: 'はなが そだつのに ひつような ものは？', choices: ['みず', 'おもちゃ', 'テレビ', 'つみき'], answer: 'みず', explanation: 'しょくぶつは みずや ひかりを つかって そだつよ。' },
  { id: 'r0-2', subject: 'rika', grade: 0, unitId: 'science:0:animals', itemKey: 'r:fish-water', difficulty: 1, prompt: 'さかなが くらす ばしょは？', choices: ['みずの なか', 'そら', 'すなの なか', 'つくえの うえ'], answer: 'みずの なか', explanation: 'さかなは みずの なかで くらすよ。' },
  { id: 'r0-3', subject: 'rika', grade: 0, unitId: 'science:0:seasons', itemKey: 'r:summer', difficulty: 2, prompt: 'いちばん あつく なりやすい きせつは？', choices: ['はる', 'なつ', 'あき', 'ふゆ'], answer: 'なつ', explanation: 'なつは たいようが つよく、あつい日が おおいね。' },
  { id: 'r0-h1', subject: 'rika', grade: 0, unitId: 'hard:science:shadow', itemKey: 'hard:r:shadow', difficulty: 3, hard: true, prompt: 'たいようの ひかりを ものが さえぎると できるものは？', choices: ['かげ', 'あめ', 'かぜ', 'ゆき'], answer: 'かげ', explanation: 'ひかりが さえぎられた ところに かげが できるよ。' },

  { id: 't0-1', subject: 'thinking', grade: 0, unitId: 'thinking:0:pattern', itemKey: 't:pattern-ab', difficulty: 1, prompt: '○ △ ○ △ ○ の つぎは？', choices: ['○', '△', '□', '☆'], answer: '△', explanation: '○と△が こうたいで ならんでいるよ。' },
  { id: 't0-2', subject: 'thinking', grade: 0, unitId: 'thinking:0:classification', itemKey: 't:animal', difficulty: 1, prompt: 'なかまが ちがう ものは？', choices: ['いぬ', 'ねこ', 'うさぎ', 'りんご'], answer: 'りんご', explanation: 'いぬ・ねこ・うさぎは どうぶつ。りんごは くだもの。' },
  { id: 't0-3', subject: 'thinking', grade: 0, unitId: 'thinking:0:logic', itemKey: 't:tall', difficulty: 2, prompt: 'AはBより せがたかい。BはCより せがたかい。いちばん たかいのは？', choices: ['A', 'B', 'C', 'わからない'], answer: 'A', explanation: 'A > B > C だから Aが いちばん たかいよ。' },
  { id: 't0-h1', subject: 'thinking', grade: 0, unitId: 'hard:thinking:two-rules', itemKey: 'hard:t:two-rules', difficulty: 3, hard: true, prompt: 'あかは○、あおは△。あお・あか・あお は？', choices: ['△○△', '○△○', '△△○', '○○△'], answer: '△○△', explanation: '2つの きまりを じゅんばんに あてはめよう。' }
]

export function questionsFor({ subject, grade = 0, hard = false } = {}) {
  return QUESTIONS.filter((q) => (subject ? q.subject === subject : true) && q.grade <= grade && (hard ? q.hard : !q.hard))
}
