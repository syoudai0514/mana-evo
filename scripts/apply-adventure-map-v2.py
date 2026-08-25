from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'needle not found in {path}: {old[:140]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


# 1) Separate content source area from actual adventure area and add daily encounter picker.
replace_once(
    'src/game/worldProgression.js',
    "function metaForStage(stage) {\n  if (['event', 'ex'].includes(stage?.kind) || Number(stage?.area) > 4) return WORLD_AREA_META[4]\n  return WORLD_AREA_META.find((meta) => meta.area === Number(stage?.area)) || WORLD_AREA_META[0]\n}\n",
    "function adventureAreaForStage(stage, species) {\n  if (['event', 'ex'].includes(stage?.kind) || Number(stage?.area) > 4) return 5\n  const sourceArea = Math.max(1, Number(stage?.area) || 1)\n  const formStage = Math.max(1, Number(species?.stage) || 1)\n  const isFinalEvolution = formStage > 1 && !species?.evolution\n  // 当初方針: エリア1/2の通常野生は進化前中心。\n  // A1系列の第2形態はA3奥地、A2系列の第2形態はA4奥地へ送る。\n  if (stage?.kind === 'wild' && formStage >= 2 && !isFinalEvolution) {\n    if (sourceArea === 1) return 3\n    if (sourceArea === 2) return 4\n  }\n  return sourceArea\n}\n\nfunction metaForStage(stage, species) {\n  const adventureArea = adventureAreaForStage(stage, species)\n  return WORLD_AREA_META.find((meta) => meta.area === adventureArea) || WORLD_AREA_META[0]\n}\n"
)
replace_once(
    'src/game/worldProgression.js',
    "  const meta = metaForStage(stage)\n",
    "  const meta = metaForStage(stage, species)\n"
)
replace_once(
    'src/game/worldProgression.js',
    "    adventureArea: meta.area,\n    adventureAreaName: meta.name,",
    "    sourceArea: stage.area,\n    adventureArea: meta.area,\n    adventureAreaName: meta.name,"
)
replace_once(
    'src/game/worldProgression.js',
    "  // 第2形態の初回入手は自力進化。進化後に dex.caught が立つので奥地野生が解禁される。\n  if (isFirstEvolvedForm) next.requiresOwnedSpeciesId = species.id\n",
    "  // 冒険エリアの解放条件は、制作上のareaではなく実際の配置先で決める。\n  if (meta.area > 1 && meta.area <= 4 && !['event', 'ex'].includes(stage.kind)) next.areaGateBossId = `a${meta.area - 1}-boss`\n\n  // 第2形態の初回入手は自力進化。進化後に dex.caught が立つので奥地野生が解禁される。\n  if (isFirstEvolvedForm) next.requiresOwnedSpeciesId = species.id\n"
)
with Path('src/game/worldProgression.js').open('a', encoding='utf-8') as f:
    f.write(r'''

function encounterHash(stageId, day) {
  let hash = 2166136261
  const text = `${day}:${stageId}`
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function pickDailyEncounterStages(stages, {
  day = 0,
  limit = 5,
  isUnlocked = () => true,
  isCaught = () => false,
  isCleared = () => false
} = {}) {
  return [...(stages || [])]
    .sort((a, b) => {
      const unlocked = Number(!isUnlocked(a)) - Number(!isUnlocked(b))
      if (unlocked) return unlocked
      const uncaught = Number(isCaught(a)) - Number(isCaught(b))
      if (uncaught) return uncaught
      const uncleared = Number(isCleared(a)) - Number(isCleared(b))
      if (uncleared) return uncleared
      return encounterHash(a.id, day) - encounterHash(b.id, day)
    })
    .slice(0, Math.max(1, Number(limit) || 5))
}
''')

replace_once(
    'src/game/content.js',
    "import { WORLD_AREA_META, enrichStage } from './worldProgression.js'",
    "import { WORLD_AREA_META, enrichStage, pickDailyEncounterStages } from './worldProgression.js'"
)
replace_once(
    'src/game/content.js',
    "export { RUNTIME_META, RUNTIME_STAGES }",
    "export { RUNTIME_META, RUNTIME_STAGES, pickDailyEncounterStages }"
)

# Story clear counts follow adventure placement, not source/master area.
replace_once(
    'src/game/engine.js',
    "  return STAGES.filter((stage) => stage.area === area && stage.kind === 'wild' && cleared.has(stage.id)).length",
    "  return STAGES.filter((stage) => (stage.adventureArea || stage.area) === area && stage.kind === 'wild' && cleared.has(stage.id)).length"
)

# 2) Adventure map becomes area -> zone -> today's discoveries, while preserving full-search tools.
replace_once(
    'src/game/GameScreens.jsx',
    "  moveOf,\n  speciesOf,",
    "  moveOf,\n  pickDailyEncounterStages,\n  speciesOf,"
)
replace_once(
    'src/game/GameScreens.jsx',
    "function StageMap({ game, onStart, goStudy, goHome, dailyCompleted, today }) {",
    "function StageMap({ game, onStart, goStudy, goHome, dailyCompleted, today, location, onLocationChange }) {"
)
old_state = """  const [area, setArea] = useState(highestArea)
  const [kind, setKind] = useState('all')
  const [search, setSearch] = useState('')

  const visibleStages = useMemo(() => STAGES.filter((stage) => {
    if (stage.legacy || stage.hidden) return false
    if (area <= 4 && stage.area !== area) return false
    if (area === 5 && !['event', 'ex'].includes(stage.kind)) return false
    if (kind === 'wild' && stage.kind !== 'wild') return false
    if (kind === 'evo' && stage.kind !== 'evolution-trial') return false
    if (kind === 'special' && !['giga-challenge', 'burst-challenge'].includes(stage.kind)) return false
    if (kind === 'boss' && !['boss', 'ex'].includes(stage.kind)) return false
    if (search.trim()) {
      const enemy = speciesOf(stage.enemySpeciesId)
      const needle = search.trim().toLowerCase()
      const hay = `${stage.label} ${enemy?.name || ''} ${enemy?.no || ''}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  }), [area, kind, search])
"""
new_state = """  const requestedArea = Number(location?.area)
  const area = requestedArea >= 1 && requestedArea <= 5 ? requestedArea : highestArea
  const areaMeta = area <= 4 ? AREA_META.find((meta) => meta.area === area) : null
  const defaultZoneId = areaMeta?.zones?.[0]?.id || 'ex'
  const zoneId = areaMeta?.zones?.some((zone) => zone.id === location?.zoneId) ? location.zoneId : defaultZoneId
  const activeZone = areaMeta?.zones?.find((zone) => zone.id === zoneId) || null
  const [kind, setKind] = useState('all')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const teamLevels = (game.team || []).map((id) => Number(game.box?.[id]?.level) || 1).filter(Boolean)
  const teamLevel = teamLevels.length ? Math.round(teamLevels.reduce((sum, level) => sum + level, 0) / teamLevels.length) : 1
  const areaUnlocked = (areaNo) => areaNo === 1 || cleared.has(`a${areaNo - 1}-boss`)
  const exUnlocked = [1, 2, 3, 4].every((areaNo) => cleared.has(`a${areaNo}-boss`))

  const selectArea = (nextArea) => {
    const meta = AREA_META.find((item) => item.area === nextArea)
    onLocationChange?.({ area: nextArea, zoneId: meta?.zones?.[0]?.id || 'ex' })
    setKind('all')
    setSearch('')
    setShowAll(false)
  }
  const selectZone = (nextZoneId) => {
    onLocationChange?.({ area, zoneId: nextZoneId })
    setKind('all')
    setSearch('')
    setShowAll(false)
  }

  const filteredStages = useMemo(() => STAGES.filter((stage) => {
    if (stage.legacy || stage.hidden) return false
    if (area <= 4 && (stage.adventureArea || stage.area) !== area) return false
    if (area === 5 && !['event', 'ex'].includes(stage.kind)) return false
    if (area <= 4 && stage.zoneId !== zoneId) return false
    if (kind === 'wild' && stage.kind !== 'wild') return false
    if (kind === 'evo' && stage.kind !== 'evolution-trial') return false
    if (kind === 'special' && !['giga-challenge', 'burst-challenge'].includes(stage.kind)) return false
    if (kind === 'boss' && !['boss', 'ex'].includes(stage.kind)) return false
    if (search.trim()) {
      const enemy = speciesOf(stage.enemySpeciesId)
      const needle = search.trim().toLowerCase()
      const hay = `${stage.label} ${enemy?.name || ''} ${enemy?.no || ''}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  }), [area, zoneId, kind, search])

  const dailyMode = area <= 4 && kind === 'all' && !search.trim() && !showAll
  const visibleStages = useMemo(() => {
    if (!dailyMode) return filteredStages
    const wild = filteredStages.filter((stage) => stage.kind === 'wild')
    const other = filteredStages.filter((stage) => stage.kind !== 'wild')
    const dailyWild = pickDailyEncounterStages(wild, {
      day: today,
      limit: 5,
      isUnlocked: (stage) => isStageUnlocked(game, stage),
      isCaught: (stage) => !!game.dex?.caught?.[stage.enemySpeciesId],
      isCleared: (stage) => cleared.has(stage.id)
    })
    return [...dailyWild, ...other]
  }), [filteredStages, dailyMode, today, game, cleared])
"""
replace_once('src/game/GameScreens.jsx', old_state, new_state)

old_tabs = """      <div className="area-tabs">
        {AREA_META.map((meta) => <button key={meta.area} className={area === meta.area ? 'active' : ''} onClick={() => setArea(meta.area)}>エリア{meta.area}</button>)}
        <button className={area === 5 ? 'active' : ''} onClick={() => setArea(5)}>EX</button>
      </div>
      <div className="stage-filters">
"""
new_tabs = """      <div className="area-tabs world-area-tabs">
        {AREA_META.map((meta) => { const unlocked = areaUnlocked(meta.area); return <button key={meta.area} disabled={!unlocked} className={area === meta.area ? 'active' : ''} onClick={() => selectArea(meta.area)}>{unlocked ? meta.icon : '🔒'} エリア{meta.area}</button> })}
        <button disabled={!exUnlocked} className={area === 5 ? 'active' : ''} onClick={() => selectArea(5)}>{exUnlocked ? '🌀' : '🔒'} EX</button>
      </div>

      {areaMeta && <section className={`zone-map area-zone-map area-${area}`}>
        <div className="zone-map-title"><div><p className="eyebrow">エリア{area}の ぼうけん</p><h2>どこへ いく？</h2></div><span>チームの めやす Lv.{teamLevel}</span></div>
        <div className="zone-grid">{areaMeta.zones.map((zone, index) => {
          const danger = teamLevel < zone.minLevel
          return <button key={zone.id} className={`${zoneId === zone.id ? 'active' : ''} ${danger ? 'danger' : 'ready'}`} onClick={() => selectZone(zone.id)}>
            <span className="zone-path-dot">{zoneId === zone.id ? '📍' : index + 1}</span><b>{zone.icon} {zone.name}</b><small>Lv.{zone.minLevel}〜{zone.maxLevel}</small><em>{danger ? '⚠️ かなり つよい' : zoneId === zone.id ? 'いま ここ！' : 'いけるよ'}</em>
          </button>
        })}</div>
      </section>}

      <div className="stage-filters">
"""
replace_once('src/game/GameScreens.jsx', old_tabs, new_tabs)

replace_once(
    'src/game/GameScreens.jsx',
    "      <input className=\"monster-search\" value={search} onChange={(event) => setSearch(event.target.value)} placeholder=\"なまえ・No.で さがす\" />\n\n      <div className=\"stage-list full-master-stage-list\">",
    "      <input className=\"monster-search\" value={search} onChange={(event) => { setSearch(event.target.value); if (event.target.value) setShowAll(true) }} placeholder=\"なまえ・No.で さがす\" />\n\n      {area <= 4 && <div className=\"encounter-heading\"><div><p className=\"eyebrow\">{dailyMode ? 'きょう みつかっている' : 'このゾーンの モンスター'}</p><h2>{activeZone?.icon} {activeZone?.name}</h2><small>{dailyMode ? 'まずは5たいまで。GETしていない なかまを ゆうせんして みつけるよ。' : 'ずかんのように ぜんぶ さがせるよ。'}</small></div><button className=\"secondary compact\" onClick={() => { setShowAll((value) => !value); setKind('all'); setSearch('') }}>{showAll ? 'きょうの であいへ' : 'ほかも さがす'}</button></div>}\n\n      <div className=\"stage-list full-master-stage-list\">"
)
replace_once(
    'src/game/GameScreens.jsx',
    "className={`stage-card formal-stage-card area-${stage.area} zone-${stage.zoneId || 'special'} ${!unlocked ? 'locked' : ''}`}",
    "className={`stage-card formal-stage-card area-${stage.adventureArea || stage.area} zone-${stage.zoneId || 'special'} ${!unlocked ? 'locked' : ''}`}"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<main className={`screen battle-screen-v2 area-theme-${stage?.area || 5}`}>",
    "<main className={`screen battle-screen-v2 area-theme-${stage?.adventureArea || stage?.area || 5}`}>"
)

# Keep the selected map location while going into a battle and returning.
replace_once(
    'src/game/GameScreens.jsx',
    "export function AdventureFlow({ game, setGame, goHome, goStudy, dailyCompleted, dailyDay, today }) {\n  const [mapNonce, setMapNonce] = useState(0)",
    "export function AdventureFlow({ game, setGame, goHome, goStudy, dailyCompleted, dailyDay, today }) {\n  const [mapLocation, setMapLocation] = useState(null)"
)
replace_once(
    'src/game/GameScreens.jsx',
    "  if (game.activeBattle) return <BattleView game={game} setGame={setGame} onExitToMap={() => setMapNonce((n) => n + 1)} goStudy={goStudy} />\n  return <StageMap key={mapNonce} game={game} onStart={start} goStudy={goStudy} goHome={goHome} dailyCompleted={dailyCompleted} today={today} />",
    "  if (game.activeBattle) return <BattleView game={game} setGame={setGame} onExitToMap={() => {}} goStudy={goStudy} />\n  return <StageMap game={game} onStart={start} goStudy={goStudy} goHome={goHome} dailyCompleted={dailyCompleted} today={today} location={mapLocation} onLocationChange={setMapLocation} />"
)

# 3) Make evolution a real reward moment instead of a silent state change.
evo_component = r'''
function EvolutionCelebration({ reveal, onClose }) {
  if (!reveal) return null
  const from = speciesOf(reveal.fromId)
  const to = speciesOf(reveal.toId)
  const before = statsFor(reveal.fromId, reveal.level)
  const after = statsFor(reveal.toId, reveal.level)
  const gain = (key) => Math.max(0, (after?.[key] || 0) - (before?.[key] || 0))
  return <div className="evolution-overlay" role="dialog" aria-modal="true" aria-label="シンカ！">
    <div className="evolution-stars">✦　✧　✦　✧　✦</div>
    <section className="evolution-celebration-card">
      <p className="evolution-kicker">✨ シンカ！ ✨</p>
      <div className="evolution-pair"><div className="evolution-old"><PlaceholderMonster speciesId={reveal.fromId} /><strong>{from?.name}</strong></div><span className="evolution-arrow">→</span><div className="evolution-new"><div className="evolution-glow"/><PlaceholderMonster speciesId={reveal.toId} /><strong>{to?.name}</strong></div></div>
      <h2>{from?.name} は<br/><b>{to?.name}</b> に シンカした！</h2>
      <p>じぶんで そだてたから たどりついた すがただよ！</p>
      <div className="evolution-stat-gains"><span>HP <b>+{gain('hp')}</b></span><span>こうげき <b>+{gain('attack')}</b></span><span>ぼうぎょ <b>+{gain('defense')}</b></span><span>すばやさ <b>+{gain('speed')}</b></span></div>
      <div className="evolution-unlock-note">🗺️ この すがたが ずかんに とうろく！<br/>こうレベルの おくちで であえる ばしょも あるよ。</div>
      <button className="primary huge" onClick={onClose}>つづける！</button>
    </section>
  </div>
}

'''
replace_once('src/game/GameScreens.jsx', 'function DetailPanel({ game, setGame, instanceId }) {', evo_component + 'function DetailPanel({ game, setGame, instanceId, onEvolution }) {')
replace_once(
    'src/game/GameScreens.jsx',
    "  const evolve = () => {\n    const result = evolveInstance(game, instanceId)\n    if (result.ok) setGame(result.game)\n  }",
    "  const evolve = () => {\n    const fromId = monster.speciesId\n    const level = monster.level\n    const result = evolveInstance(game, instanceId)\n    if (result.ok) {\n      setGame(result.game)\n      onEvolution?.({ fromId, toId: result.to, level })\n    }\n  }"
)
replace_once(
    'src/game/GameScreens.jsx',
    "  const [selected, setSelected] = useState(game.activeMonsterId)\n",
    "  const [selected, setSelected] = useState(game.activeMonsterId)\n  const [evolutionReveal, setEvolutionReveal] = useState(null)\n"
)
replace_once(
    'src/game/GameScreens.jsx',
    "  return <main className=\"screen monster-screen-v2\">\n    <button className=\"back\" onClick={goHome}>",
    "  return <main className=\"screen monster-screen-v2\">\n    {evolutionReveal && <EvolutionCelebration reveal={evolutionReveal} onClose={() => setEvolutionReveal(null)} />}\n    <button className=\"back\" onClick={goHome}>"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<DetailPanel game={game} setGame={setGame} instanceId={selected} />",
    "<DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} />"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<DetailPanel game={game} setGame={setGame} instanceId={selected} />",
    "<DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} />"
)

# CSS for map/zone hierarchy and evolution celebration.
with Path('src/game/game.css').open('a', encoding='utf-8') as f:
    f.write(r'''

/* Adventure map v2: area -> zone -> today's encounters */
.world-area-tabs button:disabled{opacity:.42;filter:grayscale(.8);cursor:not-allowed}
.zone-map{margin:14px 0;padding:15px;border-radius:22px;background:linear-gradient(145deg,#f6fbff,#eef5ff);border:1px solid #d9e8f7}
.zone-map-title{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:11px}.zone-map-title h2{margin:2px 0}.zone-map-title>span{font-size:.75rem;font-weight:900;color:#55708d;background:#fff;border-radius:999px;padding:6px 9px}
.zone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;position:relative}.zone-grid:before{content:'';position:absolute;left:14%;right:14%;top:24px;height:4px;border-radius:999px;background:#cbd9e7;z-index:0}
.zone-grid button{position:relative;z-index:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 7px 10px;border:2px solid #d9e5ef;border-radius:17px;background:#fff;color:#24415f;box-shadow:0 5px 12px #2d4d7012}.zone-grid button.active{border-color:#275da3;background:linear-gradient(#f7fbff,#e8f3ff);box-shadow:0 8px 18px #204e8922}.zone-grid button.danger:not(.active){border-color:#efc1b2;background:#fff7f3}.zone-grid button b{font-size:.78rem;text-align:center;line-height:1.3}.zone-grid button small{font-size:.69rem;color:#667d94}.zone-grid button em{font-size:.63rem;font-style:normal;font-weight:900;color:#2c6f4a}.zone-grid button.danger em{color:#b54b30}.zone-path-dot{display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:#183d70;color:#fff;font-weight:900;border:3px solid #fff;box-shadow:0 2px 7px #183d7035}
.encounter-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0 7px;padding:13px 15px;border-radius:18px;background:#14264d;color:#fff}.encounter-heading h2{margin:2px 0 3px;font-size:1.05rem}.encounter-heading small{opacity:.78;font-size:.72rem;line-height:1.45}.encounter-heading .eyebrow{color:#aecdff}.encounter-heading button{flex:0 0 auto}.secondary.compact{padding:8px 10px;font-size:.72rem}
.evolution-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 50% 42%,#634eac 0,#181c47 42%,#0c102b 100%);overflow:auto}.evolution-stars{position:absolute;inset:8% 0 auto;text-align:center;color:#ffe994;font-size:2rem;letter-spacing:.35rem;animation:evo-stars 1.4s ease-in-out infinite alternate}.evolution-celebration-card{position:relative;width:min(520px,100%);text-align:center;color:#fff;background:linear-gradient(160deg,#ffffff18,#ffffff08);border:1px solid #ffffff38;border-radius:30px;padding:22px 18px;box-shadow:0 24px 70px #0008;backdrop-filter:blur(8px)}.evolution-kicker{margin:0;font-size:1.35rem;font-weight:1000;letter-spacing:.12em;color:#fff0a8}.evolution-pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin:12px 0}.evolution-old,.evolution-new{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}.evolution-old{opacity:.65;transform:scale(.82)}.evolution-new{position:relative;animation:evo-pop .75s cubic-bezier(.2,.9,.3,1.25)}.evolution-new .placeholder-monster{position:relative;z-index:2}.evolution-glow{position:absolute;width:140px;height:140px;border-radius:999px;background:#fff6aa88;filter:blur(13px);animation:evo-glow 1s ease-in-out infinite alternate}.evolution-arrow{font-size:2rem;color:#ffe88a;font-weight:1000}.evolution-celebration-card h2{margin:8px 0 5px;font-size:1.35rem;line-height:1.45}.evolution-celebration-card h2 b{color:#fff08d;font-size:1.65rem}.evolution-celebration-card>p{margin:5px 0 12px;opacity:.9}.evolution-stat-gains{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.evolution-stat-gains span{display:flex;flex-direction:column;gap:3px;padding:8px 3px;border-radius:12px;background:#ffffff14;font-size:.68rem}.evolution-stat-gains b{font-size:.95rem;color:#a8ffba}.evolution-unlock-note{margin:12px 0;padding:10px 12px;border-radius:14px;background:#fff5b31b;border:1px solid #fff4a933;font-size:.78rem;line-height:1.55;color:#fff6bd}
@keyframes evo-pop{0%{opacity:0;transform:scale(.3) rotate(-8deg);filter:brightness(3)}65%{transform:scale(1.1) rotate(2deg);filter:brightness(1.6)}100%{opacity:1;transform:scale(1);filter:brightness(1)}}@keyframes evo-glow{from{transform:scale(.82);opacity:.45}to{transform:scale(1.15);opacity:.9}}@keyframes evo-stars{from{opacity:.45;transform:translateY(0)}to{opacity:1;transform:translateY(-6px)}}
@media(max-width:560px){.zone-grid{gap:5px}.zone-grid button{padding:8px 3px}.zone-grid button b{font-size:.7rem}.zone-grid button em{font-size:.58rem}.zone-map-title{align-items:flex-start;flex-direction:column}.encounter-heading{align-items:flex-start}.evolution-celebration-card{padding:18px 12px}.evolution-stat-gains{grid-template-columns:repeat(2,1fr)}}
''')

# 4) Canonical design catches up to the implementation.
replace_once(
    'design/20-world-map-evolution-progression.md',
    "各エリアは「入口／中盤／奥地」の3段階を基本とする。第2形態の野生個体は原則として奥地側へ寄せる。",
    "各エリアは「入口／中盤／奥地」の3段階を基本とする。第2形態の野生個体は原則として奥地側へ寄せる。\n\nゲーム内配置では、**エリア1・2の通常野生は第1形態中心**とする。制作マスター上Area1の系列に属する非最終の第2形態は、初回自力進化後にAdventure Area3の奥地で野生解禁する。制作マスター上Area2の系列はAdventure Area4の奥地で同様に解禁する。Area3・4系列の非最終第2形態は、それぞれ同エリアの奥地に配置する。制作管理の `area` は変更せず、ゲーム配置は `adventureArea` で分離する。"
)
replace_once(
    'design/20-world-map-evolution-progression.md',
    "## 10. 今後の拡張\n\n今回で基礎ループを正す。次段階では、巨大な「1体1ステージ一覧」をさらに減らし、**ワールド → エリア → ゾーン → 今日見つかっている3〜5候補**という探索UXへ進化させる。チケット消費は候補を見てバトルを選んだ後とし、子どもが「ハズレを引いてチケットを失った」と感じにくくする。\n\n正式画像011〜238やギガ／バースト専用画像の制作状況とは独立して、このゲームループは動作すること。",
    "## 10. 探索UI（実装済み）\n\n通常探索は **ワールドのエリア → 3つのゾーン → 今日見つかっている最大5候補** の順で選ぶ。未GET・未クリア・解禁済みの候補を優先し、同条件なら日ごとに決まる安定した並びで候補を変える。チケットは候補を確認してバトル開始した後にだけ消費する。\n\n「ほかも さがす」や種類フィルター／検索を使えば、そのゾーンの全候補を図鑑的に探せる。通常画面は巨大一覧を前面に出さず、1日3チケットで意味のある選択をしやすくする。\n\nゾーンを選んだ状態は、その冒険画面内ではバトル後も維持する。進化時は全画面のシンカ演出を出し、姿の変化・能力上昇・図鑑／奥地解禁を大きなごほうびとして伝える。\n\n## 11. 今後の拡張\n\n正式画像011〜238やギガ／バースト専用画像の制作状況とは独立して、このゲームループは動作すること。将来は各ゾーン固有の背景アート、ボス専用登場演出、ルート上のイベントノードを追加し、さらに世界の存在感を強める。"
)

# Existing progression regression must now satisfy the later-area gate after relocation.
replace_once(
    'tests/world-progression.test.js',
    "  game.dex = { seen: { [predecessor.id]: true }, caught: { [predecessor.id]: true } }\n  assert.equal(isStageUnlocked(game, stage), false)",
    "  game.dex = { seen: { [predecessor.id]: true }, caught: { [predecessor.id]: true } }\n  game.stagesCleared = ['a1-boss', 'a2-boss']\n  assert.equal(isStageUnlocked(game, stage), false)"
)

new_test = '''import test from 'node:test'\nimport assert from 'node:assert/strict'\nimport { SPECIES, STAGES, pickDailyEncounterStages, speciesOf } from '../src/game/content.js'\n\ntest('early-area evolved wild forms move to later high-level adventure areas', () => {\n  const area1Second = STAGES.find((stage) => stage.kind === 'wild' && stage.area === 1 && speciesOf(stage.enemySpeciesId)?.stage === 2 && speciesOf(stage.enemySpeciesId)?.evolution)\n  const area2Second = STAGES.find((stage) => stage.kind === 'wild' && stage.area === 2 && speciesOf(stage.enemySpeciesId)?.stage === 2 && speciesOf(stage.enemySpeciesId)?.evolution)\n  assert.ok(area1Second)\n  assert.ok(area2Second)\n  assert.equal(area1Second.adventureArea, 3)\n  assert.equal(area1Second.zoneId, 'deep')\n  assert.equal(area1Second.areaGateBossId, 'a2-boss')\n  assert.equal(area2Second.adventureArea, 4)\n  assert.equal(area2Second.zoneId, 'deep')\n  assert.equal(area2Second.areaGateBossId, 'a3-boss')\n\n  const area1First = STAGES.find((stage) => stage.kind === 'wild' && stage.area === 1 && speciesOf(stage.enemySpeciesId)?.stage === 1)\n  assert.equal(area1First.adventureArea, 1)\n})\n\ntest('area1 and area2 normal visible wild pools contain no evolved forms', () => {\n  for (const adventureArea of [1, 2]) {\n    const evolved = STAGES.filter((stage) => stage.kind === 'wild' && !stage.hidden && stage.adventureArea === adventureArea && (speciesOf(stage.enemySpeciesId)?.stage || 1) > 1)\n    assert.equal(evolved.length, 0)\n  }\n})\n\ntest('daily encounter picker is deterministic, capped, and prioritizes useful choices', () => {\n  const stages = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, enemySpeciesId: `m${i}` }))\n  const options = {\n    day: 12345,\n    limit: 5,\n    isUnlocked: (stage) => !['s0', 's1'].includes(stage.id),\n    isCaught: (stage) => ['s2', 's3'].includes(stage.id),\n    isCleared: (stage) => ['s4'].includes(stage.id)\n  }\n  const first = pickDailyEncounterStages(stages, options)\n  const second = pickDailyEncounterStages(stages, options)\n  assert.equal(first.length, 5)\n  assert.deepEqual(first.map((stage) => stage.id), second.map((stage) => stage.id))\n  assert.ok(first.every((stage) => !['s0', 's1'].includes(stage.id)))\n  assert.ok(first.some((stage) => !['s2', 's3', 's4'].includes(stage.id)))\n})\n\ntest('all 238 species remain in the content master after adventure relocation', () => {\n  assert.equal(Object.keys(SPECIES).length, 238)\n})\n'''
Path('tests/adventure-map-v2.test.js').write_text(new_test, encoding='utf-8')
