import React, { useMemo, useState } from 'react'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { EVOLUTION_ITEMS, moveOf, speciesOf, typeLabel } from '../content.js'
import {
  canNormalEvolve,
  describeEvolutionCondition,
  evolveInstance,
  levelsUntilEvolution,
  setTeam,
  statsFor,
  xpToNext
} from '../engine.js'
import { equipHeldItem, specialProgressionStatus } from '../progression.js'
import { DexGrid } from './DexScreen.jsx'
import { EvolutionCelebration } from './EvolutionOverlay.jsx'
import { TypePills } from './GameScreenPrimitives.jsx'

function MonsterRow({ monster, game, setGame, selected, setSelected, showcase = false }) {
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
  return <article className={`monster-row ${showcase ? 'showcase' : ''} ${selected ? 'selected' : ''}`} onClick={() => setSelected(monster.instanceId)}>
    <PlaceholderMonster speciesId={monster.speciesId} size={showcase ? 92 : 56} compact={!showcase} />
    <div className="monster-row-main"><strong>No.{species.no} {species.name}</strong><span>Lv.{monster.level}　XP {monster.xp}/{xpToNext(monster.level)}</span><TypePills types={species.types} /><small>{!species.evolution ? '通常進化：最終形' : evoLeft === 0 ? '✨ いま進化できる！' : evoLeft == null ? describeEvolutionCondition(monster) : `進化まで あと ${evoLeft} レベル`}</small></div>
    <div className="team-actions">{inTeam ? <button disabled={game.team.length <= 1} onClick={(e) => { e.stopPropagation(); removeFromTeam() }}>手持ちから外す</button> : <button disabled={game.team.length >= 3} onClick={(e) => { e.stopPropagation(); addToTeam() }}>手持ちに入れる</button>}</div>
  </article>
}

function DetailPanel({ game, setGame, instanceId, onEvolution }) {
  const monster = game.box[instanceId]
  if (!monster) return null
  const species = speciesOf(monster.speciesId)
  const stats = statsFor(monster.speciesId, monster.level)
  const special = specialProgressionStatus(monster, game)
  const evolve = () => {
    const fromId = monster.speciesId
    const level = monster.level
    const result = evolveInstance(game, instanceId)
    if (result.ok) {
      setGame(result.game)
      onEvolution?.({ fromId, toId: result.to, level })
    }
  }
  const equipRequiredItem = () => {
    const itemId = species.evolution?.heldItemId
    if (!itemId) return
    const result = equipHeldItem(game, instanceId, itemId)
    if (result.ok) setGame(result.game)
  }
  const nextSpecies = species.evolution ? speciesOf(species.evolution.to) : null

  return <section className="monster-detail-v2">
    <div className="monster-detail-hero"><PlaceholderMonster speciesId={monster.speciesId} size={178} /><div><p className="eyebrow">No.{species.no} / {species.family}</p><h2>{species.name}</h2><p>Lv.{monster.level} / 進化段階 {species.stage}/{species.maxStage}</p><TypePills types={species.types} /></div></div>
    <p className="monster-description">{species.description}</p>
    <div className="stat-grid"><span>HP <b>{stats.hp}</b></span><span>こうげき <b>{stats.attack}</b></span><span>ぼうぎょ <b>{stats.defense}</b></span><span>すばやさ <b>{stats.speed}</b></span></div>
    <section className="formal-moves"><h3>わざ</h3>{species.moves.map((moveId) => { const move = moveOf(moveId); return <div key={moveId}><strong>{move.name}</strong><span>{typeLabel(move.type)}</span><small>{move.effect?.type === 'heal' ? 'HP20%かいふく・1バトル1回' : `威力${move.power} / 命中${move.accuracy} / ${move.role}`}</small></div> })}</section>
    <div className="evo-progress"><strong>通常進化</strong>{species.evolution ? <><p>次：No.{nextSpecies?.no} {nextSpecies?.name}</p><p>{canNormalEvolve(monster, game) ? '✨ 条件達成！' : describeEvolutionCondition(monster)}</p>{species.evolution.method === 'stone' && <small>所持：{EVOLUTION_ITEMS.stones[species.evolution.itemId]?.name} ×{game.evolutionItems?.stones?.[species.evolution.itemId] || 0}</small>}{species.evolution.method === 'held_item_levelup' && <><small>所持：{EVOLUTION_ITEMS.heldItems[species.evolution.heldItemId]?.name} ×{game.evolutionItems?.heldItems?.[species.evolution.heldItemId] || 0} ／ 装備：{monster.heldItemId === species.evolution.heldItemId ? '済み' : 'なし'}</small>{monster.heldItemId !== species.evolution.heldItemId && (game.evolutionItems?.heldItems?.[species.evolution.heldItemId] || 0) > 0 && <button className="secondary" onClick={equipRequiredItem}>必要なもちものを持たせる</button>}</>}<button className="primary" disabled={!canNormalEvolve(monster, game)} onClick={evolve}>✨ いま シンカする！</button></> : <p>最終進化まで到達！</p>}</div>
    <section className="evolution-method-guide"><h3>⭐ シンカの ほうほう</h3><div><span>⬆️<b>レベルで シンカ</b></span><span>💎<b>いしで シンカ</b></span><span>🎒<b>もちもの + つぎのレベル</b></span></div></section>
    <section className="evolution-explain-card"><h3>📖 シンカの せつめい</h3><p>🚫 つかまえたあと すぐの シンカは できない</p><p>🌱 そだてて <b>じぶんで シンカ</b>するのが だいじ</p><p>✨ じぶんで シンカすると <b>第2けいたいの ばしょ</b>が ひらく</p><p>⚔️ シンカできると バトルけっかから そのまま すすめる</p></section>
    <div className="special-cards">
      <article className={special.giga.eligibleSpecies ? 'eligible' : ''}><strong>🔷 ギガシンカ</strong><p>{!special.giga.isFinal ? 'まずは最終進化をめざそう！' : !special.giga.eligibleSpecies ? 'このモンスターは対象外' : special.giga.activatable ? '✅ バトルで発動できる！' : !special.giga.hasKey ? 'まずエリア1ボスで ギガキーを ひらこう' : '専用ギガしれんをクリアして ギガコアをGETしよう'}</p><small>対象12体。全能力×1.35。{special.giga.registered ? '図鑑にギガのすがた登録済み。' : ''}</small></article>
      <article className={special.burst.eligibleSpecies ? 'eligible' : ''}><strong>💥 キョダイバースト</strong><p>{!special.burst.isFinal ? 'まずは最終進化をめざそう！' : !special.burst.eligibleSpecies ? 'このモンスターは対象外' : special.burst.activatable ? '✅ バトルで発動できる！' : '専用バーストしれんをクリアして しるしをGETしよう'}</p><small>対象8体。3ターン、HP×2・こうげき×1.2・主力技が専用技に変化。{special.burst.registered ? '図鑑にバーストのすがた登録済み。' : ''}</small></article>
    </div>
  </section>
}

export function MonsterScreen({ game, setGame, goHome }) {
  const [tab, setTab] = useState('team')
  const [selected, setSelected] = useState(game.activeMonsterId)
  const [evolutionReveal, setEvolutionReveal] = useState(null)
  const box = useMemo(() => Object.values(game.box || {}).sort((a, b) => b.level - a.level), [game.box])
  const team = game.team.map((id) => game.box[id]).filter(Boolean)
  const caughtCount = Object.keys(game.dex?.caught || {}).length
  const seenCount = Object.keys(game.dex?.seen || {}).length

  return <main className="screen monster-screen-v2">
    {evolutionReveal && <EvolutionCelebration reveal={evolutionReveal} onClose={() => setEvolutionReveal(null)} />}
    <button className="back" onClick={goHome}>← ホーム</button>
    <section className="monster-hq-hero">
      <div><p className="eyebrow">MONSTER BASE</p><h1>そだてる・シンカ</h1><p>3たいの なかまと つよくなろう。シンカできる なかまは ここで光るよ。</p></div>
      <div className="monster-hq-progress"><span><strong>{caughtCount}</strong><small>/238 GET</small></span><span><strong>{seenCount}</strong><small>/238 はっけん</small></span></div>
    </section>
    <div className="monster-tabs"><button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>⚔️ チーム {team.length}/3</button><button className={tab === 'box' ? 'active' : ''} onClick={() => setTab('box')}>📦 ボックス {box.length}</button><button className={tab === 'dex' ? 'active' : ''} onClick={() => setTab('dex')}>📖 ずかん</button></div>
    {tab === 'team' && <><div className="monster-list team-showcase">{team.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} showcase />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}
    {tab === 'box' && <><p className="kid-note">つれていけるのは3たい。タイプや シンカの近さをみて チームをつくろう！</p><div className="monster-list">{box.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}
    {tab === 'dex' && <><p className="kid-note">みつけると シルエットがひらき、GETすると カラーで とうろく。ギガ・バーストの すがたも 同じずかんに のこるよ。</p><DexGrid game={game} /></>}
  </main>
}
