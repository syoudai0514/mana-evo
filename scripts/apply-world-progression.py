from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'needle not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


world = '''export const WORLD_AREA_META = Object.freeze([
  {
    area: 1,
    name: 'ひかりの のはら',
    icon: '🌿',
    levelMin: 5,
    levelMax: 22,
    levelLabel: 'おすすめ Lv.5〜22',
    zones: [
      { id: 'meadow', name: 'はじまりの そうげん', icon: '🌱', minLevel: 5, maxLevel: 10 },
      { id: 'forest', name: 'こもれびの もり', icon: '🌳', minLevel: 11, maxLevel: 16 },
      { id: 'deep', name: 'ひかりの おくち', icon: '✨', minLevel: 17, maxLevel: 22 }
    ]
  },
  {
    area: 2,
    name: 'ほのおの かざん・すなの たに',
    icon: '🌋',
    levelMin: 18,
    levelMax: 38,
    levelLabel: 'おすすめ Lv.18〜38',
    zones: [
      { id: 'foothill', name: 'かざんの ふもと', icon: '🔥', minLevel: 18, maxLevel: 24 },
      { id: 'magma', name: 'マグマどうくつ', icon: '🌋', minLevel: 25, maxLevel: 31 },
      { id: 'deep', name: 'すなあらしの おくち', icon: '🏜️', minLevel: 32, maxLevel: 38 }
    ]
  },
  {
    area: 3,
    name: 'こおりの うみ・ふかい もり',
    icon: '❄️',
    levelMin: 32,
    levelMax: 58,
    levelLabel: 'おすすめ Lv.32〜58',
    zones: [
      { id: 'coast', name: 'こおりの かいがん', icon: '🧊', minLevel: 32, maxLevel: 40 },
      { id: 'frost', name: 'じゅひょうの もり', icon: '🌲', minLevel: 41, maxLevel: 49 },
      { id: 'deep', name: 'ふかい もりの おく', icon: '🌌', minLevel: 50, maxLevel: 58 }
    ]
  },
  {
    area: 4,
    name: 'ぎんがの みやこ・そらの はて',
    icon: '🌠',
    levelMin: 50,
    levelMax: 80,
    levelLabel: 'おすすめ Lv.50〜80',
    zones: [
      { id: 'city', name: 'ほしの みやこ', icon: '🌃', minLevel: 50, maxLevel: 60 },
      { id: 'skyway', name: 'てんくう かいろう', icon: '☁️', minLevel: 61, maxLevel: 70 },
      { id: 'deep', name: 'ぎんがの はて', icon: '🌌', minLevel: 71, maxLevel: 80 }
    ]
  },
  {
    area: 5,
    name: 'EX いせかい',
    icon: '🌀',
    levelMin: 70,
    levelMax: 100,
    levelLabel: 'おすすめ Lv.70〜100',
    zones: [{ id: 'ex', name: 'EX いせかい', icon: '🌀', minLevel: 70, maxLevel: 100 }]
  }
])

function numberOf(species) {
  const parsed = Number.parseInt(String(species?.no || '').replace(/\\D/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function metaForStage(stage) {
  if (['event', 'ex'].includes(stage?.kind) || Number(stage?.area) > 4) return WORLD_AREA_META[4]
  return WORLD_AREA_META.find((meta) => meta.area === Number(stage?.area)) || WORLD_AREA_META[0]
}

function zoneForStage(meta, stage, species) {
  if (meta.area === 5) return meta.zones[0]
  if (stage?.kind === 'boss') return meta.zones[meta.zones.length - 1]
  if (['evolution-trial', 'giga-challenge', 'burst-challenge'].includes(stage?.kind)) return meta.zones[meta.zones.length - 1]
  const formStage = Math.max(1, Number(species?.stage) || 1)
  if (formStage >= 2) return meta.zones[meta.zones.length - 1]
  const earlyZones = meta.zones.slice(0, Math.min(2, meta.zones.length))
  return earlyZones[numberOf(species) % earlyZones.length]
}

export function enrichStage(stage, species) {
  if (!stage || stage.legacy) return stage
  const meta = metaForStage(stage)
  const zone = zoneForStage(meta, stage, species)
  const formStage = Math.max(1, Number(species?.stage) || 1)
  const isFinalEvolution = formStage > 1 && !species?.evolution
  const isEvolvedWild = stage.kind === 'wild' && formStage >= 2
  const isFirstEvolvedForm = isEvolvedWild && !isFinalEvolution
  const next = {
    ...stage,
    adventureArea: meta.area,
    adventureAreaName: meta.name,
    zoneId: zone.id,
    zoneName: zone.name,
    zoneIcon: zone.icon,
    minEnemyLevel: zone.minLevel,
    maxEnemyLevel: zone.maxLevel,
    levelLabel: `Lv.${zone.minLevel}〜${zone.maxLevel}`,
    firstAcquireByEvolution: isFirstEvolvedForm,
    advancedEvolutionWild: isFirstEvolvedForm
  }

  // 第2形態の初回入手は自力進化。進化後に dex.caught が立つので奥地野生が解禁される。
  if (isFirstEvolvedForm) next.requiresOwnedSpeciesId = species.id

  // 最終進化形は通常野生では出さない。単段階種(stage=1)は例外。
  if (stage.kind === 'wild' && isFinalEvolution) {
    next.hidden = true
    next.captureDisabled = true
    next.finalEvolutionOnly = true
  }

  // ストーリー進行を大量収集チェックから切り離す。
  if (stage.kind === 'boss' && meta.area <= 4) next.minAreaClears = 5
  return next
}
'''
Path('src/game/worldProgression.js').write_text(world, encoding='utf-8')

replace_once(
    'src/game/content.js',
    "} from './runtimeMaster.generated.js'\n\nexport const TYPES",
    "} from './runtimeMaster.generated.js'\nimport { WORLD_AREA_META, enrichStage } from './worldProgression.js'\n\nexport const TYPES"
)
replace_once(
    'src/game/content.js',
    "export const STAGES = [...RUNTIME_STAGES, ...LEGACY_STAGES]\nexport { RUNTIME_META, RUNTIME_STAGES }\n\nexport const AREA_META = [1, 2, 3, 4].map((area) => {\n  const first = Object.values(SPECIES).find((species) => species.area === area)\n  return { area, name: first?.areaName || `エリア${area}` }\n})",
    "const BASE_STAGES = [...RUNTIME_STAGES, ...LEGACY_STAGES]\nexport const STAGES = BASE_STAGES.map((stage) => stage.legacy ? stage : enrichStage(stage, SPECIES[stage.enemySpeciesId]))\nexport { RUNTIME_META, RUNTIME_STAGES }\n\nexport const AREA_META = WORLD_AREA_META.filter((meta) => meta.area <= 4).map((meta) => ({ ...meta }))\nexport const EX_AREA_META = { ...WORLD_AREA_META.find((meta) => meta.area === 5) }"
)

replace_once('src/game/balance.js', 'export const BALANCE_VERSION = 3', 'export const BALANCE_VERSION = 4')
replace_once(
    'src/game/balance.js',
    "const statMultiplier = (value, fallback = 1) => clamp(0.5, Number(value) || fallback, 4)\n",
    "const statMultiplier = (value, fallback = 1) => clamp(0.5, Number(value) || fallback, 4)\n\nfunction stageLevelBounds(stage) {\n  const min = clamp(1, Math.floor(Number(stage?.minEnemyLevel) || 1), MAX_MONSTER_LEVEL)\n  const max = clamp(min, Math.floor(Number(stage?.maxEnemyLevel) || MAX_MONSTER_LEVEL), MAX_MONSTER_LEVEL)\n  return { min, max }\n}\n\nfunction clampStageLevel(stage, level) {\n  const { min, max } = stageLevelBounds(stage)\n  return clamp(min, Math.floor(Number(level) || min), max)\n}\n"
)
replace_once(
    'src/game/balance.js',
    "function validBossSnapshot(snapshot, stage) {\n  return !!snapshot && snapshot.stageId === stage?.id && Number(snapshot.lockedLevel) >= 1 && Number(snapshot.lockedLevel) <= MAX_MONSTER_LEVEL\n}",
    "function validBossSnapshot(snapshot, stage) {\n  if (!snapshot || snapshot.stageId !== stage?.id || Number(snapshot.balanceVersion) !== BALANCE_VERSION) return false\n  const { min, max } = stageLevelBounds(stage)\n  return Number(snapshot.lockedLevel) >= min && Number(snapshot.lockedLevel) <= max\n}"
)
replace_once(
    'src/game/balance.js',
    '    const level = levelForTargetPower(species, targetPower, statMultipliers)',
    '    const level = clampStageLevel(stage, levelForTargetPower(species, targetPower, statMultipliers))'
)
replace_once(
    'src/game/balance.js',
    '  const level = levelForTargetPower(species, targetPower)',
    '  const level = clampStageLevel(stage, levelForTargetPower(species, targetPower))'
)

replace_once(
    'src/game/GameScreens.jsx',
    "  if (stage.requiresOwnedSpeciesId && !game.dex?.caught?.[stage.requiresOwnedSpeciesId]) return `${speciesOf(stage.requiresOwnedSpeciesId)?.name || '対象'}を GETしよう`",
    "  if (stage.requiresOwnedSpeciesId && !game.dex?.caught?.[stage.requiresOwnedSpeciesId]) {\n    const required = speciesOf(stage.requiresOwnedSpeciesId)\n    return stage.firstAcquireByEvolution ? `まず ${required?.name || 'このすがた'}に シンカさせよう` : `${required?.name || '対象'}を GETしよう`\n  }"
)
replace_once(
    'src/game/GameScreens.jsx',
    "    if (stage.legacy) return false\n",
    "    if (stage.legacy || stage.hidden) return false\n"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<p className=\"kid-note\">{dailyCompleted ? 'きょうの まなびクリア！ 手持ちの強さに合わせて、ちょうどいい相手になるよ。' : 'チケットを持っていても、きょうの まなびを終えてからバトルへ。'}</p>",
    "<p className=\"kid-note\">{dailyCompleted ? 'きょうの まなびクリア！ エリアと ゾーンで てきの強さが ちがうよ。そだてた強さを ためしてみよう！' : 'チケットを持っていても、きょうの まなびを終えてからバトルへ。'}</p>"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<h1>{area <= 4 ? AREA_META.find((item) => item.area === area)?.name : 'スペシャルエリア'}</h1>",
    "<h1>{area <= 4 ? AREA_META.find((item) => item.area === area)?.name : 'スペシャルエリア'}</h1>{area <= 4 && <p className=\"area-level-band\">📍 いまのエリア　{AREA_META.find((item) => item.area === area)?.levelLabel}</p>}"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<article key={stage.id} className={`stage-card formal-stage-card ${!unlocked ? 'locked' : ''}`}>",
    "<article key={stage.id} className={`stage-card formal-stage-card area-${stage.area} zone-${stage.zoneId || 'special'} ${!unlocked ? 'locked' : ''}`}>"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<small>{stageKindLabel(stage.kind)}　{enemy?.no ? `No.${enemy.no}` : ''}</small>",
    "<small>{stage.zoneIcon || '🗺️'} {stage.zoneName || stageKindLabel(stage.kind)}　・　{stageKindLabel(stage.kind)}　{enemy?.no ? `No.${enemy.no}` : ''}</small>"
)
replace_once(
    'src/game/GameScreens.jsx',
    "<span>{enemy?.name}　{stage.bossRank ? `BOSS ${stage.bossRank}` : '手持ちに合わせて調整'}</span>",
    "<span>{enemy?.name}　{stage.bossRank ? `BOSS ${stage.bossRank}` : stage.levelLabel || `Lv.${stage.enemyLevel || 1}`}</span>"
)
replace_once(
    'src/game/GameScreens.jsx',
    '<main className="screen battle-screen-v2">',
    '<main className={`screen battle-screen-v2 area-theme-${stage?.area || 5}`}>'
)
replace_once(
    'src/game/GameScreens.jsx',
    "<div className=\"battle-head\"><button className=\"back\" onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button><strong>{stage?.label}</strong><span>TURN {battle.turn}</span></div>",
    "<div className=\"battle-head\"><button className=\"back\" onClick={exit}>{finished ? '← マップ' : '✕ やめる'}</button><strong>{stage?.zoneName ? `${stage.zoneName}｜${stage.label}` : stage?.label}</strong><span>TURN {battle.turn}</span></div>"
)

replace_once(
    'src/App.jsx',
    "import { speciesOf } from './game/content.js'",
    "import { AREA_META, speciesOf } from './game/content.js'\nimport { levelsUntilEvolution } from './game/engine.js'"
)
replace_once(
    'src/App.jsx',
    "  const canAdventure = dailyCompleted && ticketCount > 0\n",
    "  const canAdventure = dailyCompleted && ticketCount > 0\n  const nextEvolution = species?.evolution ? speciesOf(species.evolution.to) : null\n  const evolutionLeft = monster ? levelsUntilEvolution(monster) : null\n  const clearedStages = new Set(game.stagesCleared || [])\n  const currentAreaNo = [1, 2, 3, 4].reduce((best, areaNo) => areaNo === 1 || clearedStages.has(`a${areaNo - 1}-boss`) ? Math.max(best, areaNo) : best, 1)\n  const currentArea = AREA_META.find((meta) => meta.area === currentAreaNo)\n"
)
replace_once(
    'src/App.jsx',
    "    <section className={`adventure-card ${!canAdventure?'locked':''}`}>",
    "    <section className=\"world-status-card\"><div><p className=\"eyebrow\">📍 いまの ぼうけん</p><h2>エリア{currentAreaNo}　{currentArea?.name}</h2><p>{currentArea?.levelLabel}。つよくなったら、まえのエリアへ もどって せいちょうも ためせるよ。</p></div><div className=\"evolution-goal\"><strong>{nextEvolution ? (evolutionLeft === 0 ? '✨ シンカできるよ！' : evolutionLeft != null ? `あと ${evolutionLeft}Lvで ${nextEvolution.name}` : `つぎは ${nextEvolution.name}`) : '👑 さいしゅうの すがた！'}</strong><span>{nextEvolution ? 'はじめての シンカが、つぎの野生出会いも ひらく！' : 'ギガ・バーストや EXを めざそう！'}</span></div></section>\n    <section className={`adventure-card ${!canAdventure?'locked':''}`}>"
)

replace_once(
    'src/HowToPlay.jsx',
    '<Step number="7" icon="🌱" title="そだてて シンカ！">バトルで けいけんを ためて レベルアップ！ シンカの じょうけんが そろったら「モンスター」から シンカできるよ。</Step>',
    '<Step number="7" icon="🌱" title="そだてて シンカ！">バトルで けいけんを ためて レベルアップ！ シンカの じょうけんが そろったら「モンスター」から シンカできるよ。2だんかいめの すがたは、まず じぶんで シンカさせるのが だいじ！ いちど シンカすると、おくの つよいゾーンでも であえるようになるよ。</Step>'
)

css = '''

/* World progression redesign: area identity + evolution goal */
.area-level-band{margin:.35rem 0 0;font-size:.82rem;font-weight:900;opacity:.78}
.world-status-card{display:grid;grid-template-columns:1.25fr 1fr;gap:12px;margin:12px 0;padding:16px;border-radius:22px;background:linear-gradient(135deg,#101b3d,#1d356c);color:#fff;box-shadow:0 12px 26px rgba(10,24,58,.22)}
.world-status-card h2{margin:.2rem 0 .35rem;font-size:1.15rem}.world-status-card p{margin:.2rem 0;line-height:1.55}.world-status-card .eyebrow{color:#b9d8ff}
.evolution-goal{align-self:stretch;display:flex;flex-direction:column;justify-content:center;padding:12px;border-radius:16px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.18)}
.evolution-goal strong{font-size:1.05rem;line-height:1.35}.evolution-goal span{margin-top:6px;font-size:.78rem;line-height:1.45;opacity:.86}
.formal-stage-card{overflow:hidden;position:relative;transition:transform .16s ease,box-shadow .16s ease}.formal-stage-card:not(.locked):active{transform:scale(.985)}
.formal-stage-card.area-1{border-left:5px solid #42a76b;background:linear-gradient(110deg,#f7fff8,#ffffff 58%)}
.formal-stage-card.area-2{border-left:5px solid #e66a3a;background:linear-gradient(110deg,#fff7ef,#ffffff 58%)}
.formal-stage-card.area-3{border-left:5px solid #4aa7d8;background:linear-gradient(110deg,#f2fbff,#ffffff 58%)}
.formal-stage-card.area-4{border-left:5px solid #765fd3;background:linear-gradient(110deg,#f7f3ff,#ffffff 58%)}
.formal-stage-card.zone-deep:not(.locked)::after{content:'上級';position:absolute;right:8px;top:8px;padding:3px 7px;border-radius:999px;background:#17264f;color:white;font-size:.66rem;font-weight:900;letter-spacing:.04em}
.battle-screen-v2.area-theme-1 .battle-arena-v2{background:linear-gradient(#9fe0ff 0 38%,#80c967 39% 100%)}
.battle-screen-v2.area-theme-2 .battle-arena-v2{background:linear-gradient(#4d2842 0 36%,#c65932 37% 70%,#9d6c3c 71% 100%)}
.battle-screen-v2.area-theme-3 .battle-arena-v2{background:linear-gradient(#b8e7ff 0 35%,#e7f8ff 36% 63%,#47745d 64% 100%)}
.battle-screen-v2.area-theme-4 .battle-arena-v2{background:radial-gradient(circle at 22% 18%,rgba(255,255,255,.8) 0 2px,transparent 3px),radial-gradient(circle at 78% 30%,rgba(255,255,255,.75) 0 2px,transparent 3px),linear-gradient(#171944 0 58%,#5265a8 59% 100%)}
.battle-screen-v2.area-theme-5 .battle-arena-v2{background:radial-gradient(circle at 50% 35%,#7559c5,#201d4e 55%,#10142d)}
@media(max-width:640px){.world-status-card{grid-template-columns:1fr}.evolution-goal{padding:10px}.battle-head strong{max-width:55%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
'''
with Path('src/game/game.css').open('a', encoding='utf-8') as f:
    f.write(css)


design = '''# ManaEvo ワールド・進化・育成コンセプト

更新日: 2026-08-25
状態: **正本仕様（ユーザー承認済み）**

## 1. このゲームで一番大事にする感情

ManaEvo は「強いキャラを拾うゲーム」ではなく、**学んで、出会って、自分で育て、自分で進化させたから強くなったと感じるゲーム**にする。

基本ループは次の通り。

**まなぶ → チケット → ぼうけん → バトル → GET → そだてる → シンカ → もっと強い場所へ**

子どもが毎日感じてほしいことは以下。

- 「あと少しでシンカするから、今日もやりたい」
- 「自分で育てたから、この姿になった」
- 「前は強かった場所が簡単になった。ぼくのチームが強くなった」
- 「次のエリアには何がいるんだろう」

## 2. 当初設計から維持・復活する原則

- 敵の強さは手持ちへ完全追従させず、**エリア／ゾーンごとのLv帯**を持つ。
- 前のエリアへいつでも戻れる。強くなってから戻れば明確に楽になる。
- ボス撃破で次エリアを解放する。
- 最終進化形は通常野生でGETさせない。
- 制作管理上の `area` と、ゲーム内で体験する `adventure area / zone` は分けて考えられる。
- 学習部分（Kids Quest由来の学習エンジン）は今回の変更対象外。

## 3. 今回強化する進化ルール

### 第1形態
通常の探索ゾーンで野生GETできる。

### 第2形態
**初回入手は必ず自分で進化させる。**

その種を一度自力で第2形態へ進化させると、その姿が図鑑上で取得済みになり、同じ姿の野生個体が上級／奥地ゾーンで解禁される。これにより、個体を増やしたい・別個体を育てたい需要を残しながら、初進化の感動を飛ばせなくする。

### 最終進化形
通常の野生探索には出さない。ボス・強敵・試練で姿を見ることはあっても、通常捕獲はできない。**最終形は育てた仲間が到達するごほうび**とする。

### 単段階種
もともと進化しない `stage=1` の種は例外として野生GET可能。

## 4. ワールドとゾーン

| エリア | 世界 | Lv帯 | 主な役割 |
|---|---|---:|---|
| 1 | ひかりの のはら | 5〜22 | はじめての捕獲・最初の進化 |
| 2 | ほのおの かざん・すなの たに | 18〜38 | 育成と相性を意識し始める |
| 3 | こおりの うみ・ふかい もり | 32〜58 | 進化後個体・高難度探索 |
| 4 | ぎんがの みやこ・そらの はて | 50〜80 | 最終育成・強敵・特殊形態への準備 |
| EX | いせかい | 70〜100 | クリア後のやりこみ |

各エリアは「入口／中盤／奥地」の3段階を基本とする。第2形態の野生個体は原則として奥地側へ寄せる。

## 5. 敵Lvの決め方

完全固定でも完全追従でもなく、次のハイブリッド制とする。

`enemyLevel = clamp(zone.minLv, softScaledLevel, zone.maxLv)`

これにより、弱いチームで高エリアへ行けば本当に危険、適正帯では事故が少ない、強くなって前エリアへ戻れば圧倒的に楽、の3つを同時に成立させる。

ボスもゾーンLv下限を持ち、弱い編成に合わせて極端に弱くならない。初回ボススナップショットはバランスバージョン更新時に再評価できる。

## 6. ストーリー進行と収集を分離する

「そのエリアの全モンスターを大量に埋めないとボスへ行けない」は避ける。ボス解放は主ルート相当の少数クリアを基準にし、現行実装ではまず **5探索クリア** を基準にする。

図鑑埋め・レア個体・上級ゾーンは寄り道とやりこみにする。

## 7. UI/UXの原則

- ホームで現在地（エリア名・推奨Lv）を常に見せる。
- ホームで相棒の「次の進化まで」を常に見せる。
- マップはエリア名だけでなく、ゾーン名とLv帯を明示する。
- エリアごとにバトル背景の雰囲気を変える。
- 奥地／上級ゾーンは見た目でも危険さが伝わるようにする。
- 進化可能になったら「シンカできるよ！」を最優先級で見せる。
- 将来、進化は全画面演出（暗転→光→シルエット変化→新姿→能力上昇）へ拡張する。

## 8. 1日3バトルを「作業」にしない

基本学習で得る3チケットは、単なる周回回数ではなく「今日は何に使うか」を選ぶ資源にする。未取得の第1形態、初進化後に解禁した第2形態、シンカしれん、ボス、ギガ／バースト試練、奥地の強敵などから選ぶ。

## 9. 実装上の現在ルール

- `src/game/worldProgression.js` がワールド／ゾーンLv帯とランタイム付加ルールを持つ。
- 第2形態の野生ステージは `requiresOwnedSpeciesId = 自分自身` とする。`evolveInstance()` が進化後を `dex.caught` に登録する既存仕様を利用し、**自力進化後だけ解禁**する。
- 最終進化形の通常wildステージはランタイム上 `hidden + captureDisabled` とし、マップに表示しない。
- ボスの `minAreaClears` は当面5。
- `balance.js` はゾーンLv下限・上限でソフトスケーリングをクランプする。

## 10. 今後の拡張

今回で基礎ループを正す。次段階では、巨大な「1体1ステージ一覧」をさらに減らし、**ワールド → エリア → ゾーン → 今日見つかっている3〜5候補**という探索UXへ進化させる。チケット消費は候補を見てバトルを選んだ後とし、子どもが「ハズレを引いてチケットを失った」と感じにくくする。

正式画像011〜238やギガ／バースト専用画像の制作状況とは独立して、このゲームループは動作すること。
'''
Path('design/20-world-map-evolution-progression.md').write_text(design, encoding='utf-8')

p = Path('design/00-README.md')
t = p.read_text(encoding='utf-8')
marker = 'design/20-world-map-evolution-progression.md'
if marker not in t:
    t += '\n\n## 2026-08-25 ワールド・進化・育成コンセプト\n\n正本: [`20-world-map-evolution-progression.md`](./20-world-map-evolution-progression.md)\n\n当初設計の「エリア固定寄りの敵Lv・最終形は野生入手不可」を復活し、さらに「第2形態の初回入手は自力進化、初進化後に上級ゾーン野生解禁」を正式採用する。完全手持ち追従ではなく、ゾーンLv帯でクランプするハイブリッド制を正とする。\n'
    p.write_text(t, encoding='utf-8')

p = Path('README.md')
t = p.read_text(encoding='utf-8')
if marker not in t:
    t += '\n\n### ゲームコンセプト正本\n\nワールド・進化・育成の最新方針は [`design/20-world-map-evolution-progression.md`](design/20-world-map-evolution-progression.md) を参照してください。\n'
    p.write_text(t, encoding='utf-8')


test = '''import test from 'node:test'
import assert from 'node:assert/strict'
import { AREA_META, SPECIES, STAGES, speciesOf } from '../src/game/content.js'
import { buildEnemyPlan } from '../src/game/balance.js'
import { evolveInstance, isStageUnlocked } from '../src/game/engine.js'
import { createGameState } from '../src/game/progression.js'

test('world areas expose explicit progression bands and zones', () => {
  assert.deepEqual(AREA_META.map((a) => [a.area, a.levelMin, a.levelMax]), [
    [1, 5, 22], [2, 18, 38], [3, 32, 58], [4, 50, 80]
  ])
  assert.ok(AREA_META.every((a) => a.zones.length === 3))
})

test('second-form wild encounter is locked until that form has been obtained by evolution', () => {
  const stage = STAGES.find((s) => s.kind === 'wild' && s.area === 1 && speciesOf(s.enemySpeciesId)?.stage === 2 && speciesOf(s.enemySpeciesId)?.evolution)
  assert.ok(stage, 'area1 should contain a non-final second form')
  assert.equal(stage.firstAcquireByEvolution, true)
  assert.equal(stage.requiresOwnedSpeciesId, stage.enemySpeciesId)

  const predecessor = Object.values(SPECIES).find((s) => s.evolution?.to === stage.enemySpeciesId && s.evolution?.method === 'level')
  assert.ok(predecessor, 'needs a level-evolution predecessor for the test')
  const game = createGameState()
  game.box = {
    evo: {
      instanceId: 'evo', speciesId: predecessor.id, level: predecessor.evolution.level,
      xp: 0, heldItemId: null, evolutionReady: false, caughtAt: Date.now()
    }
  }
  game.team = ['evo']
  game.activeMonsterId = 'evo'
  game.dex = { seen: { [predecessor.id]: true }, caught: { [predecessor.id]: true } }
  assert.equal(isStageUnlocked(game, stage), false)

  const evolved = evolveInstance(game, 'evo')
  assert.equal(evolved.ok, true)
  assert.equal(evolved.to, stage.enemySpeciesId)
  assert.equal(evolved.game.dex.caught[stage.enemySpeciesId], true)
  assert.equal(isStageUnlocked(evolved.game, stage), true)
})

test('final evolved forms are not normal wild map targets', () => {
  const illegal = STAGES.filter((s) => s.kind === 'wild' && !s.legacy).filter((s) => {
    const species = speciesOf(s.enemySpeciesId)
    return species?.stage > 1 && !species?.evolution && !s.hidden
  })
  assert.equal(illegal.length, 0)
})

test('normal encounter scaling is clamped to the zone level band', () => {
  const weakGame = createGameState()
  const hard = STAGES.find((s) => s.kind === 'wild' && !s.hidden && s.area === 4)
  assert.ok(hard)
  const hardPlan = buildEnemyPlan(weakGame, hard, speciesOf)
  assert.ok(hardPlan.level >= hard.minEnemyLevel)

  const strongGame = createGameState()
  strongGame.box[strongGame.team[0]].level = 100
  const easy = STAGES.find((s) => s.kind === 'wild' && !s.hidden && s.area === 1)
  assert.ok(easy)
  const easyPlan = buildEnemyPlan(strongGame, easy, speciesOf)
  assert.ok(easyPlan.level <= easy.maxEnemyLevel)
})

test('story bosses use a small route-clear gate instead of half the species catalog', () => {
  const bosses = STAGES.filter((s) => s.kind === 'boss' && [1, 2, 3, 4].includes(s.area))
  assert.equal(bosses.length, 4)
  assert.ok(bosses.every((s) => s.minAreaClears === 5))
})
'''
Path('tests/world-progression.test.js').write_text(test, encoding='utf-8')
