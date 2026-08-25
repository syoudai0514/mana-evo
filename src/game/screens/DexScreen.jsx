import React, { useMemo, useState } from 'react'
import { MonsterArt } from '../PlaceholderMonster.jsx'
import { AREA_META, SPECIES, TYPES } from '../content.js'
import { ACTIVE_MONSTER_IDS, monsterDescriptionOf } from '../monsterData.js'
import { TypePills } from './GameScreenPrimitives.jsx'

function DexDetail({ speciesId, game, onClose }) {
  const species = SPECIES[speciesId]
  const description = monsterDescriptionOf(speciesId)
  if (!species) return null

  const seen = game.dex?.seen || {}
  const caught = game.dex?.caught || {}
  const nextSpecies = species.evolution?.to ? SPECIES[species.evolution.to] : null
  const nextLabel = !nextSpecies
    ? 'さいしゅうけいたい'
    : seen[nextSpecies.id]
      ? `つぎ：No.${nextSpecies.no} ${nextSpecies.name}`
      : 'つぎの すがたが あるよ'

  return <section className="dex-detail" role="dialog" aria-label={`${species.name}の ずかん`}>
    <button className="secondary" onClick={onClose}>← ずかんへ</button>
    <div className="monster-detail-hero">
      <MonsterArt speciesId={speciesId} size={150} />
      <div>
        <p className="eyebrow">No.{species.no}</p>
        <h2>{species.name}</h2>
        <TypePills types={species.types} />
        <p>{caught[speciesId] ? '✅ GETずみ' : '👀 はっけんずみ'}</p>
      </div>
    </div>
    {description?.description && <p className="monster-description">{description.description}</p>}
    <p className="kid-note">シンカ：{nextLabel}</p>
  </section>
}

export function DexGrid({ game }) {
  const [area, setArea] = useState(0)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [showTools, setShowTools] = useState(false)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null)
  const seen = game.dex?.seen || {}
  const caught = game.dex?.caught || {}
  const seenCount = ACTIVE_MONSTER_IDS.filter((id) => seen[id]).length
  const caughtCount = ACTIVE_MONSTER_IDS.filter((id) => caught[id]).length

  const speciesList = useMemo(() => ACTIVE_MONSTER_IDS
    .map((id) => SPECIES[id])
    .filter(Boolean)
    .filter((species) => {
      if (area && species.area !== area) return false
      if (type !== 'all' && !species.types.includes(type)) return false
      if (search.trim()) {
        const needle = search.trim().toLowerCase()
        if (!`${species.no} ${species.name} ${species.family}`.toLowerCase().includes(needle)) return false
      }
      return true
    }), [area, type, search])

  if (selectedSpeciesId) {
    return <DexDetail speciesId={selectedSpeciesId} game={game} onClose={() => setSelectedSpeciesId(null)} />
  }

  return <section className="dex-screen" aria-label="モンスターずかん">
    <div className="monster-hq-progress">
      <span><strong>{caughtCount}</strong><small>/238 GET</small></span>
      <span><strong>{seenCount}</strong><small>/238 はっけん</small></span>
    </div>
    <p className="kid-note">みつけた モンスターから 1たい えらんで みてみよう。</p>

    <button className="secondary" aria-expanded={showTools} onClick={() => setShowTools((value) => !value)}>🔎 しぼりこむ</button>
    {showTools && <div className="dex-filters">
      <select value={area} onChange={(event) => setArea(Number(event.target.value))} aria-label="エリアで しぼる">
        <option value={0}>ぜんエリア</option>
        {AREA_META.map((meta) => <option key={meta.area} value={meta.area}>エリア{meta.area} {meta.name}</option>)}
      </select>
      <select value={type} onChange={(event) => setType(event.target.value)} aria-label="タイプで しぼる">
        <option value="all">ぜんタイプ</option>
        {TYPES.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.label}</option>)}
      </select>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="なまえ・No.で さがす" aria-label="なまえや ナンバーで さがす" />
    </div>}

    <div className="dex-grid">
      {speciesList.map((species) => {
        const isSeen = !!seen[species.id]
        const isCaught = !!caught[species.id]
        return <div key={species.id} className={isCaught ? 'caught' : isSeen ? 'seen' : 'unknown'}>
          <button type="button" className="dex-species-tile" disabled={!isSeen} onClick={() => setSelectedSpeciesId(species.id)} aria-label={isSeen ? `No.${species.no} ${species.name}` : `No.${species.no} みはっけん`}>
            <small>No.{species.no}</small>
            {isSeen ? <MonsterArt speciesId={species.id} compact /> : <div className="silhouette" aria-hidden="true">?</div>}
            <strong>{isSeen ? species.name : '？？？'}</strong>
            <span>{isCaught ? '✅ GET' : isSeen ? '👀 はっけん' : 'みはっけん'}</span>
          </button>
        </div>
      })}
    </div>
  </section>
}
