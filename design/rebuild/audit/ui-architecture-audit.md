# ManaEvo UI / UX・画面遷移・PWA・コード構造監査

- Worker: SOL⑤ / Worker 5
- Phase: Rebuild Phase 1.5 exact-baseline re-evaluation
- Audit date: 2026-08-25
- Scope: **監査・canonical draftのみ**。UI実装、`src/**`、CSS、tests、PWAコード、ゲームロジック、データマスターは変更しない。
- PR: #39 / `rebuild/worker-5-ui-architecture-audit`

---

# 0. Executive judgment

Phase 1で特定したROOT原因は、Phase 1 Commander Review・later approved design・現行runtime再確認後も**維持**する。

最重要結論は「CSSをもう少し整える」ではない。

現在のManaEvo UIは、

1. 旧UIを残したまま新UIを上に積む
2. screen ownershipではなくCSS load orderと`!important`で最終見た目を決める
3. 画面の目的を絞らず説明・機能を常時追加する
4. route/state/overlayの所有者を分けない
5. テストが子どもの体験ではなくclass/source/load-orderを固定する

という構造により、修正するほど「情報の多いWebアプリ」へ寄り、本物のゲーム画面から遠ざかっている。

Phase 1.5ではこの診断を維持し、新たに `design/rebuild/canonical-draft/UI-SCREEN-CONTRACT.md` を作成して、10画面について通常状態で**表示すべきもの / 表示してはいけないもの**を契約化した。

---

# 1. Authority / baseline re-evaluation

再建中の正本順位は以下。

1. ユーザーの明示決定
2. exact `mana-evo-terra-FINAL-CORRECTED`
3. 理由・承認が確認できる後続仕様
4. current canonical
5. data master
6. runtime
7. 過去レビュー/完了報告

`PHASE-1-COMMANDER-REVIEW.md` により、司令塔はexact archiveを正常展開し、原本32ファイルを確認済み。UI監査で重要な原本として以下が確認されている。

- `00-START-HERE.md`
- `03-screens-catch-and-raise.md`
- `08-gameplay-state-spec.md`
- `09-implementation-traceability.md`
- `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
- `13-EXECUTION-FLOW.md`

またPhase 1のexact baseline確認で、baseline captureは勝利後 `ENCOUNTERED → BATTLING → WON → CAPTURE → RESOLVED` だったことが確認済み。ただしこれはUDE-002の後続ユーザー明示判断により、現行正本では「敵HP50%以下から戦闘中捕獲・最大3投」へ置換される。

`03-screens-catch-and-raise` 系のbaseline intentとして、捕獲前にリング選択判断へ必要な成功率/所持/投数等を見せ、捕獲は4段階の判定演出を持つこと、育成詳細では次の進化と必要条件を行動判断可能にすることが重要である。

### Evidence limitation

Worker 5の現在の実行環境から添付ZIP payloadそのものを再オープンできず、W-001 PR #35にもまだimmutable payloadが着地していない。そのため、`08/09/11/13`の未取得本文について行番号レベルの新規主張を捏造しない。

本更新は、司令塔がexact 32ファイルを直接確認した記録、Phase 1でexact baselineから再判定済みの事実、回収済みユーザー判断、Git上のlater design/runtimeを組み合わせて再判定する。原本payload着地後に追加差異が見つかった場合は、このdraftを司令塔側で補正する。

---

# 2. Later designの採否再判定

## design/20 — KEEP direction, constrain presentation

`20-world-map-evolution-progression.md` の以下は維持する。

- 「学ぶ→チケット→冒険→バトル→GET→育成→自力進化→次の場所」の感情ループ
- current area / zone / recommended Lv
- 入口→中盤→奥地
- 通常探索は最大5候補
- 全件は `ほかも さがす`
- `adventureLocation`を実際の現在地として扱う
- 自力進化を大きな報酬として見せる

特に「巨大一覧を通常画面の前面に出さない」は今回のcanonical screen contractへそのまま採用する。

## design/21 — Visual direction KEEP, information exposure RECLASSIFY

青/白/金、大きいタップ領域、iPhone縦優先、ゲームらしい視覚表現はKEEP。

ただし以下を通常状態の必須表示として扱うのは取り下げる。

- Homeの6段階フロー常設
- Homeのゲーム説明常設
- Battleの4ポイントTips常設
- Monsterでチーム/BOX/図鑑/進化説明を一画面へ常時集約

これらは「説明があること」と「いつでも全部見えること」を混同している。HowTo/contextual disclosureへ移すべき。

## design/22 — Premium direction KEEP, override architecture REJECT

safe-area、resource label、Adventure世界感、Monsterのチーム主役、Dex grid directionはKEEP。

一方で `premium-ui-v4.css` を最終override layerとして追加し、旧CSSの上からvisual authorityを奪う実装方式は再建方針と矛盾するため、将来実装では継承しない。

UDE-006は「UI修正実装の明示依頼」の証拠ではあるが、21/22の全要素を永久に常時表示する承認ではない。従って、later visual directionとlater structural overexposureを分離する。

---

# 3. ROOT cause re-evaluation

## ROOT-1 — UI authorityがscreen contractではなく既存DOMになっている
**Status: CONFIRMED**

現行は既存DOMを残すことが先で、その上にカード・説明・Hero・overrideを追加してきた。結果、画面のPURPOSEより「既存要素を壊さず全部残す」が優先される。

### Consequence
- 削除が設計上の選択肢にならない
- 新UIは旧UIの外側/下側に足される
- 画面が縦長化し、主CTAが埋もれる

### Required correction
実装前にscreen contractで `MUST NOT SHOW` / `REMOVE` を固定する。追加ではなく置換・削除を許可する。

---

## ROOT-2 — CSS authorityがload order / `!important`
**Status: CONFIRMED**

`src/main.jsx` の現行import順は概ね:

1. `kids-quest-study/styles/learning.css`
2. `styles.css`
3. `parent-controls.css`
4. `kids-quest-study/styles/trace-mobile.css`
5. `game/runtime.css`
6. `premium-ui-v4.css`

さらに `game.css` は `GameScreens.jsx` 側から読み込まれる。

`tests/premium-ui-v4.test.js` は明示的に、`premium-ui-v4.css` が `runtime.css` より後に読み込まれ「visual authority」になることをPASS条件としている。

つまりUI仕様の権威がcomponent/screen ownershipではなく読み込み順になっている。

### Required correction
将来のtargeted rebuildでscreen/component stylesheet ownershipを一本化し、旧layerを残したまま `premium-ui-v5.css` を追加することを禁止する。

---

## ROOT-3 — legacy + new UI accumulation
**Status: CONFIRMED**

PR #31/#32の方向自体には承認済みvisual improvementsがあるが、既存画面を構造的に減らさず、新しい説明panel/世界map/premium stylingを積んだ。

### Concrete symptom
Adventureでは「世界を先に見せる」ためのworld routeを追加した後も旧Area tabsが残る。Homeでは新しい6-step/game explanationが旧status/action群と同居する。

### Required correction
「KEEP/REMOVE/REBUILD」を画面ごとに実行し、二重UIを一つにする。

---

## ROOT-4 — Home情報過多
**Status: CONFIRMED**

現行Homeは同一通常状態に以下を持つ。

- Brand hero + partner
- 6-step flow
- ticket/mana/location/partner status grid
- learning progress
- Study CTA + Adventure CTA
- game explanation 4 rows
- evolution mini goal
- HowTo link
- Parent link

子どもの最初の問い「いま何をすればいい？」より、ゲーム全体の説明が前に出ている。

### Required correction
Home normal stateは partner / today's learning / ticket / actual location / next evolution / **single contextual primary CTA** に収束。ゲーム説明はHowToへ。

---

## ROOT-5 — Battle多目的化
**Status: CONFIRMED**

現行Battleは同じDOM flowへ以下を積む。

- battle arena
- battle log
- move grid
- protect
- Giga/Burst
- capture panel
- ring choices/chance
- capture stars
- battle point guide
- team switch
- result
- evolution-now

### Cognitive problem
通常ターンで必要なのは「このターン何をする？」だが、画面は捕獲ルール・チーム管理・特殊形態・Tipsまで同時に教えようとする。

### Required correction
Battle command areaをstate-drivenに置換する。Captureはfocused substate、forced switchはswitch state、resultはresult state。通常turnで全機能を縦積みしない。

---

## ROOT-6 — Monster多目的化
**Status: CONFIRMED**

現行MonsterはTeam/Box/Dex tabsに加え、選択個体detail内へ:

- stats
- moves
- normal evolution
- evolution method guide
- evolution explanation
- Giga
- Burst

を常設する。

### Required correction
Team first + selected detailを通常状態とし、Box/Dex/Special/Move detailは二次状態。進化説明は「今の個体に必要な条件」を優先し、一般論tutorialはHowToへ。

---

## ROOT-7 — navigation ownership不明
**Status: CONFIRMED**

`App.jsx` は単一 `view` 文字列でHome/Study/Adventure/Monster/HowTo/Parent等を切替えるが、Battleは `view='adventure'` のまま `game.activeBattle` で切替、CaptureはBattle内、DexはMonster tab、EvolutionはMonster/Battle overlay。

さらにbottom nav、各画面の `←ホーム`、Home direct links、HowTo cross-links、Battle result linksが併存する。

### Required correction
Top-level navigation ownershipとflow state ownershipを分ける。

- top-level: Home / Study / Adventure / Monster / HowTo
- focused: Study activity / Battle / Capture / Evolution / Parent
- Dex: Monsterから入るlocal route/state

focused stateではglobal navを必要に応じて抑止し、戻り先をownerが決める。

---

## ROOT-8 — `kids-quest-study` / `src/study` 二重構造
**Status: CONFIRMED**

`App.jsx` は `kids-quest-study` からGameContext、ActivityPlayer、FreeStudy、Review、Trial、Dictionary、SRS等を直接参照する。一方、`GameScreens.jsx` は `../study/srs.js` を参照し、`src/study`側runtime/adapterも残る。

Kids Questは「migration source snapshot」という説明と「active runtime」の役割を同時に持ってしまっている。

### UX consequence
Study/Parentで別アプリ由来のvisual shellが露出し、ManaEvoの一貫性が切れる。

### Required correction
学習ロジックのsource of truthはWorker 2/canonical decisionに従って保持するが、UI shellとintegration boundaryはManaEvo側で一本化する。学習ロジックを書き直す話ではない。

---

## ROOT-9 — MonsterArt解決多重化
**Status: CONFIRMED**

`PlaceholderMonster`という名前のcomponentが実質的にformal SVG、official WebP、legacy sprite、generated placeholder等のresolver責務を持ち、番号条件も混ざる。

UDE-004では正式画像未完成ならplaceholder可だが、これは「表示resolverを複数正本化してよい」という意味ではない。

### PWA interaction
`sw.js` は `/monsters/` をcache-first対象とするため、同URL画像差し替えはcache invalidation contractなしでは既存PWAへ古い画像を残し得る。

### Required correction
将来 `MonsterArt` contractを一本化し、asset version/update contractをPWAとセットで定義する。

---

## ROOT-10 — UI testsが体験よりclass/load-orderを固定
**Status: CONFIRMED**

代表例として `premium-ui-v4.test.js` は:

- premium CSSがruntime CSSより後
- `premium-world-map` class存在
- `encounter-art` class存在
- team showcase class存在

等を固定する。

これは実装詳細の回帰にはなるが、

- first viewportで主CTAが見えるか
- normal Adventureに二重Area selectorがないか
- 390px iPhoneで検索/filterが常時画面を圧迫しないか
- Captureがfocused stateになっているか
- 子どもがHome→Study→Adventure→Battle→Capture→Monster→Evolutionを完走できるか

を保証しない。

### Required correction
Phase 2ではcanonical acceptanceをuser-flow / state / viewport assertionへ移す。CSS import順そのものを仕様にしない。

---

# 4. Screen-by-screen reclassification

| Screen | KEEP | REMOVE from normal state | REBUILD target |
|---|---|---|---|
| Home | partner, learning status, ticket, current location, next evo | 6-step permanent guide, permanent game manual, duplicated status | single contextual next action |
| Study | Kids Quest logic, required tasks, optional modes | engine terminology, optional modes competing before required work, shell split | ManaEvo shell + required-first |
| Adventure | world/zone, Lv danger, max5 encounters, browse-all | world route + Area tabs duplication, permanent filter/search, giant list | world→zone→max5 progressive flow |
| Battle | arena, HP, actionable moves, capture access | permanent capture grid/tips/team list/special explanations | state-driven command surface |
| Capture | 4 rings, count, real chance, 3 attempts, 4-stage judgment | normal Battle controls, unrelated explanations | focused in-battle state |
| Monster | team first, selected art/stats, next evo, Box/Dex access | permanent general evo guide, evo explanation, full special cards | one selected monster decision |
| Dex | GET/seen progress, grid, silhouette states | active No.239, always-expanded database controls | grid-first + optional filter/detail |
| Evolution | before/after, stat gains, unlock, celebration | nav/tabs/tutorial clutter | full-screen reward sequence |
| HowTo | short core loop, contextual next evo, gameplay links | all topics fully expanded | topic-based progressive help |
| Parent | PIN/adult gate, settings ownership | child nav, pre-gate settings, child tutorial | isolated ManaEvo adult shell |

The detailed contract for each field (`PURPOSE`, `PRIMARY CTA`, `MUST SHOW`, `MUST NOT SHOW`, `CHILD DECISION`, `ENTRY`, `EXIT`, `OVERLAY/MODAL`, `STATE`, `KEEP`, `REMOVE`, `REBUILD`) is now in `design/rebuild/canonical-draft/UI-SCREEN-CONTRACT.md`.

---

# 5. Priority violations visible in current runtime

## Adventure P0

Current `StageMap` contains both:

- `world-area-route`
- `world-area-tabs`

and then exposes:

- `stage-filters`
- `monster-search`

before the encounter list.

Although daily mode later limits candidates to five, the first-view hierarchy still presents duplicate navigation plus browse controls.

**Canonical correction:** one area navigation; filter/search only after `ほかも さがす`; max5 normal candidates.

## Battle/Capture P0

Current Battle renders expanded Capture controls and Battle Tips as permanent sections during ordinary battle turns.

**Canonical correction:** Battle normal turn owns moves/actions only; Capture opens a focused state after child selects capture.

## Home P0

Current Home is an explanatory dashboard rather than a next-action screen.

**Canonical correction:** one contextual primary CTA based on learning/ticket/evolution state; the rest is motivation/context.

## Monster P0

Current selected detail permanently explains evolution methods and special forms after already showing the actionable evolution card.

**Canonical correction:** actionable condition first; general method/special rules on demand.

## HowTo P1

Current HowTo contains a useful amount of knowledge but expands most of it simultaneously.

**Canonical correction:** topic list first; detail expanded only for the selected question. Contextual next-evolution help remains high value.

---

# 6. PWA audit re-evaluation

Current PWA architecture itself is not the main cause of “not a real game screen,” but it amplifies visual inconsistency during asset replacement.

`public/sw.js`:

- versioned cache name (`manaevo-pwa-v8` at observation time)
- navigation network-first/fallback
- `assets/`, `monsters/`, `icons/` cache-first

### Risk retained
A formal monster image replaced at the same URL may remain cached until cache version/update propagation occurs. Because art resolution is already multi-source, this can make “source says formal but device shows old art” difficult to diagnose.

### Future contract
- one art URL/version authority
- explicit cache invalidation requirement when formal art changes
- WebKit installed-PWA update test
- offline behavior remains regression-protected

No PWA code is changed in this Worker 5 task.

---

# 7. CSS rebuild direction for later phase

Do **not** solve this audit by adding another global stylesheet.

Target sequence after commander unlock:

1. Freeze canonical screen DOM/state contract.
2. Identify stylesheet owner for shell and each feature.
3. Remove/retire superseded selectors before adding replacement selectors.
4. Eliminate cross-screen `!important` except documented accessibility/platform necessity.
5. Keep safe-area rules as shell responsibility.
6. Delete tests that require “later stylesheet wins” as product behavior; replace with rendered acceptance.

Success criterion: changing one screen does not require knowing the global import position of an unrelated historical stylesheet.

---

# 8. Test rebuild direction for later phase

Future UI tests should prove **experience contracts**.

P0 WebKit flows:

1. Home incomplete → Study required task visible and dominant.
2. Study completion → reward → Adventure available.
3. Adventure default → exactly one area navigation representation; no visible search/filter; encounter candidates <=5.
4. Start battle → normal turn has current commands, not expanded capture/tips/team sections.
5. Reduce enemy to capture threshold → open Capture → ring chance/count/attempts visible.
6. Throw ring → four-stage temporal outcome → success/failure returns to correct state.
7. Battle growth makes evolution available → result `いま シンカする！` → full-screen Evolution → updated monster/dex/unlock.
8. Monster default → team first; Dex/Box not simultaneously rendered as full views.
9. HowTo landing → topics, not entire manual wall.
10. Parent → protected gate; exit relocks.

Viewport checks:
- iPhone width 390px as mandatory first-class target
- safe area / home indicator
- primary CTA first-viewport visibility
- no horizontal overflow

Static tests may still verify canonical constants/accessibility labels, but must not replace the user-flow tests.

---

# 9. Implementation order after commander gate

No implementation in this PR. Recommended dependency order after canonical approval:

### P0-A — Shell / state ownership
- top-level navigation ownership
- focused flow ownership
- Home hierarchy

### P0-B — Core game vertical slice
- Adventure progressive disclosure
- Battle turn surface
- Capture focused state
- Battle result → Evolution

### P0-C — Monster
- team/detail
- Box local state
- Dex local state
- special detail disclosure

### P0-D — Study integration
- preserve learning behavior
- unify shell and routing ownership

### P1
- HowTo progressive topics
- Parent adult shell
- PWA art/cache contract

### Cross-cutting before release
- CSS authority consolidation
- MonsterArt authority
- WebKit child-flow E2E

---

# 10. Phase 1.5 deliverable gate

This Worker 5 update intentionally changes documentation only.

Expected PR #39 diff after this commit:

- UPDATE `design/rebuild/audit/ui-architecture-audit.md`
- ADD `design/rebuild/canonical-draft/UI-SCREEN-CONTRACT.md`

Must remain unchanged:

- `src/**`
- `*.css`
- `tests/**`
- `public/sw.js` / manifest / PWA assets
- game rules/data master

## Final judgment

The previous ROOT analysis survives exact-baseline re-evaluation. The key new decision is architectural: **the next UI implementation must begin by enforcing what each normal screen is forbidden to show, not by adding more explanation or a stronger CSS layer.**

That is the boundary required to stop the repeated cycle of “make it more game-like” → “add more panels” → “add stronger CSS” → “screen becomes busier.”
