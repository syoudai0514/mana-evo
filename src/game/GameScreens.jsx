import React, { useMemo, useState } from 'react'
import PlaceholderMonster from './PlaceholderMonster.jsx'
import { SPECIES, STAGES, effectivenessLabel, moveOf, speciesOf, typeEffectiveness, typeLabel } from './content.js'
import {
  MAX_CAPTURE_ATTEMPTS,
  abandonBattle,
  attemptCapture,
  canAttemptCapture,
  canNormalEvolve,
  captureChance,
  clearFinishedBattle,
  currentPlayerHp,
  describeEvolutionCondition,
  evolveInstance,
  isStageUnlocked,
  levelsUntilEvolution,
  setTeam,
  stageById,
  startBattle,
  statsFor,
  switchBattleMonster,
  useMove,
  xpToNext
} from './engine.js'
import { CAPTURE_ITEM_IDS, specialProgressionStatus } from './progression.js'
import './game.css'

const CAPTURE_META = {
  star: { label: 'ほしのわ', icon: '⭐' },
  silver: { label: 'ぎんのわ', icon: '⚪' },
  gold: { label: 'きんのわ', icon: '🟡' },
  rainbow: { label: 'にじのわ', icon: '🌈' }
}

function TypePills({ types = [] }) {
  return <div className="type-pills">{types.map((type) => <span key={type}>{typeLabel(type)}</span>)}</div>
}

function HpBar({ value, max }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return <div className="hp-wrap"><div className="hp-fill" style={{ width: `${ratio * 100}%` }} /></div>
}

function StageMap({ game, onStart, goStudy, goHome }) {
  return (
    <main className="screen adventure-map">
      <button className="back" onClick={goHome}>← ホーム</button>
      <div className="screen-title-row"><div><p className="eyebrow">ぼうけんマップ</p><h1>はじまりの森（仮）</h1></div><strong>🎫 {game.tickets}</strong></div>
      <p className="kid-note">敵のレベルはステージごとに決まっているよ。育てた仲間で戻ると、ぐっと強く感じられる！</p>
      <div className="stage-list">
        {STAGES.map((stage) => {
          const unlocked = isStageUnlocked(game, stage)
          const cleared = (game.stagesCleared || []).includes(stage.id)
          const enemy = speciesOf(stage.enemySpeciesId)
          return (
            <button key={stage.id} className={`stage-card ${!unlocked ? 'locked' : ''}`} disabled={!unlocked} onClick={() => onStart(stage.id)}>
              <div className="stage-number">{cleared ? '✅' : unlocked ? '⚔️' : '🔒'}</div>
              <div className="stage-copy"><strong>{stage.label}</strong><span>{enemy.name}　Lv.{stage.enemyLevel}</span><TypePills types={enemy.types} /></div>
              <div className="stage-cost">🎫×1</div>
            </button>
          )
        })}
      </div>
      {game.tickets < 1 && <section className="no-ticket"><h2>チケットが ないよ</h2><p>今日の基本学習のあと、自由学習1問正解で 🎫+1！</p><button className="primary" onClick={goStudy}>まなぶ！</button></section>}
    </main>
  )
}

function BattleView({ game, setGame, onExitToMap, goStudy }) {
  const battle = game.activeBattle
  const active = game.box[battle.activeInstanceId]
  const playerSpecies = speciesOf(active.speciesId)
  const enemySpecies = speciesOf(battle.enemy.speciesId)
  const playerMax = statsFor(active.speciesId, active.level).hp
  const playerHp = currentPlayerHp(battle)
  const chance = captureChance(battle)
  const finished = ['won', 'lost', 'caught'].includes(battle.status)
  const forcedSwitch = battle.status === 'needs_switch'

  const act = (moveId) => {
    const result = useMove(game, battle, moveId)
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
    if (finished) {
      const result = clearFinishedBattle(game)
      if (result.ok) setGame(result.game)
      onExitToMap()
      return
    }
    if (typeof window !== 'undefined' && !window.confirm('バトルを やめる？ チケット1まいは つかったままだよ。')) return
    const result = abandonBattle(game)
    if (result.ok) setGame(result.game)
    onExitToMap()
  }

  return (
    <main className="screen battle-screen-v2">
      <div className="battle-head"><button className="back" onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button><strong>{stageById(battle.stageId)?.label}</strong><span>TURN {battle.turn}</span></div>
      <section className="battle-arena-v2">
        <div className="fighter enemy-fighter">
          <div className="fighter-info"><strong>{enemySpecies.name}</strong><span>Lv.{battle.enemy.level}</span><TypePills types={enemySpecies.types} /><HpBar value={battle.enemy.hp} max={battle.enemy.maxHp} /><small>HP {battle.enemy.hp}/{battle.enemy.maxHp}</small></div>
          <PlaceholderMonster speciesId={battle.enemy.speciesId} />
        </div>
        <div className="fighter player-fighter">
          <PlaceholderMonster speciesId={active.speciesId} />
          <div className="fighter-info"><strong>{playerSpecies.name}</strong><span>Lv.{active.level}</span><TypePills types={playerSpecies.types} /><HpBar value={playerHp} max={playerMax} /><small>HP {playerHp}/{playerMax}</small></div>
        </div>
      </section>

      <section className="battle-log">{battle.log.slice(-3).map((line, i) => <p key={`${line}-${i}`}>{line}</p>)}</section>

      {!finished && !forcedSwitch && <>
        <section className="move-grid">
          {playerSpecies.moves.slice(0, 4).map((moveId) => {
            const move = moveOf(moveId)
            const factor = typeEffectiveness(move.type, enemySpecies.types)
            return <button key={moveId} onClick={() => act(moveId)}><strong>{move.name}</strong><span>{typeLabel(move.type)}　威力 {move.power}</span><em className={`effect effect-${String(factor).replace('.', '-')}`}>{effectivenessLabel(factor)}</em></button>
          })}
        </section>

        <section className="battle-tools">
          <div className="capture-stars" aria-label="捕獲4段階">{Array.from({ length: 4 }, (_, i) => <span key={i}>{i < battle.captureStars ? '★' : '☆'}</span>)}</div>
          <p>「わ」は1バトル最大3回：{battle.captureAttempts || 0}/{MAX_CAPTURE_ATTEMPTS}　成功率目安 {Math.round(chance * 100)}%</p>
          <div className="capture-item-grid">{CAPTURE_ITEM_IDS.map((id) => {
            const meta = CAPTURE_META[id]
            const ready = canAttemptCapture(game, battle, id)
            return <button key={id} className={ready ? 'capture-ready' : ''} disabled={!ready} onClick={() => capture(id)}>{meta.icon} {meta.label}<small>×{game.captureItems?.[id] || 0}</small></button>
          })}</div>
        </section>
      </>}

      {forcedSwitch && <section className="battle-result-card"><h2>つぎの なかまを えらぼう！</h2><p>まだ元気な仲間がいるから、バトルは続けられるよ。</p></section>}

      {!finished && <section className="team-switch"><h3>{forcedSwitch ? 'こうたい ひっす' : 'こうたい（交代すると相手も1回こうげき）'}</h3><div>{game.team.map((id) => {
        const member = game.box[id]
        const sp = speciesOf(member.speciesId)
        const hp = battle.partyHp?.[id] || 0
        const max = statsFor(member.speciesId, member.level).hp
        return <button key={id} disabled={id === battle.activeInstanceId || hp <= 0} onClick={() => swap(id)}><PlaceholderMonster speciesId={member.speciesId} compact /><span>{sp.name}<small>Lv.{member.level}　HP {hp}/{max}</small><TypePills types={sp.types} /></span></button>
      })}</div></section>}

      {finished && <section className="battle-result-card">
        <h2>{battle.status === 'won' ? 'かち！ 🎉' : battle.status === 'caught' ? 'ゲット！ ★★★★' : 'まけちゃった…'}</h2>
        {battle.status === 'caught' && <p>新しい仲間はボックスに入ったよ。手持ちが2体以下なら自動でチーム入り！</p>}
        {battle.status === 'lost' && <p>学習でチケットを増やしたり、仲間を育てて再挑戦しよう。</p>}
        <button className="primary" onClick={exit}>マップへ</button>
        {game.tickets < 1 && <button className="secondary" onClick={goStudy}>まなぶ！</button>}
      </section>}
    </main>
  )
}

export function AdventureFlow({ game, setGame, goHome, goStudy }) {
  const [mapNonce, setMapNonce] = useState(0)
  const start = (stageId) => {
    const result = startBattle(game, stageId)
    if (!result.ok) {
      if (result.reason === 'NO_TICKET') goStudy()
      return
    }
    setGame(result.game)
  }
  if (game.activeBattle) return <BattleView game={game} setGame={setGame} onExitToMap={() => setMapNonce((n) => n + 1)} goStudy={goStudy} />
  return <StageMap key={mapNonce} game={game} onStart={start} goStudy={goStudy} goHome={goHome} />
}

function MonsterRow({ monster, game, setGame, selected, setSelected }) {
  const species = speciesOf(monster.speciesId)
  const inTeam = game.team.includes(monster.instanceId)
  const evoLeft = levelsUntilEvolution(monster)
  const addToTeam = () => {
    if (inTeam || game.team.length >= 3) return
    const result = setTeam(game, [...game.team, monster.instanceId])
    if (result.ok) setGame(result.game)
  }
  const removeFromTeam = () => {
    if (!inTeam || game.team.length <= 1) return
    const result = setTeam(game, game.team.filter((id) => id !== monster.instanceId))
    if (result.ok) setGame(result.game)
  }
  return <article className={`monster-row ${selected ? 'selected' : ''}`} onClick={() => setSelected(monster.instanceId)}>
    <PlaceholderMonster speciesId={monster.speciesId} compact />
    <div className="monster-row-main"><strong>{species.name}</strong><span>Lv.{monster.level}　XP {monster.xp}/{xpToNext(monster.level)}</span><TypePills types={species.types} /><small>{!species.evolution ? '通常進化：最終形' : evoLeft === 0 ? '✨ いま進化できる！' : evoLeft == null ? describeEvolutionCondition(monster) : `進化まで あと ${evoLeft} レベル`}</small></div>
    <div className="team-actions">{inTeam ? <button disabled={game.team.length <= 1} onClick={(e) => { e.stopPropagation(); removeFromTeam() }}>手持ちから外す</button> : <button disabled={game.team.length >= 3} onClick={(e) => { e.stopPropagation(); addToTeam() }}>手持ちに入れる</button>}</div>
  </article>
}

function DetailPanel({ game, setGame, instanceId }) {
  const monster = game.box[instanceId]
  if (!monster) return null
  const species = speciesOf(monster.speciesId)
  const stats = statsFor(monster.speciesId, monster.level)
  const special = specialProgressionStatus(monster, game)
  const evolve = () => {
    const result = evolveInstance(game, instanceId)
    if (result.ok) setGame(result.game)
  }
  return <section className="monster-detail-v2">
    <div className="monster-detail-hero"><PlaceholderMonster speciesId={monster.speciesId} /><div><h2>{species.name}</h2><p>Lv.{monster.level} / 進化段階 {species.stage}</p><TypePills types={species.types} /></div></div>
    <div className="stat-grid"><span>HP <b>{stats.hp}</b></span><span>こうげき <b>{stats.attack}</b></span><span>ぼうぎょ <b>{stats.defense}</b></span><span>すばやさ <b>{stats.speed}</b></span></div>
    <div className="evo-progress"><strong>通常進化</strong>{species.evolution ? <><p>次：{speciesOf(species.evolution.to).name}</p><p>{canNormalEvolve(monster, game) ? '条件達成！' : describeEvolutionCondition(monster)}</p><button className="primary" disabled={!canNormalEvolve(monster, game)} onClick={evolve}>進化させる！</button></> : <p>最終進化まで到達！</p>}</div>
    <div className="special-cards">
      <article><strong>🔷 {special.giga.label}</strong><p>{!special.giga.isFinal ? 'まずは最終進化をめざそう！' : !special.giga.eligibleSpecies ? 'このモンスターは対象外' : special.giga.hasKey && special.giga.hasCore ? '必要な所有権はそろっている（発動条件は未接続）' : 'ギガキー／種族専用ギガコアを集めよう'}</p><small>ギガキーは永久所持、ギガコアは種族ごとの永久解放として保存</small></article>
      <article><strong>💥 {special.burst.label}</strong><p>{special.burst.hasMark ? 'この種族の「しるし」を所持' : '対象種族の「しるし」は未取得'}</p><small>取得条件は設計確定後に接続</small></article>
    </div>
  </section>
}

function DexGrid({ game }) {
  const speciesList = Object.values(SPECIES)
  const seen = game.dex?.seen || {}
  const caught = game.dex?.caught || {}
  return <div className="dex-grid">{speciesList.map((species) => <div key={species.id} className={seen[species.id] ? 'seen' : 'unknown'}>{seen[species.id] ? <PlaceholderMonster speciesId={species.id} compact /> : <div className="silhouette">?</div>}<strong>{seen[species.id] ? species.name : '？？？'}</strong><span>{caught[species.id] ? '✅ GET' : seen[species.id] ? '👀 発見' : '未発見'}</span></div>)}</div>
}

export function MonsterScreen({ game, setGame, goHome }) {
  const [tab, setTab] = useState('team')
  const [selected, setSelected] = useState(game.activeMonsterId)
  const box = useMemo(() => Object.values(game.box || {}).sort((a, b) => b.level - a.level), [game.box])
  const team = game.team.map((id) => game.box[id]).filter(Boolean)
  const caughtCount = Object.keys(game.dex?.caught || {}).length
  const seenCount = Object.keys(game.dex?.seen || {}).length

  return <main className="screen monster-screen-v2">
    <button className="back" onClick={goHome}>← ホーム</button>
    <div className="screen-title-row"><div><p className="eyebrow">モンスター</p><h1>育成・図鑑</h1></div><span>GET {caughtCount} / 発見 {seenCount}</span></div>
    <div className="monster-tabs"><button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>手持ち {team.length}/3</button><button className={tab === 'box' ? 'active' : ''} onClick={() => setTab('box')}>ボックス {box.length}</button><button className={tab === 'dex' ? 'active' : ''} onClick={() => setTab('dex')}>図鑑</button></div>
    {tab === 'team' && <><div className="monster-list">{team.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} /></>}
    {tab === 'box' && <><p className="kid-note">手持ちは3体まで。タイプのちがう仲間を組み合わせよう！</p><div className="monster-list">{box.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} /></>}
    {tab === 'dex' && <><p className="kid-note">キャラクター画像・正式名は別検討中。ここでは発見・捕獲・進化の仕組みだけ実装しています。</p><DexGrid game={game} /></>}
  </main>
}
