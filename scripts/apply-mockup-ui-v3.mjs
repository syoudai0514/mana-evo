import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, content) => fs.writeFileSync(path, content)
const replaceOnce = (path, before, after, label = before.slice(0, 40)) => {
  const source = read(path)
  if (!source.includes(before)) throw new Error(`target not found in ${path}: ${label}`)
  write(path, source.replace(before, after))
}
const replaceRegex = (path, pattern, after, label) => {
  const source = read(path)
  if (!pattern.test(source)) throw new Error(`regex target not found in ${path}: ${label}`)
  pattern.lastIndex = 0
  write(path, source.replace(pattern, after))
}
const append = (path, text) => write(path, read(path) + text)

// 1) Home: turn the current state into the approved visual mockup hierarchy.
const homeMarkup = `return <main className="screen home-screen mock-home">
    <section className="manaevo-brand-hero">
      <div className="brand-lockup"><span className="brand-crystal">◆</span><div><h1><b>マナ</b><em>エボ</em></h1><p>まなびが、<strong>進化</strong>になる。</p></div></div>
      {monster && <div className="brand-partner"><PlaceholderMonster speciesId={monster.speciesId} excited={dailyCompleted}/><span>{species?.name} Lv.{monster.level}</span></div>}
    </section>

    <section className="mock-panel home-flow-panel">
      <div className="mock-panel-title"><span>✦</span><h2>きょうの ながれ</h2><small>{dailyCompleted ? 'まなびクリア！' : 'まずは まなぼう！'}</small></div>
      <div className="home-flow-strip">
        {[
          ['1','📖','まなぶ'],['2','🎫','チケットGET'],['3','🗺️','ぼうけん'],['4','⚔️','バトル'],['5','⭕','つかまえる'],['6','✨','そだてる・シンカ']
        ].map(([no,icon,label], index) => <React.Fragment key={no}><div className={'home-flow-step step-' + no}><b>{no}</b><span>{icon}</span><small>{label}</small></div>{index < 5 && <i>›</i>}</React.Fragment>)}
      </div>
    </section>

    <section className="mock-panel home-status-panel">
      <div className="mock-panel-title"><span>🛡️</span><h2>いまの じょうきょう</h2></div>
      <div className="home-status-grid">
        <div><span>きょうのチケット</span><strong>🎫 {ticketCount}<small>まい</small></strong></div>
        <div><span>マナ</span><strong>💎 {game.mana}</strong></div>
        <div className="location-cell"><span>いまのぼうけん</span><strong>エリア{currentAreaNo}・{currentZone?.name}</strong><small>{currentArea?.levelLabel}</small></div>
        <button className="partner-cell" onClick={() => go('monsters')}>{monster && <PlaceholderMonster speciesId={monster.speciesId} compact/>}<span>{species?.name || '相棒'}<small>Lv.{monster?.level || 1}</small></span></button>
      </div>
    </section>

    <section className="mock-panel home-learning-panel">
      <div className="home-learning-copy"><p className="eyebrow">きょうの まなび</p><h2>{dailyCompleted ? '🎉 ミッション クリア！' : `あと ${leftTasks} きょうか！`}</h2><div className="progress-dots">{Array.from({length:totalTasks},(_,i)=><span key={i} className={i<doneTasks?'done':''}/>)}</div><p>{gradeOf(learning.grade).short} ・ 1きょうか 2〜5もん</p></div>
      <div className="home-primary-actions"><button className="primary" onClick={() => go('study')}>{dailyCompleted ? '📖 もっと まなぶ' : '📖 まなぶ！'}</button><button className={canAdventure ? 'battle' : 'secondary'} onClick={() => go('adventure')}>🗺️ {canAdventure ? 'ぼうけんへ！' : 'マップをみる'}</button></div>
    </section>

    <section className="mock-panel home-guide-panel">
      <div className="mock-panel-title gold"><span>📖</span><h2>ゲームせつめい</h2></div>
      <div className="home-guide-list">
        <p><b>📚</b><span>べんきょうすると <strong className="green">チケット</strong>が もらえる</span></p>
        <p><b>🎫</b><span>チケットで <strong className="orange">ぼうけん</strong>に いける</span></p>
        <p><b>⭕</b><span>モンスターを <strong className="purple">つかまえて</strong> <strong className="teal">そだてる</strong></span></p>
        <p><b>✨</b><span>じぶんで <strong className="blue">シンカ</strong>すると あたらしい ばしょが ひらく</span></p>
      </div>
      <div className="evolution-mini-goal"><strong>{nextEvolution ? (evolutionLeft === 0 ? '✨ いま シンカできる！' : evolutionLeft != null ? `あと ${evolutionLeft}Lvで ${nextEvolution.name}` : `つぎは ${nextEvolution.name}`) : '👑 さいしゅうの すがた！'}</strong><span>{nextEvolution ? 'GETしただけで おわりじゃない。そだてて じぶんで シンカ！' : 'ギガシンカ・キョダイバースト・EXを めざそう！'}</span></div>
    </section>

    <div className="home-small-links"><button className="howto-home-card" onClick={() => go('howto')}><strong>❓ あそびかた</strong><span>ルールと しんかアイテム →</span></button><button className="parent-home-card" onClick={() => go('parent')}><span>🔒</span><div><strong>おうちのひと</strong><small>がくねん・せってい</small></div><b>›</b></button></div>
  </main>
}`
replaceRegex('src/App.jsx', /return <main className="screen home-screen">[\s\S]*?<\/main>\n}/, homeMarkup, 'Home mockup markup')

replaceOnce(
  'src/App.jsx',
  `{!focusView && <header><div className="logo"><b>Mana</b><strong>Evo</strong><small>マナエボ</small></div><StatusBar game={game} today={today}/></header>}`,
  `{!focusView && <header className="game-topbar"><div className="logo"><span className="logo-gem">◆</span><b>マナ</b><strong>エボ</strong><small>まなびが、進化になる。</small></div><StatusBar game={game} today={today}/></header>}`,
  'top bar logo'
)
replaceOnce(
  'src/App.jsx',
  `{!['activity','free','review','trial','dictionary','parent'].includes(view) && !navigationLocked && <nav><button className={view==='home'?'active':''} onClick={()=>setView('home')}>🏠<span>ホーム</span></button><button className={view==='adventure'?'active':''} onClick={()=>setView('adventure')}>🗺️<span>ぼうけん</span></button><button className={view==='monsters'?'active':''} onClick={()=>setView('monsters')}>🐾<span>モンスター</span></button><button className={view==='study'?'active':''} onClick={()=>setView('study')}>📚<span>まなぶ</span></button></nav>}`,
  `{!['activity','free','review','trial','dictionary','parent'].includes(view) && !navigationLocked && <nav className="game-bottom-nav"><button className={view==='home'?'active':''} onClick={()=>setView('home')}>🏰<span>ホーム</span></button><button className={view==='study'?'active':''} onClick={()=>setView('study')}>📖<span>まなぶ</span></button><button className={view==='adventure'?'active':''} onClick={()=>setView('adventure')}>🗺️<span>ぼうけん</span></button><button className={view==='monsters'?'active':''} onClick={()=>setView('monsters')}>🐾<span>モンスター</span></button><button className={view==='howto'?'active':''} onClick={()=>setView('howto')}>📜<span>あそびかた</span></button></nav>}`,
  'five tab bottom navigation'
)

// 2) Adventure screen: world route, saved location, and daily five choices like the approved mockup.
replaceOnce(
  'src/game/GameScreens.jsx',
  `      <div className="area-tabs world-area-tabs">`,
  `      <section className="world-overview-card">
        <div className="world-overview-heading"><div><p className="eyebrow">せかいを ぼうけん</p><h2>シンカの ちからを ひらこう！</h2></div><span>📍 エリア{area}{activeZone ? '・' + activeZone.name : ''}</span></div>
        <div className="world-area-route">{AREA_META.map((meta) => { const unlocked = areaUnlocked(meta.area); return <button key={meta.area} disabled={!unlocked} className={'world-area-node ' + (area === meta.area ? 'current' : '') + (unlocked ? ' unlocked' : ' locked')} onClick={() => selectArea(meta.area)}><span>{unlocked ? meta.icon : '🔒'}</span><b>エリア{meta.area}</b><small>{area === meta.area ? 'いまここ' : unlocked ? 'いける' : 'まだ'}</small></button> })}</div>
      </section>

      <div className="area-tabs world-area-tabs">`,
  'world overview insertion'
)
replaceOnce(
  'src/game/GameScreens.jsx',
  `      {area <= 4 && <div className="encounter-heading">`,
  `      {dailyMode && <section className="daily-ticket-summary"><div><span>🎫</span><small>1にち</small><strong>3チケット</strong></div><i/><div><span>⭐</span><small>おすすめ</small><strong>{visibleStages.length}けん</strong></div></section>}
      {area <= 4 && <div className="encounter-heading">`,
  'daily five summary'
)
replaceOnce('src/game/GameScreens.jsx', `        {visibleStages.map((stage) => {`, `        {visibleStages.map((stage, index) => {`, 'stage index')
replaceOnce(
  'src/game/GameScreens.jsx',
  `          const canStart = unlocked && dailyCompleted && ticketCount > 0
          return (`,
  `          const canStart = unlocked && dailyCompleted && ticketCount > 0
          const recommendationTag = stage.kind === 'boss' ? (isCleared ? '再戦' : 'おすすめ') : stage.kind === 'evolution-trial' ? (isCleared ? '取得済' : '未GET') : ['giga-challenge', 'burst-challenge'].includes(stage.kind) ? (isCleared ? '再挑戦' : '初回') : stage.kind === 'wild' ? (game.dex?.caught?.[stage.enemySpeciesId] ? '育成向け' : '未GET') : index === 0 ? 'おすすめ' : '挑戦'
          return (`,
  'recommendation tag computation'
)
replaceOnce(
  'src/game/GameScreens.jsx',
  `              <div className="stage-number">{isCleared ? '✅' : unlocked ? stage.kind === 'boss' ? '👑' : '⚔️' : '🔒'}</div>`,
  `              <div className="stage-number">{dailyMode ? <b>{index + 1}</b> : isCleared ? '✅' : unlocked ? stage.kind === 'boss' ? '👑' : '⚔️' : '🔒'}</div><span className={'recommendation-tag kind-' + stage.kind}>{recommendationTag}</span>`,
  'stage recommendation badge'
)
replaceOnce('src/game/GameScreens.jsx', `{isCleared ? 'もういちど' : 'バトル！'}`, `{isCleared ? 'もういちど' : 'いく！'}`, 'stage action label')

// 3) Battle: make throwing a ring the visible primary capture action and add the four simple rules.
replaceOnce(
  'src/game/GameScreens.jsx',
  `          <div className="capture-stars" aria-label="捕獲4段階">`,
  `          <div className={'capture-main-cta ' + (captureHpReady && captureAttemptsLeft > 0 ? 'ready' : 'locked')}><span>⭕</span><strong>わを なげる</strong><small>{captureHpReady ? 'いま なげられる！' : 'HPを はんぶんいかに！'}</small></div>
          <div className="capture-stars" aria-label="捕獲4段階">`,
  'capture main CTA'
)
replaceOnce(
  'src/game/GameScreens.jsx',
  `      </>}\n\n      {forcedSwitch &&`,
  `        <section className="battle-point-guide"><h3>🛡️ バトルのポイント</h3><div><p><span>❤️</span>HPが <b>50%いか</b> だと つかまえやすい</p><p><span>⭕</span>わ は 1バトル <b>3かい</b>まで</p><p><span>🐾</span>チームは <b>3たい</b>まで</p><p><span>⭐</span>しょうりで <b>けいけんちGET</b></p></div></section>
      </>}\n\n      {forcedSwitch &&`,
  'battle point guide'
)
replaceOnce('src/game/GameScreens.jsx', `>いま シンカする！</button>`, `>✨ いま シンカする！</button>`, 'battle evolution CTA')

// 4) Monster screen: put raising/evolution at the center, without removing box/dex functions.
replaceOnce('src/game/GameScreens.jsx', `<h1>育成・図鑑</h1>`, `<h1>そだてる・シンカ</h1>`, 'monster screen title')
replaceOnce('src/game/GameScreens.jsx', `>進化させる！</button>`, `>✨ いま シンカする！</button>`, 'detail evolution CTA')
replaceOnce(
  'src/game/GameScreens.jsx',
  `    <div className="special-cards">`,
  `    <section className="evolution-method-guide"><h3>⭐ シンカの ほうほう</h3><div><span>⬆️<b>レベルで シンカ</b></span><span>💎<b>いしで シンカ</b></span><span>🎒<b>もちもの + つぎのレベル</b></span></div></section>
    <section className="evolution-explain-card"><h3>📖 シンカの せつめい</h3><p>🚫 つかまえたあと すぐの シンカは できない</p><p>🌱 そだてて <b>じぶんで シンカ</b>するのが だいじ</p><p>✨ じぶんで シンカすると <b>第2けいたいの ばしょ</b>が ひらく</p><p>⚔️ シンカできると バトルけっかから そのまま すすめる</p></section>
    <div className="special-cards">`,
  'evolution explanation blocks'
)

// 5) Global visual system matching the approved mockup: blue/gold game chrome, white cards, large clear CTAs.
append('src/styles.css', `

/* Mockup UI v3 — approved 2026-08-25 visual direction */
:root{--me-blue:#075bb6;--me-deep:#062f67;--me-sky:#dff5ff;--me-gold:#ffb827;--me-cream:#fffaf0;--me-card:#fff;--me-ink:#102d4f;--me-line:#b9daf3}
body{background:radial-gradient(circle at 50% -10%,#bfeaff 0,#e7f7ff 26%,#f4fbff 58%,#eef8ff 100%);color:var(--me-ink)}
.app-shell{background:linear-gradient(180deg,#e8f7ff 0,#f8fcff 34%,#f7fbff 100%);box-shadow:0 0 45px #0b3d7330;padding-bottom:96px}
.game-topbar{background:linear-gradient(180deg,#0871ca,#07468f);border-bottom:3px solid #ffcc59;padding:9px 13px;box-shadow:0 5px 16px #052e6848}
.logo{position:relative;grid-template-columns:auto auto;padding-left:19px;line-height:.85}.logo-gem{position:absolute;left:0;top:-1px;color:#6ee9ff;text-shadow:0 0 8px #fff;font-size:17px}.logo b,.logo strong{font-size:22px;-webkit-text-stroke:1px #fff;text-shadow:0 2px 0 #07346b}.logo b{color:#64d7ff}.logo strong{color:#ffc52f}.logo small{font-size:8px;letter-spacing:.06em;color:#eaf7ff;margin-top:6px}
.status-bar span{background:#053f82c4;border:1px solid #8ccfff;border-bottom-color:#ffcf5b;box-shadow:inset 0 1px #ffffff4a}
.screen{padding:14px 12px 30px}.mock-panel{margin-top:12px;background:linear-gradient(#fff,#fbfdff);border:2px solid #c9e2f4;border-radius:22px;box-shadow:0 8px 0 #b7cde055,0 14px 28px #133c6816;overflow:hidden}.mock-panel-title{display:flex;align-items:center;gap:8px;width:max-content;max-width:95%;margin:-2px 0 0 -2px;padding:9px 15px 10px;border-radius:20px 0 20px 0;background:linear-gradient(#1681d8,#0755a9);color:#fff;border-bottom:2px solid #063d80;box-shadow:0 4px 8px #0b4f952f}.mock-panel-title h2{font-size:17px;margin:0}.mock-panel-title small{font-size:9px;opacity:.85}.mock-panel-title.gold{background:linear-gradient(#efa526,#cc7415);border-bottom-color:#a45b0e}
.manaevo-brand-hero{position:relative;min-height:184px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:20px 16px;border-radius:26px;overflow:hidden;background:radial-gradient(circle at 82% 20%,#fff7ae 0 4%,transparent 20%),linear-gradient(145deg,#78d9ff 0,#ccefff 38%,#e8f8dd 67%,#9dd57c 100%);border:3px solid #fff;box-shadow:0 10px 28px #0e548738}.manaevo-brand-hero:before{content:'';position:absolute;inset:45% -10% -20% 15%;background:linear-gradient(150deg,transparent 0 22%,#ffffff6b 23% 24%,transparent 25%),linear-gradient(20deg,#65ad6e88,#387ba34d);clip-path:polygon(0 72%,18% 38%,31% 58%,46% 22%,61% 55%,76% 13%,100% 70%,100% 100%,0 100%)}.brand-lockup,.brand-partner{position:relative;z-index:1}.brand-lockup{display:flex;align-items:flex-start;gap:4px}.brand-lockup h1{margin:0;font-size:35px;line-height:1;letter-spacing:-.08em;text-shadow:0 3px 0 #fff,0 5px 0 #063b7a}.brand-lockup h1 b{color:#28a9ed}.brand-lockup h1 em{font-style:normal;color:#ffb71b}.brand-lockup p{margin:9px 0 0;font-size:12px;font-weight:900;color:#164c78}.brand-lockup p strong{color:#d88200}.brand-crystal{color:#43cfff;font-size:20px;text-shadow:0 0 6px #fff}.brand-partner{display:flex;flex-direction:column;align-items:center;align-self:flex-end}.brand-partner .placeholder-monster{width:108px;height:118px;flex-basis:108px}.brand-partner>span{margin-top:-4px;padding:4px 9px;border-radius:999px;background:#0756a8;color:#fff;font-size:10px;font-weight:900;border:2px solid #fff}
.home-flow-panel{padding-bottom:14px}.home-flow-strip{display:flex;align-items:center;justify-content:center;gap:2px;padding:16px 8px 2px}.home-flow-step{min-width:0;flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}.home-flow-step>b{width:27px;height:27px;display:grid;place-items:center;border-radius:50%;color:#fff;background:#1378c9;border:2px solid #fff;box-shadow:0 0 0 1px #1676b7}.home-flow-step:nth-of-type(3n){--step:#45a94d}.home-flow-step>span{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:#edf8ff;border:2px solid #c6e6fa;font-size:23px}.home-flow-step small{font-size:8px;font-weight:900;line-height:1.2}.home-flow-strip>i{font-style:normal;font-size:22px;font-weight:900;color:#2476b4;margin-top:24px}
.home-status-grid{display:grid;grid-template-columns:.82fr .72fr 1.35fr .85fr;padding:14px 10px 16px}.home-status-grid>div,.home-status-grid>button{min-width:0;padding:7px 9px;border-right:1px solid #cfe2ef;background:transparent;color:var(--me-ink);text-align:center}.home-status-grid>*:last-child{border-right:0}.home-status-grid span{display:block;font-size:9px;font-weight:800;color:#486782}.home-status-grid strong{display:block;margin-top:5px;font-size:20px;line-height:1.15}.home-status-grid strong small{font-size:9px;margin-left:2px}.home-status-grid .location-cell strong{font-size:14px}.home-status-grid .location-cell>small{font-size:9px;color:#5d7790}.partner-cell{display:flex;align-items:center;justify-content:center;gap:5px}.partner-cell>span{text-align:left;font-weight:900;color:#124675}.partner-cell>span small{display:block}.partner-cell .placeholder-monster.compact{width:42px;height:48px;flex-basis:42px}
.home-learning-panel{display:grid;grid-template-columns:1.25fr 1fr;align-items:center;gap:12px;padding:16px}.home-learning-copy h2{font-size:20px;margin:4px 0}.home-learning-copy p{font-size:11px;margin:4px 0;color:#58728c}.home-primary-actions{display:grid;gap:9px}.home-primary-actions button{width:100%;padding:13px 8px}.primary{background:linear-gradient(#ffb53d,#ef851b);border:2px solid #fff4bc;box-shadow:0 4px 0 #bd6415;color:#fff}.battle{background:linear-gradient(#ffb62e,#f1810f);border:2px solid #fff1a8;box-shadow:0 4px 0 #bb5c0a;color:#fff}.secondary{background:linear-gradient(#2c9de1,#0870bd);border:2px solid #c8eeff;box-shadow:0 4px 0 #07508e;color:#fff}
.home-guide-panel{padding-bottom:12px}.home-guide-list{display:grid;padding:10px 15px 4px}.home-guide-list p{display:grid;grid-template-columns:34px 1fr;align-items:center;gap:8px;margin:0;padding:10px 2px;border-bottom:1px dashed #ebc98f;font-size:12px;font-weight:800}.home-guide-list p:last-child{border-bottom:0}.home-guide-list b{font-size:20px}.green{color:#178c44}.orange{color:#df7114}.purple{color:#7448c4}.teal{color:#078b9b}.blue{color:#086dc3}.evolution-mini-goal{margin:6px 12px 2px;padding:10px 12px;border-radius:14px;background:#edf6ff;border:1px solid #bddcf3}.evolution-mini-goal strong,.evolution-mini-goal span{display:block}.evolution-mini-goal strong{font-size:12px;color:#0b5ca8}.evolution-mini-goal span{font-size:9px;margin-top:4px;color:#58758f}
.home-small-links{display:grid;grid-template-columns:1.1fr .9fr;gap:9px;margin-top:12px}.home-small-links>button{margin:0;min-width:0;border-radius:17px;padding:12px;background:#fff;border:1px solid #d3e5f2;box-shadow:0 5px 12px #173b6412}.howto-home-card,.parent-home-card{display:flex;align-items:center;justify-content:space-between;text-align:left;color:#17304f}.howto-home-card span,.parent-home-card small{font-size:9px;color:#66809a}
.game-bottom-nav{grid-template-columns:repeat(5,1fr);padding:7px 6px calc(7px + env(safe-area-inset-bottom));background:linear-gradient(#0a5daf,#07346f);border-top:3px solid #ffcc57;box-shadow:0 -8px 24px #072e623d}.game-bottom-nav button{position:relative;color:#e9f5ff;padding:8px 2px 6px;font-size:22px;border-radius:15px;border:1px solid transparent}.game-bottom-nav button span{font-size:9px;color:#fff;text-shadow:0 1px #06336c}.game-bottom-nav button.active{background:linear-gradient(#1599ed,#0871c8);color:#fff;border-color:#75d5ff;box-shadow:inset 0 0 0 1px #ffffff80,0 0 14px #31bdff80}.game-bottom-nav button.active:before{content:'✦';position:absolute;top:-13px;color:#ffd44e;text-shadow:0 0 6px #fff;font-size:15px}
@media(max-width:390px){.brand-lockup h1{font-size:31px}.brand-partner .placeholder-monster{width:92px;height:103px;flex-basis:92px}.home-flow-step>span{width:40px;height:40px;font-size:20px}.home-flow-step small{font-size:7px}.home-status-grid{grid-template-columns:1fr 1fr}.home-status-grid>div,.home-status-grid>button{border-bottom:1px solid #d8e7f1}.home-status-grid>*:nth-child(2){border-right:0}.home-status-grid>*:nth-child(3),.home-status-grid>*:nth-child(4){border-bottom:0}.home-learning-panel{grid-template-columns:1fr}.home-small-links{grid-template-columns:1fr}.game-bottom-nav button{font-size:20px}.game-bottom-nav button span{font-size:8px}}
`)

append('src/game/game.css', `

/* Mockup UI v3 — adventure, battle, raising/evolution */
.adventure-map>.back,.monster-screen-v2>.back{display:inline-flex;margin-bottom:6px;padding:8px 11px;border-radius:12px;background:#0b5ba7;color:#fff;box-shadow:0 3px 0 #073c72}.screen-title-row{margin:0 0 9px;padding:11px 14px;border-radius:18px;background:linear-gradient(#0879cd,#0751a4);color:#fff;border:2px solid #66c4f2;box-shadow:0 5px 0 #073d7b}.screen-title-row .eyebrow,.screen-title-row .area-level-band{color:#d9efff}.screen-title-row h1{margin:2px 0 4px}.screen-title-row>strong,.screen-title-row>span{align-self:center;background:#fff;color:#154e83;border-radius:999px;padding:6px 9px;font-size:.72rem}
.world-overview-card{position:relative;margin:12px 0;padding:14px;border-radius:23px;overflow:hidden;background:linear-gradient(145deg,#bcecff 0,#d9f4d8 42%,#dfeafe 68%,#e4d5c8 100%);border:3px solid #fff;box-shadow:0 7px 0 #aac8dd,0 12px 22px #173b6420}.world-overview-card:before{content:'';position:absolute;inset:42% -4% 0;background:linear-gradient(145deg,#63ad75,#b7d18e 45%,#87a6c5 70%,#a04f38);clip-path:polygon(0 42%,18% 8%,32% 48%,48% 18%,63% 52%,78% 3%,100% 48%,100% 100%,0 100%);opacity:.72}.world-overview-heading,.world-area-route{position:relative;z-index:1}.world-overview-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.world-overview-heading h2{margin:2px 0 9px;font-size:1rem}.world-overview-heading>span{font-size:.7rem;font-weight:900;background:#fff9df;border:2px solid #f1c45a;border-radius:12px;padding:7px;color:#24517b}.world-area-route{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:18px 3px 4px}.world-area-route:before{content:'';position:absolute;left:9%;right:9%;top:42px;height:5px;background:repeating-linear-gradient(90deg,#fff 0 11px,#e0b75c 12px 17px);border-radius:999px;box-shadow:0 2px #6587a6}.world-area-node{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 3px;border-radius:15px;background:#ffffffdf;color:#163f66;border:2px solid #c4deef;box-shadow:0 4px 8px #173b641f}.world-area-node>span{display:grid;place-items:center;width:39px;height:39px;margin-top:-16px;border-radius:50%;background:#0e68b7;color:#fff;border:3px solid #fff;font-size:19px;box-shadow:0 0 0 2px #dfb54a}.world-area-node b{font-size:.72rem}.world-area-node small{font-size:.58rem}.world-area-node.current{background:#fff8d8;border-color:#eebd3f;transform:translateY(-5px)}.world-area-node.locked{filter:grayscale(.8);opacity:.72}.world-area-node:disabled{cursor:not-allowed}
.world-area-tabs{display:none}.zone-map{border:3px solid #c5dff2;box-shadow:0 6px 0 #b9cee0;background:linear-gradient(#fff,#f7fbff)}.zone-map-title h2{font-size:1rem}.zone-grid:before{height:6px;background:repeating-linear-gradient(90deg,#98b7cc 0 10px,#eaf5fb 11px 16px)}.zone-grid button{border-width:3px;box-shadow:0 5px 0 #c5d6e4}.zone-grid button.active{border-color:#ffc445;background:#fff8d9;box-shadow:0 5px 0 #d5a529,0 0 18px #ffce4b55}.zone-path-dot{background:linear-gradient(#1695e7,#0767b7);border-color:#fff;box-shadow:0 0 0 2px #e9b941}.zone-grid button.zone-locked{background:#e7ecf0;color:#6f7881;box-shadow:0 5px 0 #b8bec4}
.stage-filters{display:flex;gap:6px;overflow:auto;padding:3px 0 6px}.stage-filters button{white-space:nowrap;padding:8px 10px;border-radius:999px;background:#e9f3fb;color:#466a89;font-weight:900;border:1px solid #c7dfef}.stage-filters button.active{background:#095cac;color:#fff;border-color:#5dc1f1}.monster-search{width:100%;border:2px solid #c5deef;border-radius:14px;padding:11px;background:#fff;color:#17304f}.daily-ticket-summary{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin:15px 0 8px;padding:11px 14px;border-radius:19px;background:#fff;border:2px solid #d5e4ef;box-shadow:0 5px 0 #c7d5df}.daily-ticket-summary>div{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center}.daily-ticket-summary>div>span{grid-row:1/3;font-size:29px}.daily-ticket-summary small{font-size:.65rem}.daily-ticket-summary strong{font-size:1.05rem}.daily-ticket-summary>i{width:1px;height:35px;background:#bdd2e1}.encounter-heading{background:linear-gradient(#0c6abb,#084d91);border:2px solid #6ac8f5;box-shadow:0 5px 0 #073a70}.full-master-stage-list{gap:9px}.formal-stage-card{grid-template-columns:34px 48px minmax(0,1fr) auto;position:relative;border:2px solid #d6e2ec;border-left-width:2px!important;border-radius:17px;padding:11px 10px;box-shadow:0 4px 0 #cad6df;background:#fff!important}.formal-stage-card .stage-number{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#1aa05b;color:#fff;font-size:14px;font-weight:900;border:2px solid #fff;box-shadow:0 0 0 1px #12834a}.formal-stage-card .stage-number b{font-size:14px}.recommendation-tag{position:absolute;right:8px;top:7px;padding:3px 7px;border-radius:999px;background:#1b85cf;color:#fff;font-size:.56rem;font-weight:900;border:1px solid #fff}.recommendation-tag.kind-boss{background:#e6543c}.recommendation-tag.kind-evolution-trial{background:#7450c2}.recommendation-tag.kind-giga-challenge,.recommendation-tag.kind-burst-challenge{background:#1f74bd}.formal-stage-card .stage-copy{padding-right:46px}.formal-stage-card .stage-copy>small{font-size:.57rem}.formal-stage-card .stage-copy>strong{font-size:.82rem}.formal-stage-card .stage-actions{display:flex;flex-direction:column;align-items:stretch;gap:3px;min-width:76px}.formal-stage-card .stage-actions>span,.formal-stage-card .stage-actions>small{font-size:.55rem}.formal-stage-card .stage-actions button{padding:8px 9px;border-radius:12px;background:linear-gradient(#168edf,#0968b4);color:#fff;font-weight:900;box-shadow:0 3px 0 #07508d}.formal-stage-card .stage-actions button:disabled{background:#b7c1ca;box-shadow:none}.formal-stage-card.zone-deep:not(.locked)::after{display:none}
.battle-screen-v2{background:linear-gradient(#bfeaff,#edf8ff 40%,#f7fbff)}.battle-head{padding:10px 12px;border-radius:18px;background:linear-gradient(#0879cd,#0751a4);color:#fff;border:2px solid #65c7f4;box-shadow:0 5px 0 #063d7c}.battle-head .back{color:#fff}.battle-head strong{font-size:1rem}.battle-arena-v2{border:4px solid #fff;box-shadow:0 0 0 2px #4a81a7,0 8px 20px #133d6825;min-height:390px}.fighter-info{border:2px solid #173d68;background:#102f4bd9;color:#fff}.fighter-info .type-pills span{color:#24415f;background:#fff}.hp-wrap{height:12px;border:2px solid #eaf8ff;background:#20374b}.hp-fill{background:linear-gradient(#8ff25a,#3ec74e)}.battle-log{border:2px solid #3279b7;box-shadow:0 4px 0 #0d2d58}.move-grid button{min-height:76px;border:3px solid #d7e5f3;box-shadow:0 4px 0 #c1d2df}.move-grid button:nth-child(1){background:linear-gradient(#fff8cf,#ffeaa3);border-color:#e9c047}.move-grid button:nth-child(2){background:linear-gradient(#e7f7ff,#ccecff);border-color:#58afe0}.move-grid button:nth-child(3){background:linear-gradient(#ebfaef,#ccebd3);border-color:#62b97a}.move-grid button:nth-child(4){background:linear-gradient(#f1ebff,#ddd0ff);border-color:#8c74d5}.battle-action-row{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.battle-action-row button{min-height:55px;border-radius:14px;box-shadow:0 4px 0 #b7c5d1}.capture-panel{display:block!important;padding:12px;border:3px solid #f4c147;border-radius:19px;background:linear-gradient(#fff9dc,#fff);box-shadow:0 5px 0 #d7a62f,0 8px 18px #8d66172b}.capture-main-cta{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;gap:0 10px;align-items:center;margin:-2px 0 10px;padding:12px 14px;border-radius:16px;background:linear-gradient(#c2cbd4,#8e9ba8);color:#fff;border:2px solid #fff;box-shadow:0 4px 0 #6f7881}.capture-main-cta.ready{background:linear-gradient(#ffc83e,#ef9615);box-shadow:0 4px 0 #bc6d0d,0 0 18px #ffca3c68}.capture-main-cta>span{grid-row:1/3;font-size:34px}.capture-main-cta strong{font-size:1.35rem;line-height:1}.capture-main-cta small{font-size:.7rem}.capture-panel h2{font-size:1rem}.capture-item-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.capture-panel .capture-item-grid button{display:flex;flex-direction:column;align-items:flex-start;text-align:left}.battle-point-guide{margin-top:12px;padding:13px;border-radius:19px;background:#fff;border:2px solid #d5e4ef;box-shadow:0 5px 0 #c8d5df}.battle-point-guide h3{margin:0 0 7px;padding-bottom:7px;border-bottom:1px dashed #a9c3d8;color:#0a5daa}.battle-point-guide>div{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px}.battle-point-guide p{margin:0;padding:5px 0;font-size:.72rem}.battle-point-guide p span{margin-right:5px}.battle-point-guide p b{color:#e35e23}.battle-evolution-ready{border:3px solid #ffcb48!important;box-shadow:0 5px 0 #d79f22,0 0 20px #ffc73e5c!important}.battle-evolution-ready .evolve-now{font-size:1.05rem;background:linear-gradient(#ffca40,#f18b12)!important;box-shadow:0 4px 0 #b9610c!important}
.monster-screen-v2 .screen-title-row{background:linear-gradient(#0b72c2,#06468f)}.monster-tabs button{border:2px solid #c8dced;box-shadow:0 3px 0 #bdccd8}.monster-tabs button.active{background:linear-gradient(#147cc9,#0758a8);border-color:#55bbef}.monster-detail-v2{border:3px solid #c9e2f2;box-shadow:0 6px 0 #bdceda}.monster-detail-hero{padding:9px;border-radius:17px;background:linear-gradient(135deg,#e9f8ff,#fff6d8)}.evo-progress{border:3px solid #efc24f;box-shadow:0 4px 0 #d4a53a;background:linear-gradient(#fff9dc,#fff)}.evo-progress>.primary{font-size:1rem;background:linear-gradient(#ffca3c,#f08714);box-shadow:0 4px 0 #b9620e}.evolution-method-guide,.evolution-explain-card{margin-top:10px;padding:12px;border-radius:16px;border:2px solid #c8dff0;background:#fff}.evolution-method-guide h3,.evolution-explain-card h3{margin:0 0 8px;font-size:.85rem}.evolution-method-guide>div{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.evolution-method-guide span{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:9px 5px;border-radius:12px;background:#eef7ff;font-size:1.2rem}.evolution-method-guide b{font-size:.62rem}.evolution-explain-card{background:linear-gradient(#f5fff1,#fff);border-color:#bcdba9}.evolution-explain-card h3{color:#237943}.evolution-explain-card p{margin:0;padding:7px 2px;border-bottom:1px dashed #bfd6b4;font-size:.72rem}.evolution-explain-card p:last-child{border-bottom:0}.evolution-explain-card b{color:#e26522}.evolution-celebration-card{border:3px solid #ffd058!important;box-shadow:0 0 0 5px #ffffff26,0 0 50px #ffc72d4f!important}
@media(max-width:390px){.world-area-route{gap:4px}.world-area-node b{font-size:.64rem}.world-area-node small{font-size:.52rem}.formal-stage-card{grid-template-columns:30px 42px minmax(0,1fr);padding:10px 8px}.formal-stage-card .stage-actions{grid-column:1/4;display:grid;grid-template-columns:auto 1fr;align-items:center}.formal-stage-card .stage-actions button{grid-column:2}.formal-stage-card .stage-copy{padding-right:42px}.battle-point-guide>div{grid-template-columns:1fr}.capture-item-grid{grid-template-columns:1fr}.evolution-method-guide>div{grid-template-columns:1fr 1fr 1fr}.evolution-method-guide b{font-size:.56rem}}
`)

// 6) Canonical design note so the visual system is not lost in later implementation/review rounds.
write('design/21-mockup-ui-visual-system.md', `# ManaEvo モックアップUI・ビジュアル正本\n\n更新日: 2026-08-25\nステータス: **正本仕様（ユーザー承認済み・実装済み）**\n\n## 1. 目的\n\nManaEvoを「データ一覧」ではなく、子どもが次の行動を直感的に選べる学習RPGとして見せる。承認されたモックアップの青・白・金を基調としたゲームUIを実装基準とする。\n\n## 2. ホーム\n\n画面上から次の順で意味が伝わること。\n\n1. マナエボのブランドと相棒\n2. **まなぶ → チケットGET → ぼうけん → バトル → つかまえる → そだてる・シンカ**\n3. 今日のチケット / マナ / 実際の現在地 / 相棒Lv\n4. 今日の学習進捗と「まなぶ」「ぼうけん」CTA\n5. ゲーム説明と次の進化目標\n\n## 3. ぼうけん\n\n- 上段にArea1〜4を一本のルートとして表示する。\n- 現在地を強調し、未解放エリアはロック表示する。\n- エリア内は **入口 → 中盤 → 奥地** の3ノード。実際の解放条件と見た目を一致させる。\n- 通常表示は「きょうの であい」最大5件。野生・シンカしれん・特殊しれん・ボスを混ぜ、未GET / 初回 / 育成向け / おすすめ等の意味タグを表示する。\n- 全件確認は「ほかも さがす」。\n\n## 4. バトル\n\n- 技4枠を色分けして視認性を上げる。\n- 捕獲可能時の主CTAは **「わを なげる」**。HP50%以下の条件をその場で明示する。\n- リング種別の選択は既存4種と捕獲率ロジックを維持する。\n- 画面内に「HP50%以下」「1バトル3回」「チーム3体」「勝利で経験値」の4ポイントを短く表示する。\n\n## 5. そだてる・シンカ\n\n- モンスター画面の主目的を「そだてる・シンカ」として見せる。ボックス/図鑑は同画面の機能として維持する。\n- シンカ条件は **レベル / いし / もちもの＋次のLv** の3系統を常時理解できるよう表示する。\n- 「GET直後の即進化を避ける」「自分で育てて進化」「自力進化で第2形態の場所が開く」を説明する。\n- バトル結果で進化可能になった場合は **「✨ いま シンカする！」** から全画面進化演出へ直接つなぐ。\n\n## 6. 共通ビジュアル\n\n- 基調: 青 / 白 / 金。成功=緑、ボス=赤、試練=紫。\n- 大見出しは青いゲームパネル。主要CTAは金〜オレンジ。\n- 子ども向けに、太字・短文・大きなタップ領域・アイコン併用。\n- 下部ナビは **ホーム / まなぶ / ぼうけん / モンスター / あそびかた** の5枠固定。\n- iPhone縦画面を第一基準とする。\n`)

replaceOnce(
  'design/00-README.md',
  `- \`design/20-world-map-evolution-progression.md\``,
  `- \`design/20-world-map-evolution-progression.md\`\n- \`design/21-mockup-ui-visual-system.md\``,
  'design index link'
)

// 7) Lightweight structural regressions in addition to full existing tests/E2E.
write('tests/mockup-ui-v3.test.js', `import test from 'node:test'\nimport assert from 'node:assert/strict'\nimport fs from 'node:fs'\n\nconst app = fs.readFileSync('src/App.jsx', 'utf8')\nconst screens = fs.readFileSync('src/game/GameScreens.jsx', 'utf8')\nconst styles = fs.readFileSync('src/styles.css', 'utf8')\n\ntest('approved five-tab navigation is present in the child game shell', () => {\n  for (const label of ['ホーム','まなぶ','ぼうけん','モンスター','あそびかた']) assert.ok(app.includes('>' + label + '</span>'), label)\n  assert.ok(app.includes('game-bottom-nav'))\n})\n\ntest('home exposes the approved six-step learning to evolution loop', () => {\n  for (const label of ['まなぶ','チケットGET','ぼうけん','バトル','つかまえる','そだてる・シンカ']) assert.ok(app.includes(label), label)\n  assert.ok(app.includes('いまの じょうきょう'))\n  assert.ok(app.includes('ゲームせつめい'))\n})\n\ntest('adventure UI exposes world route, daily five and recommendation meaning', () => {\n  assert.ok(screens.includes('world-overview-card'))\n  assert.ok(screens.includes('daily-ticket-summary'))\n  for (const tag of ['おすすめ','未GET','育成向け','初回']) assert.ok(screens.includes(tag), tag)\n})\n\ntest('battle and evolution keep the mockup primary actions visible', () => {\n  assert.ok(screens.includes('capture-main-cta'))\n  assert.ok(screens.includes('わを なげる'))\n  assert.ok(screens.includes('✨ いま シンカする！'))\n  assert.ok(screens.includes('シンカの ほうほう'))\n  assert.ok(screens.includes('シンカの せつめい'))\n})\n\ntest('mockup visual system is installed', () => {\n  assert.ok(styles.includes('Mockup UI v3'))\n  assert.ok(styles.includes('--me-gold'))\n})\n`)

console.log('Applied approved ManaEvo mockup UI v3')
