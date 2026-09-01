import { CAPTURE_EVOLUTION_LEVEL_BUFFER } from './balance.js'
import {
  CAPTURE_BOUNDARIES,
  defaultBaseCaptureChance,
  resolveCaptureRoll,
  settleCaptureSuccess
} from './captureDomain.js'
import { STAGES, speciesOf } from './content.js'
import { makeMonster } from './engineCore.js'
import { getEvolutionTransition } from './evolutionDomain.js'

function stageById(stageId) {
  return STAGES.find((stage) => stage.id === stageId) || null
}

function knownRing(itemType) {
  return Object.prototype.hasOwnProperty.call(CAPTURE_BOUNDARIES.ringMultipliers, itemType)
}

export function isPostWinCapturePhase(battle) {
  const hp = Number(battle?.enemy?.hp)
  const maxHp = Number(battle?.enemy?.maxHp)
  return battle?.status === 'won' && Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0 && hp <= 0
}

export function postWinCaptureEligibility(game, battle, itemType = 'star') {
  if (!knownRing(itemType)) return { eligible: false, reason: 'UNKNOWN_RING' }
  const stage = stageById(battle?.stageId)
  if (stage?.captureDisabled) return { eligible: false, reason: 'CAPTURE_DISABLED' }
  if (!isPostWinCapturePhase(battle)) return { eligible: false, reason: 'NOT_POST_WIN' }
  if ((Number(battle?.captureAttempts) || 0) >= CAPTURE_BOUNDARIES.maxAttempts) {
    return { eligible: false, reason: 'CAPTURE_LIMIT' }
  }
  if ((Number(game?.captureItems?.[itemType]) || 0) <= 0) {
    return { eligible: false, reason: 'NO_RING' }
  }
  return { eligible: true, reason: null }
}

export function canAttemptPostWinCapture(game, battle, itemType = 'star') {
  const current = game?.activeBattle
  if (current?.battleId && battle?.battleId && current.battleId !== battle.battleId) return false
  return postWinCaptureEligibility(game, current || battle, itemType).eligible
}

function pacedCaptureLevel(speciesId, enemyLevel) {
  const level = Math.max(1, Math.floor(Number(enemyLevel) || 1))
  const transition = getEvolutionTransition(speciesId)
  if (!transition || transition.method !== 'level') return level
  return Math.min(level, Math.max(1, transition.level - CAPTURE_EVOLUTION_LEVEL_BUFFER))
}

function baseCaptureChance(battle) {
  const species = speciesOf(battle?.enemy?.speciesId)
  return defaultBaseCaptureChance({
    hp: 0,
    maxHp: battle?.enemy?.maxHp,
    catchRank: species?.catchRank || 1
  })
}

function publicFailureReason(reason) {
  if (reason === 'CAPTURE_LIMIT') return 'CAPTURE_LIMIT'
  if (reason === 'CAPTURE_DISABLED') return 'CAPTURE_DISABLED'
  return 'CAPTURE_NOT_READY'
}

export function attemptPostWinCapture(game, battle, rolls = undefined, itemType = 'star') {
  const current = game?.activeBattle
  if (!current || (current.battleId && battle?.battleId && current.battleId !== battle.battleId)) {
    return { ok: false, game, battle: current || battle, reason: 'STALE_BATTLE' }
  }

  // activeBattle is the authority. A stale `won` object must never be able to
  // replay capture after the same battle has already moved to `caught`.
  const authoritativeBattle = current
  const eligibility = postWinCaptureEligibility(game, authoritativeBattle, itemType)
  if (!eligibility.eligible) {
    return { ok: false, game, battle: authoritativeBattle, reason: publicFailureReason(eligibility.reason) }
  }

  const successRoll = Array.isArray(rolls)
    ? Number(rolls[0])
    : (Number.isFinite(Number(rolls)) ? Number(rolls) : Math.random())
  const resolution = resolveCaptureRoll({
    baseChance: baseCaptureChance(authoritativeBattle),
    itemType,
    successRoll,
    failureStars: 1
  })

  let nextGame = structuredClone(game)
  nextGame.captureItems[itemType] -= 1
  const nextBattle = structuredClone(authoritativeBattle)
  nextBattle.captureAttempts = (Number(nextBattle.captureAttempts) || 0) + 1
  nextBattle.captureStars = resolution.presentation.starCount
  nextBattle.capturePresentation = resolution.presentation.frames
  nextBattle.lastPlayerAction = 'capture'
  nextBattle.rewardResolutionId ||= `${nextBattle.battleId || nextBattle.stageId}:reward`

  // The battle has already been won and its reward/ticket transaction committed.
  // A failed post-win throw therefore consumes only the ball/attempt: the defeated
  // enemy cannot act and the completed victory must not be settled again.
  if (!resolution.success) {
    nextBattle.log = [
      ...(nextBattle.log || []).slice(-4),
      `たおしたあとに ボールを なげた！ ${resolution.presentation.starCount}こ 光った！ でも逃げられた！`
    ].slice(-8)
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

  const captured = makeMonster(
    authoritativeBattle.enemy.speciesId,
    pacedCaptureLevel(authoritativeBattle.enemy.speciesId, authoritativeBattle.enemy.level)
  )
  const settlementResult = settleCaptureSuccess(nextGame, {
    resolutionId: `${nextBattle.rewardResolutionId}:capture`,
    capturedMonster: captured,
    ringType: itemType,
    teamAtStart: authoritativeBattle.teamAtStart || []
  })
  if (!settlementResult.ok) {
    return { ok: false, game, battle: authoritativeBattle, reason: settlementResult.reason }
  }

  nextGame = settlementResult.game
  nextBattle.status = 'caught'
  nextBattle.ticketSettlement = authoritativeBattle.ticketSettlement
  nextBattle.ticketCommitted = authoritativeBattle.ticketCommitted
  if (nextBattle.ticketReservation && authoritativeBattle.ticketReservation) {
    nextBattle.ticketReservation.status = authoritativeBattle.ticketReservation.status
  }
  nextBattle.partyStatuses = {}
  if (nextBattle.enemy) nextBattle.enemy.status = null
  nextBattle.log = [
    ...(nextBattle.log || []).slice(-4),
    '★★★★ たおしたあとに ボールを なげて ゲット！'
  ].slice(-8)
  nextGame.activeBattle = structuredClone(nextBattle)

  return {
    ok: true,
    caught: true,
    stars: resolution.presentation.starCount,
    chance: resolution.chance,
    capturePresentation: resolution.presentation,
    captured,
    xp: 0,
    xpByInstance: {},
    levelsByInstance: {},
    evolutionsByInstance: {},
    captureSettlement: settlementResult.settlement,
    duplicateChoiceRequired: settlementResult.settlement.status === 'pending_duplicate_choice',
    evolutionReward: null,
    specialReward: null,
    game: nextGame,
    battle: nextBattle
  }
}
