// ============================================================
// 学習分野（教科）のレジストリ
//
// v4: 学年ごとに 教科が かわる（実際の小学校の教科構成に合わせた）。
//   年長 : よむ / かく / すうじ / せいかつ / どうとく
//   小1-2: こくご(よむ) / かきとり / さんすう / せいかつ / どうとく
//   小3-6: こくご / かきとり / さんすう / りか / しゃかい / どうとく
//   （生活科は小2まで、理科・社会は小3から ＝ 学習指導要領と同じ）
//
// 表示名は学年で変わる（年長「すうじ」→ 小1以上「さんすう」など）。
// generateQuestion(params, reviewKey) は共通のインターフェース。
// ============================================================

import { generateReadingQuestion } from '../data/content/reading.js'
import { generateWritingQuestion } from '../data/content/writing.js'
import { generateNumbersQuestion, isNumbersReviewStale } from '../data/content/numbers.js'
import { generateSeikatsuQuestion } from '../data/content/seikatsu.js'
import { generateRikaQuestion } from '../data/content/rika.js'
import { generateShakaiQuestion } from '../data/content/shakai.js'
import { generateDoutokuQuestion } from '../data/content/doutoku.js'
import { generateEnglishQuestion } from '../data/content/english.js'

function englishProgressEntry(params, itemKey) {
  const key = String(itemKey || '')
  if (key.startsWith('enw:')) return params?.englishWordStats?.[key.slice(4)] || null
  if (key.startsWith('ena:')) return params?.englishAlphabetStats?.[key.slice(4)] || null
  if (key.startsWith('enp:')) return params?.englishPhraseStats?.[key.slice(4)] || null
  if (key.startsWith('eng:')) return params?.englishPhraseStats?.[key.slice(4)] || null
  return null
}

// English has its own SRS/mastery store. Freeze the A+ semantic provenance at
// question generation/presentation time, while the pre-answer state is still
// authoritative. Reward settlement must never re-infer this from mutated stats.
function generateEnglishQuestionWithPresentationProvenance(params = {}, reviewKey) {
  const question = generateEnglishQuestion(params, reviewKey)
  if (!question || String(question.itemKey || '').startsWith('hard:')) return question
  const entry = englishProgressEntry(params, question.itemKey)
  if (!entry) return question
  const today = Number(params.today)
  const masteredAtPresentation = Number(entry.stage) >= 5
  const dueAtPresentation = Number.isFinite(today) && Number(entry.nextDue) <= today
  return {
    ...question,
    englishLearningIntentAtPresentation: dueAtPresentation ? 'srs_due' : 'adaptive',
    englishMasteredAtPresentation: masteredAtPresentation,
    englishTicketQualifyingAtPresentation: dueAtPresentation || !masteredAtPresentation
  }
}

export const DOMAINS = [
  {
    id: 'yomu',
    name: 'よむ',
    nameByGrade: (g) => (g >= 1 ? 'こくご' : 'よむ'),
    emoji: '📖',
    color: 'linear-gradient(180deg,#8bf7d8,#46c9a6)',
    available: true,
    grades: [0, 1, 2, 3, 4, 5, 6],
    generateQuestion: generateReadingQuestion
  },
  {
    id: 'kaku',
    name: 'かく',
    nameByGrade: (g) => (g >= 1 ? 'かきとり' : 'かく'),
    emoji: '✏️',
    color: 'linear-gradient(180deg,#ffa9c5,#ff7aa6)',
    available: true,
    grades: [0, 1, 2, 3, 4, 5, 6],
    generateQuestion: generateWritingQuestion
  },
  {
    id: 'suuji',
    name: 'すうじ',
    nameByGrade: (g) => (g >= 1 ? 'さんすう' : 'すうじ'),
    emoji: '🔢',
    color: 'linear-gradient(180deg,#ffe08a,#ffb84d)',
    available: true,
    grades: [0, 1, 2, 3, 4, 5, 6],
    generateQuestion: generateNumbersQuestion,
    // 2学年以上前の出題タイプ（例: 小2の九九）は、いまの学年には相応しくない
    // ため、期限が来ていても復習の候補から外す（他分野は語彙・知識なので対象外）。
    isReviewStale: isNumbersReviewStale
  },
  {
    id: 'seikatsu',
    name: 'せいかつ',
    nameByGrade: () => 'せいかつ',
    emoji: '📅',
    color: 'linear-gradient(180deg,#b7f0a8,#6fd35f)',
    available: true,
    grades: [0, 1, 2], // 生活科は小2まで（日づけ・とけい・きせつ）
    generateQuestion: generateSeikatsuQuestion
  },
  {
    id: 'rika',
    name: 'りか',
    nameByGrade: () => 'りか',
    emoji: '🔬',
    color: 'linear-gradient(180deg,#a8e6ff,#4fb8e8)',
    available: true,
    grades: [3, 4, 5, 6], // 理科は小3から
    generateQuestion: generateRikaQuestion
  },
  {
    id: 'shakai',
    name: 'しゃかい',
    nameByGrade: () => 'しゃかい',
    emoji: '🗾',
    color: 'linear-gradient(180deg,#ffcf9e,#f0954f)',
    available: true,
    grades: [3, 4, 5, 6], // 社会は小3から
    generateQuestion: generateShakaiQuestion
  },
  {
    id: 'doutoku',
    name: 'どうとく',
    nameByGrade: () => 'どうとく',
    emoji: '💗',
    color: 'linear-gradient(180deg,#f2b8f5,#c46fd8)',
    available: true,
    grades: [0, 1, 2, 3, 4, 5, 6],
    generateQuestion: generateDoutokuQuestion
  },
  {
    id: 'english', name: 'えいご', nameByGrade: () => 'えいご', emoji: '🔤',
    color: 'linear-gradient(180deg,#9edbff,#5f9df5)', available: true,
    grades: [0, 1, 2, 3, 4, 5, 6], generateQuestion: generateEnglishQuestionWithPresentationProvenance
  }
]

export const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map((d) => [d.id, d]))

/** その学年で ならう教科 */
export function domainsForGrade(grade = 0) {
  return DOMAINS.filter((d) => d.available && d.grades.includes(grade))
}

/** 学年に応じた教科名 */
export function domainName(domain, grade = 0) {
  if (!domain) return ''
  return domain.nameByGrade ? domain.nameByGrade(grade) : domain.name
}

// 旧API互換（学年を問わない全教科）
export function availableDomains() {
  return DOMAINS.filter((d) => d.available)
}
