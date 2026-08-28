import * as shared from './engineSharedRuntime.js'
import { battleXpLevelMultiplier, CAPTURE_EVOLUTION_LEVEL_BUFFER } from './balance.js'
import { resolveCaptureRoll, settleCaptureSuccess } from './captureDomain.js'
import { speciesOf } from './content.js'
import { getEvolutionTransition } from './evolutionDomain.js'
import { availableTicketCount } from './progression.js'

export * from './engineSharedRuntime.js'

function effectiveToday(battle, options = {}) {
  return options?.today == null ? battle?.startedDay : options.today
}

function withoutRefundLog(lines = []) {
  return lines.filter((line) => !String(line).includes('チケットが 1まい もどった'))
}

function consumeExactRefundedReservation(game, battle, today) {
  const source = battle?.ticketReservation || battle?.ticketSource
  if (!source?.sourceLotId && !source?.id) return game
  const sourceId = String(source.sourceLotId || source.id)
  const earnedDay = Number(source.earnedDay)
  const expiresDay = Number(source.expiresDay)
  const next = structuredClone(game)
  const index = (next.ticketGrants || []).findIndex((grant) => (
    String(grant?.id) === sourceId &&
    Number(grant?.earnedDay) === earnedDay &&
    Number(grant?.expiresDay) === expiresDay &&
    Number(grant?.count) > 0
  ))
  if (index >= 0) {
    next.ticketGrants[index].count -= 1
    if (next.ticketGrants[index].count <= 0) next.ticketGrants.splice(index, 1)
  }
  next.tickets = availableTicketCount(next, today)
  return next
}

function settlePlayedLoss(result, options = {}) {
  if (!result?.ok || result?.battle?.status !== 'lost') return result
  const today = effectiveToday(result.battle, options)
  const game = result.battle.ticketRefunded
    ? consumeExactRefundedReservation(result.game, result.battle, today)
    : structuredClone(result.game)
  const battle = structuredClone(result.battle)
  battle.ticketRefunded = false
  battle.ticketCommitted = true
  battle.ticketSettlement = 'committed'
  if (battle.ticketReservation) battle.ticketReservation.status = 'committed'
  battle.log = [...withoutRefundLog(battle.log).slice(-6), '🎫 このバトルで チケットを 1まい つかったよ。'].slice(-8)
  game.activeBattle = structuredClone(battle)
  return { ...result, game, battle }
}

function attachTurnPresentation(beforeGame, beforeBattle, result, moveId) {
  if (!result?.ok || !result?.battle) return result
  const after = structuredClone(result.battle)
  const beforePlayerHp = shared.currentPlayerHp(beforeBattle)
  const afterPlayerHp = shared.currentPlayerHp(after)
  const beforeEnemyHp = Math.max(0, Number(beforeBattle?.enemy?.hp) || 0)
  const afterEnemyHp = Math.max(0, Number(after?.enemy?.hp) || 0)
  const playerName = speciesOf(beforeGame?.box?.[beforeBattle?.activeInstanceId]?.speciesId)?.name || 'なかま'
  const enemyName = speciesOf(beforeBattle?.enemy?.speciesId)?.name || 'あいて'
  const turnLines = (after.log || []).slice(-5)
  const firstAttackLine = turnLines.find((line) => String(line).includes(' の ')) || ''
  const enemyFirst = firstAttackLine.startsWith(`${enemyName} の `)
  after.turnPresentation = {
    id: `${after.battleId || after.stageId}:${after.turn}:${moveId || after.lastPlayerAction || 'turn'}`,
    moveId,
    enemyFirst,
    playerName,
    enemyName,
    playerDamage: Math.max(0, beforePlayerHp - afterPlayerHp),
    enemyDamage: Math.max(0, beforeEnemyHp - afterEnemyHp),
    playerFainted: beforePlayerHp > 0 && afterPlayerHp <= 0,
    enemyFainted: beforeEnemyHp > 0 && afterEnemyHp <= 0
  }
  const game = structuredClone(result.game)
  game.activeBattle = structuredClone(after)
  return { ...result, game, battle: after }
}

function applyLevelGapXp(originalGame, result) {
  if (!result?.ok || result?.battle?.status !== 'won' || !result?.rewards?.xpByInstance) return result
  const enemyLevel = Number(result.battle.enemy?.level) || 1
  const next = structuredClone(result.game)
  const xpByInstance = { ...result.rewards.xpByInstance }
  const levelsByInstance = { ...(result.rewards.levelsByInstance || {}) }
  let changed = false

  for (const [instanceId, awardedRaw] of Object.entries(result.rewards.xpByInstance)) {
    const before = originalGame?.box?.[instanceId]
    if (!before) continue
    // Never retroactively undo an evolution that legitimately happened in this
    // battle. Level-gap throttling mainly targets high-level farming of old areas.
    if (result.rewards?.evolutionsByInstance?.[instanceId]) continue
    const awarded = Math.max(0, Number(awardedRaw) || 0)
    const multiplier = battleXpLevelMultiplier(before.level, enemyLevel)
    const desired = awarded > 0 ? Math.max(1, Math.round(awarded * multiplier)) : 0
    if (desired >= awarded) continue
    const gained = shared.gainXp(before, desired)
    const current = next.box?.[instanceId]
    if (!current) continue
    next.box[instanceId] = { ...current, level: gained.monster.level, xp: gained.monster.xp }
    xpByInstance[instanceId] = desired
    levelsByInstance[instanceId] = gained.levels
    changed = true
  }
  if (!changed) return result

  const activeXp = xpByInstance[result.battle.activeInstanceId]
  const battle = structuredClone(result.battle)
  if (Number.isFinite(activeXp)) {
    const logs = [...(battle.log || [])]
    const index = logs.findLastIndex((line) => String(line).startsWith('かち！ XP +'))
    if (index >= 0) logs[index] = `かち！ XP +${activeXp} / マナ +${result.rewards?.mana || 0}`
    battle.log = logs
  }
  next.activeBattle = structuredClone(battle)
  return {
    ...result,
    game: next,
    battle,
    rewards: { ...result.rewards, xpByInstance, levelsByInstance }
  }
}

function postKoCaptureAllowed(game, battle, itemType = 'star') {
  const stage = shared.stageById(battle?.stageId)
  return !!stage && stage.kind === 'wild' && !stage.captureDisabled && battle?.status === 'won' &&
    Number(battle?.enemy?.hp) <= 0 && (Number(battle?.captureAttempts) || 0) < shared.MAX_CAPTURE_ATTEMPTS &&
    (Number(game?.captureItems?.[itemType]) || 0) > 0
}

function pacedCaptureLevel(speciesId, enemyLevel) {
  const level = Math.max(1, Math.floor(Number(enemyLevel) || 1))
  const transition = getEvolutionTransition(speciesId)
  if (!transition || transition.method !== 'level') return level
  return Math.min(level, Math.max(1, transition.level - CAPTURE_EVOLUTION_LEVEL_BUFFER))
}

function markPostKoOpportunity(result) {
  if (!result?.ok || result?.battle?.status !== 'won') return result
  const stage = shared.stageById(result.battle.stageId)
  if (stage?.kind !== 'wild' || stage.captureDisabled) return result
  const battle = structuredClone(result.battle)
  battle.postKoCaptureAvailable = true
  const game = structuredClone(result.game)
  game.activeBattle = structuredClone(battle)
  return { ...result, game, battle }
}

export function useMove(game, battle, moveId, options = {}) {
  let result = shared.useMove(game, battle, moveId, options)
  result = settlePlayedLoss(result, options)
  result = applyLevelGapXp(game, result)
  result = markPostKoOpportunity(result)
  return attachTurnPresentation(game, battle, result, moveId)
}

export function useProtect(game, battle, options = {}) {
  return settlePlayedLoss(shared.useProtect(game, battle, options), options)
}

export function switchBattleMonster(game, battle, instanceId, options = {}) {
  return settlePlayedLoss(shared.switchBattleMonster(game, battle, instanceId, options), options)
}

export function abandonBattle(game, options = {}) {
  const battle = game?.activeBattle
  const result = shared.abandonBattle(game, options)
  if (!result?.ok || !result.refunded) return result
  const today = options?.today == null ? battle?.startedDay : options.today
  return {
    ...result,
    game: consumeExactRefundedReservation(result.game, battle, today),
    refunded: false
  }
}

export function canAttemptCapture(game, battle, itemType = 'star') {
  return postKoCaptureAllowed(game, battle, itemType) || shared.canAttemptCapture(game, battle, itemType)
}

function attemptPostKoCapture(game, battle, rolls, itemType) {
  if (!postKoCaptureAllowed(game, battle, itemType)) return { ok: false, game, battle, reason: 'CAPTURE_NOT_READY' }
  const successRoll = Array.isArray(rolls) ? Number(rolls[0]) : (Number.isFinite(Number(rolls)) ? Number(rolls) : Math.random())
  const resolution = resolveCaptureRoll({
    baseChance: shared.baseCaptureChance(battle),
    itemType,
    successRoll,
    failureStars: 2
  })
  let nextGame = structuredClone(game)
  nextGame.captureItems[itemType] = Math.max(0, (nextGame.captureItems[itemType] || 0) - 1)
  const nextBattle = structuredClone(battle)
  nextBattle.captureAttempts = (Number(nextBattle.captureAttempts) || 0) + 1
  nextBattle.captureStars = resolution.presentation.starCount
  nextBattle.capturePresentation = resolution.presentation.frames
  nextBattle.lastPlayerAction = 'post-ko-capture'

  if (!resolution.success) {
    nextBattle.log = [...(nextBattle.log || []).slice(-5), `ボールを なげた！ ${resolution.presentation.starCount}つ ひかったけど でてきた！`].slice(-8)
    nextGame.activeBattle = structuredClone(nextBattle)
    return {
      ok: true,
      caught: false,
      stars: resolution.presentation.starCount,
      chance: resolution.chance,
      capturePresentation: resolution.presentation,
      game: nextGame,
      battle: nextBattle
    }
  }

  nextBattle.rewardResolutionId ||= `${nextBattle.battleId || nextBattle.stageId}:reward`
  const captured = shared.makeMonster(
    battle.enemy.speciesId,
    pacedCaptureLevel(battle.enemy.speciesId, battle.enemy.level)
  )
  const settlement = settleCaptureSuccess(nextGame, {
    resolutionId: `${nextBattle.rewardResolutionId}:capture`,
    capturedMonster: captured,
    ringType: itemType,
    teamAtStart: battle.teamAtStart || []
  })
  if (!settlement.ok) return { ok: false, game, battle, reason: settlement.reason }
  nextGame = settlement.game
  nextBattle.status = 'caught'
  nextBattle.postKoCaptureAvailable = false
  nextBattle.log = [...(nextBattle.log || []).slice(-5), '★★★★ たおしたあとに ボールが とじた！ GET！'].slice(-8)
  nextGame.activeBattle = structuredClone(nextBattle)
  return {
    ok: true,
    caught: true,
    stars: 4,
    chance: resolution.chance,
    capturePresentation: resolution.presentation,
    captured,
    xp: 0,
    xpByInstance: {},
    levelsByInstance: {},
    evolutionsByInstance: {},
    captureSettlement: settlement.settlement,
    duplicateChoiceRequired: settlement.settlement.status === 'pending_duplicate_choice',
    game: nextGame,
    battle: nextBattle
  }
}

// Preserve the public default while ensuring null means "no caller-supplied roll".
// Number(null) is 0, which would otherwise make every default capture succeed.
export function attemptCapture(game, battle, rolls = null, itemType = 'star', options = {}) {
  if (postKoCaptureAllowed(game, battle, itemType)) return attemptPostKoCapture(game, battle, rolls, itemType)
  return settlePlayedLoss(shared.attemptCapture(game, battle, rolls === null ? undefined : rolls, itemType, options), options)
}
