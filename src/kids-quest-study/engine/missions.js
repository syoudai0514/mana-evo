// ============================================================
// 毎日ミッションの構造
//
//  - コアミッション: 5タスク。国語・算数5問、通常4問、道徳2問
//  - おかわり: コア後の追加タスク。1日 OKAWARI_MAX 回まで（≒最大30分）
//  - 追加問題(extra): 3問。クリアで息抜きバトルの解放チケット
// ============================================================

import { domainsForGrade } from './activities.js'
import { dayNumber } from './srs.js'

export const QUESTIONS_PER_TASK = 4
export const CORE_TASK_COUNT = 5
export const OKAWARI_MAX = 6

let taskSeq = 0
function makeTask(domainId, kind) {
  return {
    uid: `t${Date.now()}_${taskSeq++}`,
    domainId,
    kind,
    questionCount: QUESTIONS_PER_TASK
  }
}

function weeklyDomains(grade, today) {
  const available = new Set(domainsForGrade(grade).map((d) => d.id))
  const elective = (grade >= 3 ? ['kaku', 'rika', 'shakai', 'english'] : ['kaku', 'seikatsu', 'english']).filter((id) => available.has(id))
  const day = ((today % 7) + 7) % 7
  const ids = ['yomu', 'suuji'].filter((id) => available.has(id))
  const moralDay = day === 1 || day === 5
  if (moralDay && available.has('doutoku')) ids.push('doutoku')
  for (let i = 0; ids.length < 5 && elective.length; i++) {
    const id = elective[(day * 2 + i) % elective.length]
    if (!ids.includes(id)) ids.push(id)
  }
  return ids.slice(0, 5)
}

export function buildCoreMission(grade = 0, today = dayNumber()) {
  const tasks = []
  for (const domainId of weeklyDomains(grade, today)) {
    const task = makeTask(domainId, 'core')
    if (domainId === 'yomu' || domainId === 'suuji') task.questionCount = 5
    if (domainId === 'doutoku') task.questionCount = 2
    tasks.push(task)
  }
  return tasks
}

export function buildOkawariTask(index = 0, grade = 0) {
  const ids = weeklyDomains(grade, dayNumber() + index)
  return makeTask(ids[index % ids.length], 'okawari')
}

export function buildExtraTask(index = 0, grade = 0) {
  const ids = weeklyDomains(grade, dayNumber() + index)
  const task = makeTask(ids[index % ids.length], 'extra')
  task.questionCount = 3
  return task
}

export function buildFreeTask(domainId) {
  return makeTask(domainId, 'free')
}
