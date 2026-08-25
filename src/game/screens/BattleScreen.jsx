import React, { useState } from 'react'
import { dayNumber } from '../../study/srs.js'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { effectivenessLabel, moveOf, speciesOf, typeEffectiveness, typeLabel } from '../content.js'
import {
  abandonBattle,
  activateBurst,
  activateGiga,
  attemptCapture,
  availableBattleMoveIds,
  canNormalEvolve,
  canUseProtect,
  clearFinishedBattle,
  currentPlayerHp,
  currentPlayerMaxHp,
  evolveInstance,
  stageById,
  switchBattleMonster,
  useMove,
  useProtect
} from '../engine.js'
import { availableTicketCount, specialProgressionStatus } from '../progression.js'
import { CapturePanel } from './CapturePanel.jsx'
import { EvolutionCelebration } from './EvolutionOverlay.jsx'
import { HpBar, TypePills } from './GameScreenPrimitives.jsx'

export function BattleView({ game, setGame, onExitToMap, goStudy }) {
  const battle = game.activeBattle
  const stage = stageById(battle.stageId)
  const active = game.box[battle.activeInstanceId]
  const playerSpecies = speciesOf(active.speciesId)
  const enemySpecies = speciesOf(battle.enemy.speciesId)
  const playerMax = currentPlayerMaxHp(game, battle)
  const playerHp = currentPlayerHp(battle)
  const finished = ['won', 'lost', 'caught'].includes(battle.status)
  const forcedSwitch = battle.status === 'needs_switch'
  const special = specialProgressionStatus(active, game)
  const [battleEvolutionReveal, setBattleEvolutionReveal] = useState(null)
  const readyEvolutionMonster = finished && battle.status !== 'lost'
    ? (battle.teamAtStart || []).map((id) => game.box?.[id]).find((monster) => monster && canNormalEvolve(monster, game))
    : null

  const act = (moveId) => {
    const result = useMove(game, battle, moveId)
    if (result.ok) setGame(result.game)
  }
  const protect = () => {
    const result = useProtect(game, battle)
    if (result.ok) setGame(result.game)
  }
  const specialAct = (type) => {
    const result = type === 'giga' ? activateGiga(game, battle) : activateBurst(game, battle)
    if (result.ok) setGame(result.game)
  }
  const capture = (itemType) => {
    const result = attemptCapture(game, battle, null, itemType)
    if (result.ok) setGame(result.game)
  }
  const swap = (instanceId) => {
    const result = switchBattleMonster(game, battle, instanceId)
    if (result.ok) setGame(result.game)
  }
  const exit = () => {
    const today = dayNumber()
    if (finished) {
      const result = clearFinishedBattle(game, { today })
      if (result.ok) setGame(result.game)
      onExitToMap()
      return
    }
    const refundable = !battle.ticketRefunded && battle.ticketSource && battle.ticketSource.expiresDay > today
    const message = refundable ? 'バトルを やめる？ チケット1まいは もどるよ。' : 'バトルを やめる？ チケットは期限をすぎているので もどらないよ。'
    if (typeof window !== 'undefined' && !window.confirm(message)) return
    const result = abandonBattle(game, { today })
    if (result.ok) setGame(result.game)
    onExitToMap()
  }

  const evolveReadyMonster = () => {
    if (!readyEvolutionMonster) return
    const fromId = readyEvolutionMonster.speciesId
    const level = readyEvolutionMonster.level
    const result = evolveInstance(game, readyEvolutionMonster.instanceId)
    if (!result.ok) return
    setGame(result.game)
    setBattleEvolutionReveal({ fromId, toId: result.to, level })
  }

  const battleMoves = availableBattleMoveIds(game, battle)
  return <main className={`screen battle-screen-v2 area-theme-${stage?.adventureArea || stage?.area || 5}`}>
    <EvolutionCelebration reveal={battleEvolutionReveal} onClose={() => setBattleEvolutionReveal(null)} />
    <div className="battle-head"><button className="back" onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button><strong>{stage?.zoneName ? `${stage.zoneName}｜${stage.label}` : stage?.label}</strong><span>TURN {battle.turn}</span></div>
    {battle.challenge && <div className="challenge-banner">🔥 チャレンジモード：いまの強さで再調整</div>}
    {battle.bossTelegraphed && !finished && <div className="boss-warning"><strong>⚠️ つぎに おおわざ！</strong><span>まもるなら いま！</span></div>}
    {battle.playerSpecial && <div className={`special-active ${battle.playerSpecial.type}`}><strong>{battle.playerSpecial.type === 'giga' ? '🔷 ギガシンカ中！' : '💥 キョダイバースト中！'}</strong>{battle.playerSpecial.type === 'burst' && <span>あと {battle.playerSpecial.turnsLeft}ターン</span>}</div>}

    <section className="battle-arena-v2">
      <div className="fighter enemy-fighter">
        <div className="fighter-info"><strong>No.{enemySpecies.no} {enemySpecies.name}</strong><span>Lv.{battle.enemy.level}</span><TypePills types={enemySpecies.types} /><HpBar value={battle.enemy.hp} max={battle.enemy.maxHp} /><small>HP {battle.enemy.hp}/{battle.enemy.maxHp}</small></div>
        <PlaceholderMonster speciesId={battle.enemy.speciesId} />
      </div>
      <div className="fighter player-fighter">
        <PlaceholderMonster speciesId={active.speciesId} />
        <div className="fighter-info"><strong>No.{playerSpecies.no} {playerSpecies.name}</strong><span>Lv.{active.level}</span><TypePills types={playerSpecies.types} /><HpBar value={playerHp} max={playerMax} /><small>HP {playerHp}/{playerMax}</small></div>
      </div>
    </section>

    <section className="battle-log">{battle.log.slice(-5).map((line, i) => <p key={`${line}-${i}`}>{line}</p>)}</section>

    {!finished && !forcedSwitch && <>
      <section className="move-grid">
        {battleMoves.map((moveId) => {
          const move = moveOf(moveId)
          const factor = move.effect?.type === 'damage' ? typeEffectiveness(move.type, enemySpecies.types) : 1
          return <button key={moveId} className={move.role === 'burst' ? 'burst-move' : move.role === 'heal' ? 'heal-move' : ''} onClick={() => act(moveId)}>
            <strong>{move.name}</strong>
            <span>{typeLabel(move.type)}　{move.effect?.type === 'heal' ? 'HP 20%かいふく' : `威力 ${move.power}`}　命中 {move.accuracy}</span>
            {move.effect?.type === 'damage' && <em className={`effect effect-${String(factor).replace('.', '-')}`}>{effectivenessLabel(factor)}</em>}
            <small>{move.role === 'heal' ? '1バトル1かい' : move.role === 'coverage' ? '相性をねらう技' : move.role === 'finisher' ? '大きな一撃' : move.role === 'burst' ? 'バーストせんよう！' : ''}</small>
          </button>
        })}
      </section>
      <div className="battle-action-row">
        <button className={`protect-action ${battle.bossTelegraphed ? 'recommended' : ''}`} disabled={!canUseProtect(battle)} onClick={protect}>🛡️ まもる<small>{canUseProtect(battle) ? 'ダメージを ふせぐ' : 'れんぞくでは つかえない'}</small></button>
        {!battle.specialUsed && special.giga.activatable && <button className="giga-action" onClick={() => specialAct('giga')}>🔷 ギガシンカ<small>このバトル中 ぜんのうりょく×1.35</small></button>}
        {!battle.specialUsed && special.burst.activatable && <button className="burst-action" onClick={() => specialAct('burst')}>💥 キョダイバースト<small>3ターン・HP×2 / こうげき×1.2</small></button>}
      </div>

      <CapturePanel game={game} battle={battle} captureDisabled={stage?.captureDisabled} onCapture={capture} />
      <section className="battle-point-guide"><h3>🛡️ バトルのポイント</h3><div><p><span>❤️</span>HPが <b>50%いか</b> だと つかまえやすい</p><p><span>⭕</span>わ は 1バトル <b>3かい</b>まで</p><p><span>🐾</span>チームは <b>3たい</b>まで</p><p><span>⭐</span>しょうりで <b>けいけんちGET</b></p></div></section>
    </>}

    {forcedSwitch && <section className="battle-result-card"><h2>つぎの なかまを えらぼう！</h2><p>まだ元気な仲間がいるから、バトルは続けられるよ。</p></section>}

    {!finished && <section className="team-switch"><h3>{forcedSwitch ? 'こうたい ひっす' : 'こうたい（相手も1回こうげき）'}</h3><div>{game.team.map((id) => {
      const member = game.box[id]
      const sp = speciesOf(member.speciesId)
      const hp = battle.partyHp?.[id] || 0
      const max = currentPlayerMaxHp(game, battle, id)
      return <button key={id} disabled={id === battle.activeInstanceId || hp <= 0} onClick={() => swap(id)}><PlaceholderMonster speciesId={member.speciesId} compact /><span>{sp.name}<small>Lv.{member.level}　HP {hp}/{max}</small><TypePills types={sp.types} /></span></button>
    })}</div></section>}

    {finished && <section className="battle-result-card">
      <h2>{battle.status === 'won' ? 'かち！ 🎉' : battle.status === 'caught' ? 'ゲット！ ★★★★' : 'まけちゃった…'}</h2>
      {battle.status === 'won' && stage?.evolutionReward && <p>🎁 初回クリアなら シンカアイテムをGET！</p>}
      {battle.status === 'won' && stage?.id === 'a1-boss' && <p>🔷 はじめてのクリアで ギガキーが ひらいた！</p>}
      {battle.status === 'won' && stage?.specialReward?.type === 'giga' && <p>🔷 {enemySpecies.name}のギガコアを解放！</p>}
      {battle.status === 'won' && stage?.specialReward?.type === 'burst' && <p>💥 {enemySpecies.name}のバーストのしるしを解放！</p>}
      {battle.status === 'caught' && <p>「わ」が 4つ ひかって GET！ 新しい仲間はボックスに入ったよ。手持ちが2体以下なら自動でチーム入り！</p>}
      {battle.status === 'lost' && <p>{battle.ticketRefunded ? '🎫は1まい返ってきたよ。仲間を育てて再挑戦しよう！' : '🎫は期限をすぎていたので戻らなかったよ。もう一度学んで挑戦しよう！'}</p>}
      {readyEvolutionMonster && <div className="battle-evolution-ready"><strong>✨ {speciesOf(readyEvolutionMonster.speciesId)?.name}が シンカできるよ！</strong><span>バトルで そだった いまが チャンス！</span><button className="evolve-now" onClick={evolveReadyMonster}>✨ いま シンカする！</button></div>}
      <button className="primary" onClick={exit}>マップへ</button>
      {availableTicketCount(game, dayNumber()) < 1 && <button className="secondary" onClick={goStudy}>まなぶ！</button>}
    </section>}
  </main>
}
