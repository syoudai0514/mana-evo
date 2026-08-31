import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MonsterArt } from '../PlaceholderMonster.jsx'
import { AREA_META, SPECIES, TYPES } from '../content.js'
import { ACTIVE_MONSTER_IDS, monsterDescriptionOf } from '../monsterData.js'
import { prefetchDexSpecies } from '../../platform/dexArtPack.js'
import { TypePills } from './GameScreenPrimitives.jsx'

const DEX_HISTORY_DETAIL = 'manaevo-dex-detail-v1'
const DEX_HISTORY_GRID = 'manaevo-dex-grid-v1'
const DEX_SESSION_KEY = 'manaevo-dex-browse-context-v1'

function readSessionContext() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DEX_SESSION_KEY) || 'null')
    return parsed?.version === 1 ? parsed.context : null
  } catch {
    return null
  }
}

function writeSessionContext(context) {
  try { sessionStorage.setItem(DEX_SESSION_KEY, JSON.stringify({ version: 1, context })) } catch {}
}

function NearViewportMonsterArt({ speciesId }) {
  const hostRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = hostRef.current
    if (!node) return undefined

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
        root: null,
        rootMargin: '250% 0px 250% 0px',
        threshold: 0
      })
      observer.observe(node)
      return () => observer.disconnect()
    }

    const check = () => {
      const rect = node.getBoundingClientRect()
      const margin = (window.innerHeight || 800) * 2.5
      setActive(rect.bottom >= -margin && rect.top <= (window.innerHeight || 800) + margin)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return <div ref={hostRef} className="dex-art-window" data-art-active={active ? '1' : '0'}>
    {active
      ? <MonsterArt speciesId={speciesId} compact />
      : <div className="dex-art-loading" aria-hidden="true"><span>よみこみ中</span></div>}
  </div>
}

function DexDetail({ speciesId, game, orderedIds, onClose, onNavigate }) {
  const species = SPECIES[speciesId]
  const description = monsterDescriptionOf(speciesId)
  if (!species) return null

  const seen = game.dex?.seen || {}
  const caught = game.dex?.caught || {}
  const index = orderedIds.indexOf(speciesId)
  const previousId = index > 0 ? orderedIds[index - 1] : null
  const nextId = index >= 0 && index < orderedIds.length - 1 ? orderedIds[index + 1] : null
  const nextSpecies = species.evolution?.to ? SPECIES[species.evolution.to] : null
  const nextLabel = !nextSpecies
    ? 'さいしゅうけいたい'
    : seen[nextSpecies.id]
      ? `つぎ：No.${nextSpecies.no} ${nextSpecies.name}`
      : 'つぎの すがたが あるよ'

  return <section className="dex-detail" role="dialog" aria-label={`${species.name}の ずかん`} data-dex-detail-id={speciesId}>
    <nav className="dex-detail-nav" aria-label="ずかん詳細の移動">
      <button className="secondary" disabled={!previousId} onClick={() => previousId && onNavigate(previousId)} aria-label={previousId ? `まえのモンスター ${SPECIES[previousId]?.name}` : 'まえのモンスターはありません'}>← まえ</button>
      <button className="secondary" onClick={onClose}>ずかんへ</button>
      <button className="secondary" disabled={!nextId} onClick={() => nextId && onNavigate(nextId)} aria-label={nextId ? `つぎのモンスター ${SPECIES[nextId]?.name}` : 'つぎのモンスターはありません'}>つぎ →</button>
    </nav>
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
    <nav className="dex-detail-nav bottom" aria-label="ずかん詳細の移動">
      <button className="secondary" disabled={!previousId} onClick={() => previousId && onNavigate(previousId)}>← まえ</button>
      <button className="secondary" onClick={onClose}>ずかんへ</button>
      <button className="secondary" disabled={!nextId} onClick={() => nextId && onNavigate(nextId)}>つぎ →</button>
    </nav>
  </section>
}

export function DexGrid({ game }) {
  const [area, setArea] = useState(0)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [showTools, setShowTools] = useState(false)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null)
  const [activeContext, setActiveContext] = useState(() => readSessionContext())
  const restoreFrameRef = useRef(null)
  const previousScrollRestorationRef = useRef(null)
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

  const browsableIds = useMemo(() => speciesList.filter((species) => !!seen[species.id]).map((species) => species.id), [speciesList, seen])

  const scrollToContext = useCallback((context) => {
    if (restoreFrameRef.current) cancelAnimationFrame(restoreFrameRef.current)
    let attempts = 0
    const restore = () => {
      attempts += 1
      const anchorId = context?.anchorId
      const anchor = anchorId ? document.querySelector(`[data-dex-species-id="${anchorId}"]`) : null
      if (!anchor && attempts < 8) {
        restoreFrameRef.current = requestAnimationFrame(restore)
        return
      }
      if (anchor) {
        const desired = Number(context.anchorOffset || 0)
        const delta = anchor.getBoundingClientRect().top - desired
        window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
        anchor.querySelector('button')?.focus({ preventScroll: true })
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }
    }
    restoreFrameRef.current = requestAnimationFrame(() => {
      restoreFrameRef.current = requestAnimationFrame(restore)
    })
  }, [])

  const restoreDexContext = useCallback((context) => {
    const safe = context || readSessionContext()
    setSelectedSpeciesId(null)
    if (!safe) return
    setArea(Number(safe.area || 0))
    setType(safe.type || 'all')
    setSearch(safe.search || '')
    setShowTools(!!safe.showTools)
    setActiveContext(safe)
    writeSessionContext(safe)
    scrollToContext(safe)
  }, [scrollToContext])

  useEffect(() => {
    if (!('scrollRestoration' in history)) return undefined
    previousScrollRestorationRef.current = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = previousScrollRestorationRef.current || 'auto'
    }
  }, [])

  useEffect(() => {
    const onPopState = (event) => {
      if (!selectedSpeciesId) return
      const context = event.state?.dexContext || activeContext || readSessionContext()
      restoreDexContext(context)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [selectedSpeciesId, activeContext, restoreDexContext])

  useEffect(() => () => {
    if (restoreFrameRef.current) cancelAnimationFrame(restoreFrameRef.current)
  }, [])

  useEffect(() => {
    if (!selectedSpeciesId) return
    const ordered = activeContext?.orderedIds?.filter((id) => seen[id]) || browsableIds
    const index = ordered.indexOf(selectedSpeciesId)
    const neighborhood = ordered.slice(Math.max(0, index - 2), index + 3).filter((id) => id !== selectedSpeciesId)
    prefetchDexSpecies(neighborhood)
  }, [selectedSpeciesId, activeContext, browsableIds, seen])

  const openDetail = (speciesId, event) => {
    const orderedIds = browsableIds
    if (!orderedIds.includes(speciesId)) return
    const anchorOffset = event?.currentTarget?.getBoundingClientRect?.().top ?? 0
    const context = {
      version: 1,
      contextId: `dex-${Date.now()}-${speciesId}`,
      area,
      type,
      search,
      showTools,
      orderedIds,
      selectedSpeciesId: speciesId,
      anchorId: speciesId,
      anchorOffset
    }
    setActiveContext(context)
    writeSessionContext(context)
    const currentState = history.state && typeof history.state === 'object' ? history.state : {}
    history.replaceState({ ...currentState, manaevoDex: DEX_HISTORY_GRID, dexContext: context }, '')
    history.pushState({ manaevoDex: DEX_HISTORY_DETAIL, speciesId, hasGridHistoryEntry: true, dexContext: context }, '')
    setSelectedSpeciesId(speciesId)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  const navigateDetail = (speciesId) => {
    const context = activeContext || readSessionContext()
    const ordered = context?.orderedIds || browsableIds
    if (!ordered.includes(speciesId)) return
    const nextContext = { ...(context || {}), selectedSpeciesId: speciesId }
    setActiveContext(nextContext)
    writeSessionContext(nextContext)
    history.replaceState({
      ...(history.state && typeof history.state === 'object' ? history.state : {}),
      manaevoDex: DEX_HISTORY_DETAIL,
      speciesId,
      hasGridHistoryEntry: history.state?.hasGridHistoryEntry === true,
      dexContext: nextContext
    }, '')
    setSelectedSpeciesId(speciesId)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  const closeDetail = () => {
    const state = history.state
    const context = state?.dexContext || activeContext || readSessionContext()
    if (state?.manaevoDex === DEX_HISTORY_DETAIL && state?.hasGridHistoryEntry === true) {
      history.back()
      return
    }
    const fallback = context || {
      version: 1,
      contextId: `dex-fallback-${Date.now()}`,
      area: 0,
      type: 'all',
      search: '',
      showTools: false,
      orderedIds: ACTIVE_MONSTER_IDS.filter((id) => seen[id]),
      selectedSpeciesId: selectedSpeciesId,
      anchorId: selectedSpeciesId,
      anchorOffset: 0
    }
    history.replaceState({ manaevoDex: DEX_HISTORY_GRID, dexContext: fallback }, '')
    restoreDexContext(fallback)
  }

  if (selectedSpeciesId) {
    const ordered = activeContext?.orderedIds?.filter((id) => seen[id]) || browsableIds
    return <DexDetail speciesId={selectedSpeciesId} game={game} orderedIds={ordered} onClose={closeDetail} onNavigate={navigateDetail} />
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
        return <div key={species.id} className={isCaught ? 'caught' : isSeen ? 'seen' : 'unknown'} data-dex-species-id={species.id}>
          <button type="button" className="dex-species-tile" disabled={!isSeen} onClick={(event) => openDetail(species.id, event)} aria-label={isSeen ? `No.${species.no} ${species.name}` : `No.${species.no} みはっけん`}>
            <small>No.{species.no}</small>
            {isSeen ? <NearViewportMonsterArt speciesId={species.id} /> : <div className="silhouette" aria-hidden="true">?</div>}
            <strong>{isSeen ? species.name : '？？？'}</strong>
            <span>{isCaught ? '✅ GET' : isSeen ? '👀 はっけん' : 'みはっけん'}</span>
          </button>
        </div>
      })}
    </div>
  </section>
}
