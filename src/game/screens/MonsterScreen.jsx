import React, { useEffect, useMemo, useState } from 'react'
import { MonsterArt } from '../PlaceholderMonster.jsx'
import { EVOLUTION_ITEMS, speciesOf } from '../content.js'
import {
  canNormalEvolve,
  describeEvolutionCondition,
  evolveInstance,
  levelsUntilEvolution,
  setTeam,
  statsFor,
  xpToNext
} from '../engine.js'
import { monsterDescriptionOf } from '../monsterData.js'
import { equipHeldItem, specialProgressionStatus } from '../progression.js'
import { DexGrid } from './DexScreen.jsx'
import { EvolutionCelebration } from './EvolutionOverlay.jsx'
import { TypePills } from './GameScreenPrimitives.jsx'
import { LAYOUT_SURFACES } from '../../ui/layoutSurface.js'

function MonsterRow({ monster, game, setGame, selected, setSelected, showcase = false, slotIndex = null }) {
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
  const evolutionHint = !species.evolution
    ? 'さいしゅうけいたい'
    : canNormalEvolve(monster, game)
      ? '✨ いま シンカできる！'
      : evoLeft == null
        ? describeEvolutionCondition(monster)
        : `シンカまで あと ${evoLeft} レベル`

  return <article className={`monster-row ${showcase ? 'showcase' : ''} ${selected ? 'selected' : ''}`} onClick={() => setSelected(monster.instanceId)} aria-current={selected ? 'true' : undefined}>
    {slotIndex != null && <span className="team-slot-badge">{slotIndex + 1}ばん{slotIndex === 0 ? '・さいしょ' : ''}</span>}
    <MonsterArt speciesId={monster.speciesId} size={showcase ? 92 : 56} compact={!showcase} />
    <div className="monster-row-main">
      <strong>No.{species.no} {species.name}</strong>
      <span>Lv.{monster.level}　XP {monster.xp}/{xpToNext(monster.level)}</span>
      <TypePills types={species.types} />
      <small>{evolutionHint}</small>
    </div>
    <div className="team-actions">
      {inTeam
        ? <button disabled={game.team.length <= 1} onClick={(event) => { event.stopPropagation(); removeFromTeam() }}>チームから はずす</button>
        : <button disabled={game.team.length >= 3} onClick={(event) => { event.stopPropagation(); addToTeam() }}>チームに いれる</button>}
    </div>
  </article>
}

function SpecialStatus({ label, status }) {
  if (!status?.eligibleSpecies) return null
  return <article className="eligible">
    <strong>{label}</strong>
    <p>{status.activatable ? '✅ バトルで つかえる！' : status.registered ? '📖 ずかんに とうろくずみ' : 'まだ つかえないよ'}</p>
  </article>
}

function DetailPanel({ game, setGame, instanceId, onEvolution }) {
  const [showEvolutionHelp, setShowEvolutionHelp] = useState(false)
  const monster = game.box[instanceId]
  if (!monster) return null

  const species = speciesOf(monster.speciesId)
  const description = monsterDescriptionOf(monster.speciesId)
  const stats = statsFor(monster.speciesId, monster.level)
  const special = specialProgressionStatus(monster, game)
  const ready = canNormalEvolve(monster, game)
  const nextSpecies = species.evolution ? speciesOf(species.evolution.to) : null

  const evolve = () => {
    const fromId = monster.speciesId
    const level = monster.level
    const result = evolveInstance(game, instanceId)
    if (result.ok) {
      setGame(result.game)
      onEvolution?.({
        fromId,
        toId: result.to,
        level,
        firstEvolutionDiscovery: result.firstEvolutionDiscovery === true
      })
    }
  }

  const equipRequiredItem = () => {
    const itemId = species.evolution?.heldItemId
    if (!itemId) return
    const result = equipHeldItem(game, instanceId, itemId)
    if (result.ok) setGame(result.game)
  }

  return <section className="monster-detail-v2" aria-label={`${species.name}の しょうさい`}>
    <div className="monster-detail-hero">
      <MonsterArt speciesId={monster.speciesId} size={178} />
      <div>
        <p className="eyebrow">No.{species.no} / {species.family}</p>
        <h2>{species.name}</h2>
        <p>Lv.{monster.level} / シンカ {species.stage}/{species.maxStage}</p>
        <TypePills types={species.types} />
      </div>
    </div>

    <div className="evo-progress">
      <strong>つぎの シンカ</strong>
      {species.evolution ? <>
        <p>→ No.{nextSpecies?.no} {nextSpecies?.name}</p>
        <p>{ready ? '✨ じゅんび OK！' : describeEvolutionCondition(monster)}</p>
        {species.evolution.method === 'stone' && <small>もっている：{EVOLUTION_ITEMS.stones[species.evolution.itemId]?.name} ×{game.evolutionItems?.stones?.[species.evolution.itemId] || 0}</small>}
        {species.evolution.method === 'held_item_levelup' && <>
          <small>もっている：{EVOLUTION_ITEMS.heldItems[species.evolution.heldItemId]?.name} ×{game.evolutionItems?.heldItems?.[species.evolution.heldItemId] || 0} ／ もたせた：{monster.heldItemId === species.evolution.heldItemId ? 'OK' : 'まだ'}</small>
          {monster.heldItemId !== species.evolution.heldItemId && (game.evolutionItems?.heldItems?.[species.evolution.heldItemId] || 0) > 0 && <button className="secondary" onClick={equipRequiredItem}>ひつような もちものを もたせる</button>}
        </>}
        {ready && <button className="primary" onClick={evolve}>✨ いま シンカする！</button>}
      </> : <p>この すがたが さいしゅうけいたい！</p>}
    </div>

    {description?.description && <p className="monster-description">{description.description}</p>}

    <div className="stat-grid">
      <span>HP <b>{stats.hp}</b></span>
      <span>こうげき <b>{stats.attack}</b></span>
      <span>ぼうぎょ <b>{stats.defense}</b></span>
      <span>すばやさ <b>{stats.speed}</b></span>
    </div>

    <button className="secondary" aria-expanded={showEvolutionHelp} onClick={() => setShowEvolutionHelp((value) => !value)}>シンカの ほうほう</button>
    {showEvolutionHelp && <section className="evolution-explain-card">
      <h3>シンカの せつめい</h3>
      <p>{species.evolution ? `この子は「${describeEvolutionCondition(monster)}」だよ。` : 'この子は もう さいしゅうけいたいだよ。'}</p>
      <p>じぶんで シンカすると、その すがたが ずかんに のこり、ぼうけんで であえる こうほになるよ。</p>
    </section>}

    {(special.giga.eligibleSpecies || special.burst.eligibleSpecies) && <section className="special-cards" aria-label="とくべつな すがた">
      <SpecialStatus label="🔷 ギガシンカ" status={special.giga} />
      <SpecialStatus label="💥 キョダイバースト" status={special.burst} />
    </section>}
  </section>
}

export function MonsterScreen({ game, setGame, onLayoutSurfaceChange }) {
  const [tab, setTab] = useState('team')
  const [selected, setSelected] = useState(game.activeMonsterId || game.team?.[0] || Object.keys(game.box || {})[0] || null)
  const [evolutionReveal, setEvolutionReveal] = useState(null)
  const box = useMemo(() => Object.values(game.box || {}).sort((a, b) => b.level - a.level), [game.box])
  const team = game.team.map((id) => game.box[id]).filter(Boolean)

  useEffect(() => {
    onLayoutSurfaceChange?.(tab === 'dex' ? LAYOUT_SURFACES.WORKSPACE : LAYOUT_SURFACES.COMPACT)
    return () => onLayoutSurfaceChange?.(LAYOUT_SURFACES.COMPACT)
  }, [tab, onLayoutSurfaceChange])

  return <main className="screen monster-screen-v2">
    {evolutionReveal && <EvolutionCelebration reveal={evolutionReveal} onClose={() => setEvolutionReveal(null)} />}

    <section className="monster-hq-hero">
      <div>
        <p className="eyebrow">MONSTER</p>
        <h1>モンスター</h1>
        <p>まず チームから 1たい えらぼう。</p>
      </div>
      <div className="monster-hq-progress"><span><strong>{team.length}</strong><small>/3 チーム</small></span></div>
    </section>

    <div className="monster-tabs" aria-label="モンスターの メニュー">
      <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>⚔️ チーム {team.length}/3</button>
      <button className={tab === 'box' ? 'active' : ''} onClick={() => setTab('box')}>📦 ボックス {box.length}</button>
      <button className={tab === 'dex' ? 'active' : ''} onClick={() => setTab('dex')}>📖 ずかん</button>
    </div>

    {tab === 'team' && <>
      <p className="kid-note">1ばんの なかまが バトルで さいしょに でるよ。えらぶと くわしく みられるよ。</p>
      <div className="monster-list team-showcase">
        {team.map((monster, index) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} slotIndex={index} showcase />)}
      </div>
      <DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} />
    </>}

    {tab === 'box' && <>
      <p className="kid-note">ボックスは もっている モンスター。チームは そのなかから 3たいまで えらべるよ。</p>
      <DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} />
      <div className="monster-list">
        {box.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}
      </div>
    </>}

    {tab === 'dex' && <DexGrid game={game} />}
  </main>
}
