import React, { useMemo, useState } from 'react'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { AREA_META, SPECIES, TYPES } from '../content.js'

export function DexGrid({ game }) {
  const [area, setArea] = useState(0)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const speciesList = useMemo(() => Object.values(SPECIES).sort((a, b) => Number(a.no) - Number(b.no)).filter((species) => {
    if (area && species.area !== area) return false
    if (type !== 'all' && !species.types.includes(type)) return false
    if (search.trim()) {
      const needle = search.trim().toLowerCase()
      if (!`${species.no} ${species.name} ${species.family}`.toLowerCase().includes(needle)) return false
    }
    return true
  }), [area, type, search])
  const seen = game.dex?.seen || {}
  const caught = game.dex?.caught || {}

  return <>
    <div className="dex-filters">
      <select value={area} onChange={(event) => setArea(Number(event.target.value))}><option value={0}>ぜんエリア</option>{AREA_META.map((meta) => <option key={meta.area} value={meta.area}>エリア{meta.area} {meta.name}</option>)}</select>
      <select value={type} onChange={(event) => setType(event.target.value)}><option value="all">ぜんタイプ</option>{TYPES.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.label}</option>)}</select>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="なまえ・No.で さがす" />
    </div>
    <div className="dex-grid">{speciesList.map((species) => <div key={species.id} className={seen[species.id] ? 'seen' : 'unknown'}><small>No.{species.no}</small>{seen[species.id] ? <PlaceholderMonster speciesId={species.id} compact /> : <div className="silhouette">?</div>}<strong>{seen[species.id] ? species.name : '？？？'}</strong><span>{caught[species.id] ? '✅ GET' : seen[species.id] ? '👀 発見' : '未発見'}{game.specialDex?.giga?.[species.id] ? '　🔷ギガ登録' : ''}{game.specialDex?.burst?.[species.id] ? '　💥バースト登録' : ''}</span></div>)}</div>
  </>
}
