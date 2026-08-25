from pathlib import Path


def replace(path, old, new, count=1):
    p = Path(path)
    text = p.read_text()
    found = text.count(old)
    if found < count:
        raise SystemExit(f"{path}: expected at least {count} occurrence(s), found {found}: {old[:100]!r}")
    text = text.replace(old, new, count)
    p.write_text(text)

# Load the premium override after every legacy/game stylesheet.
replace(
    'src/main.jsx',
    "import './game/runtime.css'\n",
    "import './game/runtime.css'\nimport './premium-ui-v4.css'\n",
)

# Header resources: remove ambiguous bare icons. The star means the capture item 'ほしのわ'.
replace(
    'src/App.jsx',
    "function StatusBar({ game, today }) {\n  return <div className=\"status-bar\"><span>🎫 {availableTicketCount(game, today)}</span><span>💎 {game.mana}</span><span>⭐ {game.captureItems?.star || 0}</span></div>\n}",
    "function StatusBar({ game, today }) {\n  const tickets = availableTicketCount(game, today)\n  const starRings = game.captureItems?.star || 0\n  return <div className=\"status-bar resource-bar\" aria-label=\"もちもの\">\n    <span className=\"resource-pill ticket\" title=\"バトルチケット：ぼうけんで1まい使う\"><i>🎫</i><strong>{tickets}</strong><small>チケット</small></span>\n    <span className=\"resource-pill mana\" title=\"マナ：まなびでたまる成長のちから\"><i>💎</i><strong>{game.mana}</strong><small>マナ</small></span>\n    <span className=\"resource-pill star\" title=\"ほしのわ：モンスターをGETするときに使う\"><i>⭐</i><strong>{starRings}</strong><small>ほしのわ</small></span>\n  </div>\n}",
)
replace(
    'src/App.jsx',
    '<header><div className="logo">',
    '<header className="game-header"><div className="logo">',
)

# Allow premium screens to request meaningful artwork sizes without duplicating the monster renderer.
replace(
    'src/game/PlaceholderMonster.jsx',
    'export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false }) {',
    'export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false, size: requestedSize = null }) {',
)
replace(
    'src/game/PlaceholderMonster.jsx',
    '  const size = compact ? 50 : 124',
    '  const size = requestedSize || (compact ? 50 : 124)',
)

# How-to: make the partner/evolution target visual instead of a tiny icon.
replace(
    'src/HowToPlay.jsx',
    '<div className="howto-next-monster"><PlaceholderMonster speciesId={monster.speciesId} compact /></div>',
    '<div className="howto-next-monster"><PlaceholderMonster speciesId={monster.speciesId} size={92} /></div>',
)

# Adventure: scenic map class + large encounter art.
replace(
    'src/game/GameScreens.jsx',
    '<section className="world-overview-card">',
    '<section className={`world-overview-card premium-world-map area-${area}`}>',
)
replace(
    'src/game/GameScreens.jsx',
    '              <PlaceholderMonster speciesId={stage.enemySpeciesId} compact />',
    '              <div className="encounter-art"><PlaceholderMonster speciesId={stage.enemySpeciesId} size={dailyMode ? 96 : 76} /></div>',
)

# Monster cards: the three active team members are visual showcase cards, while box stays compact.
replace(
    'src/game/GameScreens.jsx',
    'function MonsterRow({ monster, game, setGame, selected, setSelected }) {',
    'function MonsterRow({ monster, game, setGame, selected, setSelected, showcase = false }) {',
)
replace(
    'src/game/GameScreens.jsx',
    '  return <article className={`monster-row ${selected ? \'selected\' : \'\'}`} onClick={() => setSelected(monster.instanceId)}>\n    <PlaceholderMonster speciesId={monster.speciesId} compact />',
    '  return <article className={`monster-row ${showcase ? \'showcase\' : \'\'} ${selected ? \'selected\' : \'\'}`} onClick={() => setSelected(monster.instanceId)}>\n    <PlaceholderMonster speciesId={monster.speciesId} size={showcase ? 92 : 56} compact={!showcase} />',
)
replace(
    'src/game/GameScreens.jsx',
    '<div className="monster-detail-hero"><PlaceholderMonster speciesId={monster.speciesId} /><div>',
    '<div className="monster-detail-hero"><PlaceholderMonster speciesId={monster.speciesId} size={178} /><div>',
)

old_monster_header = '''    <button className="back" onClick={goHome}>← ホーム</button>\n    <div className="screen-title-row"><div><p className="eyebrow">モンスター</p><h1>そだてる・シンカ</h1></div><span>GET {caughtCount}/238　発見 {seenCount}/238</span></div>\n    <div className="monster-tabs"><button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>手持ち {team.length}/3</button><button className={tab === 'box' ? 'active' : ''} onClick={() => setTab('box')}>ボックス {box.length}</button><button className={tab === 'dex' ? 'active' : ''} onClick={() => setTab('dex')}>図鑑 238</button></div>\n    {tab === 'team' && <><div className="monster-list">{team.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}\n    {tab === 'box' && <><p className="kid-note">手持ちは3体まで。タイプのちがう仲間を組み合わせよう！</p><div className="monster-list">{box.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}\n    {tab === 'dex' && <><p className="kid-note">No.001〜238の正式マスターで動いているよ。登録済みの正式画像はそのまま表示し、まだ画像ファイルがない個体だけ専用の準備中表示になるよ。ギガ/バーストを初めて使うと同じ図鑑枠に登録マークがつくよ。</p><DexGrid game={game} /></>}'''
new_monster_header = '''    <button className="back" onClick={goHome}>← ホーム</button>\n    <section className="monster-hq-hero">\n      <div><p className="eyebrow">MONSTER BASE</p><h1>そだてる・シンカ</h1><p>3たいの なかまと つよくなろう。シンカできる なかまは ここで光るよ。</p></div>\n      <div className="monster-hq-progress"><span><strong>{caughtCount}</strong><small>/238 GET</small></span><span><strong>{seenCount}</strong><small>/238 はっけん</small></span></div>\n    </section>\n    <div className="monster-tabs"><button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>⚔️ チーム {team.length}/3</button><button className={tab === 'box' ? 'active' : ''} onClick={() => setTab('box')}>📦 ボックス {box.length}</button><button className={tab === 'dex' ? 'active' : ''} onClick={() => setTab('dex')}>📖 ずかん</button></div>\n    {tab === 'team' && <><div className="monster-list team-showcase">{team.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} showcase />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}\n    {tab === 'box' && <><p className="kid-note">つれていけるのは3たい。タイプや シンカの近さをみて チームをつくろう！</p><div className="monster-list">{box.map((monster) => <MonsterRow key={monster.instanceId} monster={monster} game={game} setGame={setGame} selected={selected === monster.instanceId} setSelected={setSelected} />)}</div><DetailPanel game={game} setGame={setGame} instanceId={selected} onEvolution={setEvolutionReveal} /></>}\n    {tab === 'dex' && <><p className="kid-note">みつけると シルエットがひらき、GETすると カラーで とうろく。ギガ・バーストの すがたも 同じずかんに のこるよ。</p><DexGrid game={game} /></>}'''
replace('src/game/GameScreens.jsx', old_monster_header, new_monster_header)

# Record the premium UI as the current visual target in the design index.
index = Path('design/00-README.md')
text = index.read_text()
line = '- [22-premium-ui-v4.md](./22-premium-ui-v4.md) — iPhone safe-area / premium adventure map / monster-base visual standard\n'
if line not in text:
    text += ('\n' if not text.endswith('\n') else '') + line
    index.write_text(text)

print('premium UI v4 patch applied')
