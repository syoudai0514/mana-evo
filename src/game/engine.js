import * as shared from './engineSharedRuntime.js'
import { CAPTURE_EVOLUTION_LEVEL_BUFFER } from './balance.js'
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

function attachTurnPresentation(beforeGame, beforeBattle, result, {
  moveId = null,
  actionKind = 'move',
  targetInstanceId = null
} = {}) {
  if (!result?.ok || !result?.battle) return result
  const after = structuredClone(result.battle)
  const presentedInstanceId = targetInstanceId || beforeBattle?.activeInstanceId
  const beforePlayerHp = targetInstanceId
    ? Math.max(0, Number(beforeBattle?.partyHp?.[targetInstanceId]) || 0)
    : shared.currentPlayerHp(beforeBattle)
  const afterPlayerHp = shared.currentPlayerHp(after)
  const beforeEnemyHp = Math.max(0, Number(beforeBattle?.enemy?.hp) || 0)
  const afterEnemyHp = Math.max(0, Number(after?.enemy?.hp) || 0)
  const playerName = speciesOf(beforeGame?.box?.[presentedInstanceId]?.speciesId)?.name || 'なかま'
  const enemyName = speciesOf(beforeBattle?.enemy?.speciesId)?.name || 'あいて'
  const turnLines = (after.log || []).slice(-5)
  const firstAttackLine = turnLines.find((line) => String(line).includes(' の ')) || ''
  const enemyFirst = firstAttackLine.startsWith(`${enemyName} の `)
  after.turnPresentation = {
    id: `${after.battleId || after.stageId}:${after.turn}:${actionKind}:${moveId || after.lastPlayerAction || 'turn'}`,
    moveId,
    actionKind,
    enemyFirst,
    playerName,
    enemyName,
    playerHpBefore: beforePlayerHp,
    playerHpAfter: afterPlayerHp,
    enemyHpBefore: beforeEnemyHp,
    enemyHpAfter: afterEnemyHp,
    playerDamage: Math.max(0, beforePlayerHp - afterPlayerHp),
    enemyDamage: Math.max(0, beforeEnemyHp - afterEnemyHp),
    playerFainted: beforePlayerHp > 0 && afterPlayerHp <= 0,
    enemyFainted: beforeEnemyHp > 0 && afterEnemyHp <= 0
  }
  const game = structuredClone(result.game)
  game.activeBattle = structuredClone(after)
  return { ...result, game, battle: after }
}

function battleSnapshotMatches(current, requested) {
  if (!current?.battleId || !requested?.battleId || current.battleId !== requested.battleId) return false
  return current.status === requested.status &&
    Number(current.turn || 0) === Number(requested.turn || 0) &&
    Number(current.captureAttempts || 0) === Number(requested.captureAttempts || 0) &&
    Number(current.enemy?.hp || 0) === Number(requested.enemy?.hp || 0)
}

function authoritativePostKoBattle(game, requestedBattle) {
  const current = game?.activeBattle
  if (!battleSnapshotMatches(current, requestedBattle)) return { battle: current || requestedBattle, reason: 'STALE_BATTLE' }
  return { battle: current, reason: null }
}

function postKoCaptureAllowed(game, battle, itemType = 'star') {
  const authoritative = authoritativePostKoBattle(game, battle)
  if (authoritative.reason) return false
  const current = authoritative.battle
  const stage = shared.stageById(current?.stageId)
  return !!stage && stage.kind === 'wild' && !stage.captureDisabled && current?.status === 'won' &&
    current?.postKoCaptureAvailable === true && Number(current?.enemy?.hp) <= 0 &&
    (Number(current?.captureAttempts) || 0) < shared.MAX_CAPTURE_ATTEMPTS &&
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
  result = markPostKoOpportunity(result)
  return attachTurnPresentation(game, battle, result, { moveId, actionKind: 'move' })
}

export function useProtect(game, battle, options = {}) {
  let result = settlePlayedLoss(shared.useProtect(game, battle, options), options)
  result = markPostKoOpportunity(result)
  return attachTurnPresentation(game, battle, result, { actionKind: 'protect' })
}

export function switchBattleMonster(game, battle, instanceId, options = {}) {
  let result = settlePlayedLoss(shared.switchBattleMonster(game, battle, instanceId, options), options)
  result = markPostKoOpportunity(result)
  return attachTurnPresentation(game, battle, result, { actionKind: 'switch', targetInstanceId: instanceId })
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

function attemptPostKoCapture(game, requestedBattle, rolls, itemType) {
  const authoritative = authoritativePostKoBattle(game, requestedBattle)
  if (authoritative.reason) return { ok: false, game, battle: authoritative.battle, reason: authoritative.reason }
  const battle = authoritative.battle
  if (!postKoCaptureAllowed(game, battle, itemType)) return { ok: false, game, battle, reason: 'CAPTURE_NOT_READY' }

  const rewardResolutionId = battle.rewardResolutionId || `${battle.battleId || battle.stageId}:reward`
  const captureResolutionId = `${rewardResolutionId}:capture`
  const existingSettlement = game?.captureDomain?.settlements?.[captureResolutionId]
  if (existingSettlement) {
    return {
      ok: true,
      caught: true,
      idempotent: true,
      stars: 4,
      captured: existingSettlement.capturedInstance,
      xp: 0,
      xpByInstance: {},
      levelsByInstance: {},
      evolutionsByInstance: {},
      captureSettlement: existingSettlement,
      duplicateChoiceRequired: existingSettlement.status === 'pending_duplicate_choice',
      game,
      battle
    }
  }

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

  nextBattle.rewardResolutionId = rewardResolutionId
  const captured = shared.makeMonster(
    battle.enemy.speciesId,
    pacedCaptureLevel(battle.enemy.speciesId, battle.enemy.level)
  )
  const settlement = settleCaptureSuccess(nextGame, {
    resolutionId: captureResolutionId,
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

function resemblesPostKoCapture(battle) {
  return battle?.postKoCaptureAvailable === true || (battle?.status === 'won' && Number(battle?.enemy?.hp) <= 0)
}

// Preserve the public default while ensuring null means "no caller-supplied roll".
// Number(null) is 0, which would otherwise make every default capture succeed.
export function attemptCapture(game, battle, rolls = null, itemType = 'star', options = {}) {
  if (resemblesPostKoCapture(battle)) return attemptPostKoCapture(game, battle, rolls, itemType)
  let result = shared.attemptCapture(game, battle, rolls === null ? undefined : rolls, itemType, options)
  result = settlePlayedLoss(result, options)
  result = markPostKoOpportunity(result)
  if (result?.ok && result?.caught !== true) {
    return attachTurnPresentation(game, battle, result, { actionKind: 'capture-failed' })
  }
  return result
}
