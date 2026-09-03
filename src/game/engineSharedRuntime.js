import * as core from './engineCore.js'
import {
  BALANCE_VERSION,
  BATTLE_XP_GLOBAL_MULTIPLIER,
  BATTLE_XP_TEAMMATE_MULTIPLIER,
  CAPTURE_EVOLUTION_LEVEL_BUFFER,
  battleXpForStage
} from './balance.js'
import { EVOLUTION_ITEMS, STAGES, speciesOf } from './content.js'
import {
  CAPTURE_BOUNDARIES,
  captureBattleXpRecipients,
  captureEligibility,
  captureProbability,
  defaultBaseCaptureChance,
  redeemGrowthShards,
  resolveCaptureRoll,
  resolveDuplicateChoice,
  settleCaptureSuccess
} from './captureDomain.js'
import {
  confirmEvolution as confirmEvolutionDomain,
  evolveAfterLevelUp,
  evolveWithStone,
  evolutionTriggerStatus,
  getEvolutionTransition,
  normalizePendingEvolution
} from './evolutionDomain.js'
import {
  SPECIAL_FORM_EFFECTS,
  activateSpecialForm,
  scaleHpPreservingRatio,
  specialFormActivationStatus
} from './specialFormsDomain.js'
import {
  adventureZoneProgress as canonicalAdventureZoneProgress,
  applyFirstBossClear,
  worldStageAvailability
} from './worldProgression.js'

export const MAX_CAPTURE_ATTEMPTS = CAPTURE_BOUNDARIES.maxAttempts
export const GIGA_MULTIPLIER = SPECIAL_FORM_EFFECTS.giga.attack
export const BURST_HP_MULTIPLIER = SPECIAL_FORM_EFFECTS.burst.hp
export const BURST_ATTACK_MULTIPLIER = SPECIAL_FORM_EFFECTS.burst.attack
export const BURST_TURNS = SPECIAL_FORM_EFFECTS.burst.turns

export const totalXpForLevel = core.totalXpForLevel
export const xpToNext = core.xpToNext
export const statsFor = core.statsFor
export const makeMonster = core.makeMonster
export const gainXp = core.gainXp
export const damageAmount = core.damageAmount
export const currentPlayerHp = core.currentPlayerHp
export const healthyTeamIds = core.healthyTeamIds
export const currentPlayerMaxHp = core.currentPlayerMaxHp
export const availableBattleMoveIds = core.availableBattleMoveIds
export const canUseProtect = core.canUseProtect
export const useProtect = core.useProtect
export const switchBattleMonster = core.switchBattleMonster
export const abandonBattle = core.abandonBattle
export const clearFinishedBattle = core.clearFinishedBattle
export const setTeam = core.setTeam

export function stageById(stageId) {
  return STAGES.find((stage) => stage.id === stageId) || null
}

function ownsSpecies(game, speciesId) {
  return !!game?.dex?.caught?.[speciesId] || Object.values(game?.box || {}).some((monster) => monster?.speciesId === speciesId)
}

export function adventureZoneProgress(game, area, zoneId) {
  return canonicalAdventureZoneProgress(game, STAGES, area, zoneId)
}

export function isAdventureZoneUnlocked(game, area, zoneId) {
  return adventureZoneProgress(game, area, zoneId).unlocked
}

export function isStageUnlocked(game, stage) {
  if (!stage) return false
  const cleared = new Set(game?.stagesCleared || [])
  if (stage.legacy) {
    if (stage.hidden) return false
    return !stage.unlockedBy || cleared.has(stage.unlockedBy)
  }
  if (stage.kind === 'evolution-trial') return false
  const availability = worldStageAvailability(game, stage, STAGES)
  if (!availability.unlocked) return false
  if (stage.areaGateBossId && !cleared.has(stage.areaGateBossId)) return false
  if (stage.requiresOwnedSpeciesId && !ownsSpecies(game, stage.requiresOwnedSpeciesId)) return false
  if (stage.requiresAllAreasCleared && ![1, 2, 3, 4].every((area) => cleared.has(`a${area}-boss`))) return false
  return true
}

export function startBattle(game, stageId, options = {}) {
  if (game?.activeBattle) return core.startBattle(game, stageId, options)
  const stage = stageById(stageId)
  if (!stage) return { ok: false, game, reason: 'UNKNOWN_STAGE' }
  if (!isStageUnlocked(game, stage)) return { ok: false, game, reason: 'LOCKED_STAGE' }
  return core.startBattle(game, stageId, options)
}

function mapEvolutionResult(result) {
  if (!result?.ok) return result
  return {
    ...result,
    from: result.fromSpeciesId,
    to: result.toSpeciesId
  }
}

export function levelsUntilEvolution(monster) {
  const transition = getEvolutionTransition(monster?.speciesId)
  if (!transition || transition.method !== 'level') return null
  return Math.max(0, transition.level - Math.max(1, Number(monster?.level) || 1))
}

export function describeEvolutionCondition(monster) {
  const transition = getEvolutionTransition(monster?.speciesId)
  if (!transition) return '通常進化：最終形'
  if (normalizePendingEvolution(monster)) return '✨ シンカできる！'
  if (transition.method === 'level') return `Lv.${transition.level}で進化`
  if (transition.method === 'stone') return `${EVOLUTION_ITEMS.stones[transition.itemId]?.name || transition.itemId || '進化アイテム'}で進化`
  if (transition.method === 'held_item_levelup') return `${EVOLUTION_ITEMS.heldItems[transition.itemId]?.name || transition.itemId || '特定アイテム'}をもって レベルアップすると進化`
  return '進化条件は未設定'
}

export function evolutionConditionMet(monster, _species = null, game = null) {
  const transition = getEvolutionTransition(monster?.speciesId)
  if (!transition) return false
  if (transition.method === 'stone') return evolutionTriggerStatus(monster, game, { trigger: 'stone', itemId: transition.itemId }).ready
  return !!normalizePendingEvolution(monster)
}

export function canNormalEvolve(monster, game = null) {
  return evolutionConditionMet(monster, null, game)
}

export function normalEvolve(monster) {
  return { ok: false, monster, reason: 'GAME_EVOLUTION_API_REQUIRED' }
}

export function evolveInstance(game, instanceId) {
  const monster = game?.box?.[instanceId]
  if (!monster) return { ok: false, game, reason: 'UNKNOWN_MONSTER' }
  const transition = getEvolutionTransition(monster.speciesId)
  if (!transition) return { ok: false, game, reason: 'NO_EVOLUTION' }
  if (transition.method === 'stone') {
    return mapEvolutionResult(evolveWithStone(game, {
      instanceId,
      itemId: transition.itemId,
      operationId: `stone:${instanceId}:${transition.fromSpeciesId}->${transition.toSpeciesId}`
    }))
  }
  const pending = normalizePendingEvolution(monster)
  if (!pending) return { ok: false, game, reason: 'PENDING_EVOLUTION_REQUIRED', transition }
  return mapEvolutionResult(confirmEvolutionDomain(game, {
    instanceId,
    qualificationId: pending.qualificationId
  }))
}

export function applyXpToInstance(game, {
  instanceId,
  amount,
  operationId = null
} = {}) {
  const current = game?.box?.[instanceId]
  if (!current) return { ok: false, game, reason: 'UNKNOWN_MONSTER' }
  const gained = core.gainXp(current, amount)
  let next = structuredClone(game)
  next.box[instanceId] = gained.monster
  let pendingEvolution = null
  if (gained.levels.length > 0) {
    const qualified = evolveAfterLevelUp(next, {
      instanceId,
      previousLevel: current.level,
      newLevel: gained.monster.level,
      operationId: operationId || `xp:${instanceId}:${current.speciesId}:${current.level}:${current.xp || 0}:${Math.max(0, Number(amount) || 0)}`
    })
    if (qualified.ok) {
      next = qualified.game
      pendingEvolution = qualified.pendingEvolution || next.box?.[instanceId]?.pendingEvolution || null
    }
  }
  return { ok: true, game: next, levels: gained.levels, evolution: null, pendingEvolution }
}

function battleXpForRecipient(baseXp, battle, instanceId) {
  const pool = Math.max(0, Number(baseXp) || 0)
  if (pool <= 0) return 0
  const activeXp = Math.max(1, Math.round(pool * BATTLE_XP_GLOBAL_MULTIPLIER))
  if (instanceId === battle?.activeInstanceId) return activeXp
  return Math.max(1, Math.round(activeXp * BATTLE_XP_TEAMMATE_MULTIPLIER))
}

function pacedCaptureLevel(speciesId, enemyLevel) {
  const level = Math.max(1, Math.floor(Number(enemyLevel) || 1))
  const transition = getEvolutionTransition(speciesId)
  if (!transition || transition.method !== 'level') return level
  return Math.min(level, Math.max(1, transition.level - CAPTURE_EVOLUTION_LEVEL_BUFFER))
}

function applyBattleXpPacing(originalGame, result) {
  const levelsByInstance = result?.rewards?.levelsByInstance
  const baseXp = Math.max(0, Number(result?.rewards?.xp) || 0)
  if (!result?.ok || !result?.game || !levelsByInstance || typeof levelsByInstance !== 'object' || baseXp <= 0) return result

  const next = structuredClone(result.game)
  const pacedLevels = {}
  const xpByInstance = {}
  for (const instanceId of Object.keys(levelsByInstance)) {
    const before = originalGame?.box?.[instanceId]
    if (!before) continue
    const amount = battleXpForRecipient(baseXp, result.battle, instanceId)
    const gained = core.gainXp(before, amount)
    next.box[instanceId] = gained.monster
    pacedLevels[instanceId] = gained.levels
    xpByInstance[instanceId] = amount
  }
  return {
    ...result,
    game: next,
    rewards: {
      ...result.rewards,
      levelsByInstance: pacedLevels,
      xpByInstance
    }
  }
}

function integrateBattleXpEvolutionReadiness(originalGame, result) {
  if (!result?.ok || !result?.game || !result?.rewards?.levelsByInstance) return result
  let next = result.game
  const pendingEvolutionsByInstance = {}
  const prefix = result.battle?.rewardResolutionId || `${result.battle?.battleId || result.battle?.stageId || 'battle'}:reward`
  for (const [instanceId, levels] of Object.entries(result.rewards.levelsByInstance)) {
    if (!Array.isArray(levels) || !levels.length) continue
    const before = originalGame?.box?.[instanceId]
    const after = next?.box?.[instanceId]
    if (!before || !after) continue
    const qualified = evolveAfterLevelUp(next, {
      instanceId,
      previousLevel: before.level,
      newLevel: after.level,
      operationId: `${prefix}:evolution:${instanceId}`
    })
    if (qualified.ok) {
      next = qualified.game
      const pending = qualified.pendingEvolution || next.box?.[instanceId]?.pendingEvolution
      if (pending) pendingEvolutionsByInstance[instanceId] = pending
    }
  }
  return {
    ...result,
    game: next,
    rewards: { ...result.rewards, evolutionsByInstance: {}, pendingEvolutionsByInstance }
  }
}

function integrateBossFirstClear(originalGame, result) {
  if (!result?.ok || result?.battle?.status !== 'won' || !result?.rewards?.firstClear) return result
  const stage = stageById(result.battle.stageId)
  const area = Number(stage?.adventureArea || stage?.area)
  if (stage?.kind !== 'boss' || area < 1 || area > 4) return result
  const canonical = applyFirstBossClear(originalGame, area)
  if (!canonical.ok) return result
  const next = structuredClone(result.game)
  next.areaBossProgress = structuredClone(canonical.game.areaBossProgress || {})
  return {
    ...result,
    game: next,
    rewards: { ...result.rewards, unlockedArea: canonical.unlockedArea }
  }
}

export function useMove(game, battle, moveId, options = {}) {
  const result = applyBattleXpPacing(game, core.useMove(game, battle, moveId, options))
  return integrateBossFirstClear(game, integrateBattleXpEvolutionReadiness(game, result))
}

function activeMonster(game, battle) {
  return game?.box?.[battle?.activeInstanceId] || null
}

function activateSpecial(game, battle, form) {
  const current = game?.activeBattle
  if (!current || (current.battleId && battle?.battleId && current.battleId !== battle.battleId)) {
    return { ok: false, game, battle: current || battle, reason: 'STALE_BATTLE' }
  }
  const monster = activeMonster(game, battle)
  if (!monster) return { ok: false, game, battle, reason: 'NO_ACTIVE_MONSTER' }
  const status = specialFormActivationStatus(game, battle, monster.speciesId, form)
  if (!status.activatable) return { ok: false, game, battle, reason: status.reason }
  const activated = activateSpecialForm(game, battle, {
    speciesId: monster.speciesId,
    instanceId: monster.instanceId,
    form
  })
  if (!activated.ok) return activated

  const nextGame = activated.game
  const nextBattle = activated.battle
  const baseMax = core.statsFor(monster.speciesId, monster.level).hp
  const effect = SPECIAL_FORM_EFFECTS[form]
  const specialMax = core.statsFor(monster.speciesId, monster.level, {
    hp: effect.hp,
    attack: effect.attack,
    defense: effect.defense,
    speed: effect.speed
  }).hp
  const scaled = scaleHpPreservingRatio(nextBattle.partyHp?.[monster.instanceId], baseMax, specialMax)
  nextBattle.partyHp[monster.instanceId] = scaled.currentHp
  nextBattle.log = [...(nextBattle.log || []).slice(-5), form === 'giga'
    ? `🔷 ${speciesOf(monster.speciesId).name}が ギガシンカ！`
    : `💥 ${speciesOf(monster.speciesId).name}が キョダイバースト！`]
  nextGame.activeBattle = structuredClone(nextBattle)
  return { ok: true, game: nextGame, battle: nextBattle }
}

export function activateGiga(game, battle) {
  return activateSpecial(game, battle, 'giga')
}

export function activateBurst(game, battle) {
  return activateSpecial(game, battle, 'burst')
}

export function baseCaptureChance(battle) {
  const species = speciesOf(battle?.enemy?.speciesId)
  return defaultBaseCaptureChance({
    hp: battle?.enemy?.hp,
    maxHp: battle?.enemy?.maxHp,
    catchRank: species?.catchRank || 1
  })
}

export function captureChance(battle, itemType = 'star') {
  return captureProbability(baseCaptureChance(battle), itemType)
}

export function canAttemptCapture(game, battle, itemType = 'star') {
  const stage = stageById(battle?.stageId)
  return captureEligibility(game, battle, itemType, { captureDisabled: !!stage?.captureDisabled }).eligible
}

function recordNormalFirstClearSnapshot(game, stage, battle) {
  if (!stage || stage.bossRank) return game
  const referencePower = Number(battle?.enemy?.balance?.referencePower)
  if (!Number.isFinite(referencePower) || referencePower <= 0) return game
  const next = structuredClone(game)
  next.normalStageSnapshots ||= {}
  if (!next.normalStageSnapshots[stage.id]) {
    next.normalStageSnapshots[stage.id] = {
      stageId: stage.id,
      firstClearReferencePower: referencePower,
      balanceVersion: BALANCE_VERSION
    }
  }
  return next
}

function commitCaptureBattle(battle) {
  const next = structuredClone(battle)
  next.status = 'caught'
  next.ticketSettlement = 'committed'
  next.ticketCommitted = true
  if (next.ticketReservation) next.ticketReservation.status = 'committed'
  next.partyStatuses = {}
  if (next.enemy) next.enemy.status = null
  return next
}

function captureTeamXp(game, battle, capturedInstanceId, xp) {
  let next = game
  const levelsByInstance = {}
  const pendingEvolutionsByInstance = {}
  const xpByInstance = {}
  const prefix = `${battle?.battleId || battle?.stageId || 'capture'}:capture-xp`
  for (const instanceId of captureBattleXpRecipients(battle?.teamAtStart || [], capturedInstanceId)) {
    const amount = battleXpForRecipient(xp, battle, instanceId)
    const applied = applyXpToInstance(next, { instanceId, amount, operationId: `${prefix}:${instanceId}` })
    if (!applied.ok) continue
    next = applied.game
    levelsByInstance[instanceId] = applied.levels
    xpByInstance[instanceId] = amount
    if (applied.pendingEvolution) pendingEvolutionsByInstance[instanceId] = applied.pendingEvolution
  }
  return { game: next, levelsByInstance, pendingEvolutionsByInstance, evolutionsByInstance: {}, xpByInstance }
}

export function attemptCapture(game, battle, rolls = null, itemType = 'star', { today = null } = {}) {
  const current = game?.activeBattle
  const currentAttempts = Number(current?.captureAttempts) || 0
  const suppliedAttempts = Number(battle?.captureAttempts) || 0
  if (!current ||
      (current.battleId && battle?.battleId && current.battleId !== battle.battleId) ||
      current.status !== battle?.status ||
      currentAttempts !== suppliedAttempts) {
    return { ok: false, game, battle: current || battle, reason: 'STALE_BATTLE' }
  }

  const stage = stageById(battle?.stageId)
  const eligibility = captureEligibility(game, battle, itemType, { captureDisabled: !!stage?.captureDisabled })
  if (!eligibility.eligible) {
    const reason = eligibility.reason === 'CAPTURE_LIMIT' ? 'CAPTURE_LIMIT'
      : eligibility.reason === 'CAPTURE_DISABLED' ? 'CAPTURE_DISABLED'
        : 'CAPTURE_NOT_READY'
    return { ok: false, game, battle, reason }
  }

  const postWinCapture = battle.status === 'won' && Number(battle.enemy?.hp) === 0
  const successRoll = Array.isArray(rolls) ? Number(rolls[0]) : (Number.isFinite(Number(rolls)) ? Number(rolls) : Math.random())
  const resolution = resolveCaptureRoll({
    baseChance: baseCaptureChance(battle),
    itemType,
    successRoll,
    failureStars: 1
  })

  if (!resolution.success) {
    if (postWinCapture) {
      const nextGame = structuredClone(game)
      nextGame.captureItems[itemType] -= 1
      const nextBattle = structuredClone(battle)
      nextBattle.captureAttempts = (Number(nextBattle.captureAttempts) || 0) + 1
      nextBattle.captureStars = resolution.presentation.starCount
      nextBattle.capturePresentation = resolution.presentation.frames
      nextBattle.lastPlayerAction = 'capture'
      nextBattle.log = [
        ...(nextBattle.log || []).slice(-4),
        `「わ」を なげた！ ${resolution.presentation.starCount}こ 光った！ でも逃げられた！`
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

    // Failed in-battle capture still consumes the player's action and preserves
    // the existing enemy-turn compatibility path. Post-win failure is handled
    // above so a defeated enemy can never retaliate or replay victory rewards.
    const compatibility = core.attemptCapture(game, battle, [1, 1, 1, 1], itemType, { today })
    if (!compatibility.ok) return compatibility
    const nextBattle = structuredClone(compatibility.battle)
    nextBattle.captureStars = resolution.presentation.starCount
    nextBattle.capturePresentation = resolution.presentation.frames
    const nextGame = structuredClone(compatibility.game)
    nextGame.activeBattle = structuredClone(nextBattle)
    return {
      ...compatibility,
      game: nextGame,
      battle: nextBattle,
      caught: false,
      stars: resolution.presentation.starCount,
      chance: resolution.chance,
      capturePresentation: resolution.presentation
    }
  }

  let nextGame = structuredClone(game)
  nextGame.captureItems[itemType] -= 1
  const nextBattle = commitCaptureBattle(battle)
  nextBattle.captureAttempts = (Number(nextBattle.captureAttempts) || 0) + 1
  nextBattle.captureStars = resolution.presentation.starCount
  nextBattle.capturePresentation = resolution.presentation.frames
  nextBattle.lastPlayerAction = 'capture'
  nextBattle.rewardResolutionId ||= `${nextBattle.battleId || nextBattle.stageId}:reward`

  const captured = core.makeMonster(
    battle.enemy.speciesId,
    pacedCaptureLevel(battle.enemy.speciesId, battle.enemy.level)
  )
  let xp = 0
  let firstClear = false
  let gained = {
    game: nextGame,
    levelsByInstance: {},
    pendingEvolutionsByInstance: {},
    evolutionsByInstance: {},
    xpByInstance: {}
  }

  if (!postWinCapture) {
    firstClear = !(nextGame.stagesCleared || []).includes(stage.id)
    xp = battleXpForStage(stage)
    gained = captureTeamXp(nextGame, battle, captured.instanceId, xp)
    nextGame = gained.game
  }

  const settlementResult = settleCaptureSuccess(nextGame, {
    resolutionId: `${nextBattle.rewardResolutionId}:capture`,
    capturedMonster: captured,
    ringType: itemType,
    teamAtStart: battle.teamAtStart || []
  })
  if (!settlementResult.ok) return { ok: false, game, battle, reason: settlementResult.reason }
  nextGame = settlementResult.game

  if (!postWinCapture) {
    // Capture Mana is still blocked in W-103; retain the existing compatibility
    // value for an in-battle capture only. A post-win capture must not replay
    // the already-committed victory reward transaction.
    nextGame.mana = (nextGame.mana || 0) + Math.floor((Number(stage.mana) || 0) / 2)
    nextGame = recordNormalFirstClearSnapshot(nextGame, stage, battle)
    if (firstClear) nextGame.stagesCleared = [...new Set([...(nextGame.stagesCleared || []), stage.id])]
  }

  const activeXp = gained.xpByInstance?.[battle.activeInstanceId] || 0
  const captureLog = postWinCapture
    ? '★★★★ ボールを なげた！ 4つ ひかって ゲット！'
    : `★★★★ ボールを なげた！ 4つ ひかって ゲット！ XP +${activeXp}`
  nextBattle.log = [...(nextBattle.log || []).slice(-4), captureLog]
  nextGame.activeBattle = structuredClone(nextBattle)

  return {
    ok: true,
    caught: true,
    stars: resolution.presentation.starCount,
    chance: resolution.chance,
    capturePresentation: resolution.presentation,
    captured,
    xp,
    xpByInstance: gained.xpByInstance,
    levelsByInstance: gained.levelsByInstance,
    evolutionsByInstance: {},
    pendingEvolutionsByInstance: gained.pendingEvolutionsByInstance,
    captureSettlement: settlementResult.settlement,
    duplicateChoiceRequired: settlementResult.settlement.status === 'pending_duplicate_choice',
    evolutionReward: null,
    specialReward: null,
    game: nextGame,
    battle: nextBattle
  }
}

export function resolveDuplicateCaptureChoice(game, resolutionId, choice) {
  return resolveDuplicateChoice(game, resolutionId, choice)
}

export function redeemGrowthShardXp(game, {
  redemptionId,
  instanceId
} = {}) {
  const before = game?.box?.[instanceId]
  const redeemed = redeemGrowthShards(game, {
    redemptionId,
    instanceId,
    applyXp: core.gainXp
  })
  if (!redeemed.ok || redeemed.idempotent || !before || !redeemed.redemption?.levels?.length) return redeemed
  const after = redeemed.game?.box?.[instanceId]
  if (!after) return redeemed
  const qualified = evolveAfterLevelUp(redeemed.game, {
    instanceId,
    previousLevel: before.level,
    newLevel: after.level,
    operationId: `${redemptionId}:evolution`
  })
  if (!qualified.ok) return redeemed
  return {
    ...redeemed,
    game: qualified.game,
    evolution: null,
    pendingEvolution: qualified.pendingEvolution || qualified.game.box?.[instanceId]?.pendingEvolution || null
  }
}
