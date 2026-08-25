# ManaEvo UI / UX・画面遷移・PWA・コード構造監査

- Worker: SOL⑤ / Worker 5
- Audit date: 2026-08-25
- Scope: **監査のみ**。UI実装、CSS、ゲームロジック、データマスターは変更しない。
- Governance base: `rebuild/canonical-governance` (`4cdf2692674e2ae14bdfab3b8b3e976e8e32771c`)
- Runtime observation: `main` (`1594a8c6f4aca510957c3057bcc07f9cb7a4ec52`)
- Baseline status: W-001 PR #35 は exact `mana-evo-terra-FINAL-CORRECTED(3).zip` 未取得のため **BLOCKED**。preserved original source files = 0。

---

## 0. 監査上の前提

`REBUILD-START-HERE.md`、`design/rebuild/DECISION-LOG.md`、`WORK-QUEUE.md`、`HANDOFF-TEMPLATE.md` を先に確認した。

この監査では以下を厳守する。

1. 現行runtimeを正本としない。
2. FINAL-CORRECTEDを無条件に巻き戻し先としない。
3. 「動く」「CIが通る」「今コードにある」を仕様決定の根拠にしない。
4. UIを旧UIの上に追加して直す方式を採らない。
5. FINAL-CORRECTEDの実体が未救出のため、原本に存在した具体的な画面レイアウトを推測で断定しない。
6. 原本欄は、**exact baselineで確認できた事実**と、現存する旧設計・履歴から再構成できる**baseline-adjacent evidence**を分けて記載する。

### FINAL-CORRECTEDについて現時点で言えること

W-001 PR #35 により、exact archive はまだGitHubへ保存されていない。したがって「FINAL-CORRECTEDのホームはこの配置だった」等は現時点では証明不能である。

一方、現存する `design/01-catch-and-evolution-design.md`、`design/03-screens-catch-and-raise.md`、`design/20-world-map-evolution-progression.md` とUI変更前後のcommit履歴から、次の**画面思想**は高い確度で確認できる。

- 中心は **「捕まえたい / 育てたい / 進化させたい / 次を見たい → だからもう少し学ぶ」**。
- 体験ループは **まなぶ → チケット → ぼうけん → バトル → GET → そだてる → シンカ → 次の場所**。
- 情報そのものを見せることより、子どもが「次に何をしたいか」を作ることが先。
- 捕獲・進化条件など、行動判断に必要な情報はその行動時に見える必要がある。

これは「すべての説明を常時表示する」という意味ではない。むしろ現在は、必要情報とチュートリアル情報が混在し、ゲームの主行動を弱めている。

---

# 1. 結論 — なぜ何度直しても「本物のゲーム画面」にならないのか

原因は単一のCSS品質ではなく、以下の**10個の構造問題が連鎖していること**である。

## ROOT-1: 正本の優先順位が途中で逆転していた

再建governanceは「現行runtimeは参考事実であって正本ではない」と定めている。一方、現行 `design/00-README.md` は現行runtime起点で仕様を説明しており、実装者が「今あるものを正として磨く」方向へ誘導されやすい。

その結果、仕様の目的を再確認するより先に、現在のDOMへ見た目を足す修正が繰り返された。

**影響:** 画面の存在理由より、既存要素を残すことが優先される。

## ROOT-2: CSSの権威が「設計」ではなく「読み込み順」になっている

現在は概ね次の層が共存する。

- `src/styles.css` 冒頭の旧共通UI
- 同じ `styles.css` 後半の `Mockup UI v3`
- `src/game/game.css` の旧ゲームUI
- 同 `game.css` 後半の world progression / adventure v2 追記
- `src/game/runtime.css` の追加override
- `src/premium-ui-v4.css` の最終override
- `how-to-play.css`
- `parent-controls.css`
- `kids-quest-study/styles/learning.css`
- `trace-mobile.css`

さらに `premium-ui-v4.css` には多数の `!important` があり、`tests/premium-ui-v4.test.js` は「premium CSS が runtime CSS より後で読み込まれ、visual authorityになる」こと自体をテストしている。

つまり現在のUI契約は、**どの画面がどのCSSを所有するか**ではなく、**最後に読み込んだCSSが勝つ**である。

**影響:** 1画面を直すと別レイヤーの古い指定が残る。次の修正はさらに強いselector / `!important` を足すことになり、整理されない。

## ROOT-3: 「ゲーム画面」を作る代わりに「説明を追加」している

PR #31 (`687151e...`) の直前、Homeは比較的単純だった。

- 今日の学習
- 現在地 / 次の進化
- ぼうけんCTA
- 学習 / モンスター
- 保護者 / あそびかた

PR #31 後は、以下が常時表示される。

- ブランドHero
- 6段階のゲームフロー説明
- 所持/現在地/相棒状況
- 学習パネル + 2CTA
- ゲーム説明4行
- 進化説明
- あそびかた
- 保護者

「ゲームらしくする」ために、子どもが理解すべきルールをHomeへ追加した結果、Homeが**ゲーム開始画面ではなく説明ダッシュボード**になった。

同じ現象が Battle、Monster、HowTo でも起きている。

## ROOT-4: 1画面に複数の仕事を持たせすぎている

代表例:

- Battle = 戦闘 + 戦闘ログ + 技説明 + 防御 + 特殊形態 + 捕獲説明 + 捕獲選択 + バトルTips + チーム交代
- Monster = チーム + BOX + 図鑑 + 育成詳細 + 技一覧 + 通常進化 + 進化チュートリアル + ギガ + バースト
- HowTo = 初心者導線 + 捕獲 + 進化 + アイテム + 報酬 + 特殊形態 + 現在の進化目標

画面単位の主目的が1つに絞られていない。

## ROOT-5: 画面遷移が「route」ではなく単一 `view` とローカルstateの寄せ集め

`App.jsx` は `view` 文字列1つで Home / Study / Adventure / Monster / HowTo / Parent等を切り替える。

一方で、

- Battle は `view='adventure'` のまま `game.activeBattle` で切替
- Capture は Battle内の条件付きpanel
- Dex は Monster内tab
- Evolution は Monster/Battle内overlay
- StudyのActivity/Free/Review/Trial/Dictionaryは別 `view`

となっている。

さらに、

- 下部5tab
- 各画面の「← ホーム」
- Home内の直リンク
- HowTo内の Study / Adventure / Monster 直リンク
- Battle result内の Map / Study 直リンク

が併存する。

これは「遷移先が多い」のではなく、**グローバルナビ・ローカル戻る・クロスリンク・状態遷移の責任が分離されていない**状態である。

## ROOT-6: Kids Questが「移植元snapshot」と「実行中UI」の両方になっている

`src/kids-quest-study/README.md` は、このdirectoryを「migration source snapshot」と説明し、ManaEvo active runtime は `src/study` / `src/game` としている。

しかし実際の `App.jsx` は直接、以下を `kids-quest-study` から利用する。

- `GameContext`
- `ActivityPlayer`
- `FreeStudyScreen`
- `ReviewScreen`
- `ChapterTestScreen`
- `EnglishDictionaryScreen`
- TTS / SFX / activity / mission / grade等

一方 `src/study` にも旧runtime/adapterが残り、`GameScreens.jsx` は `../study/srs.js` 経由、`App.jsx` は `kids-quest-study/engine/srs.js` 直参照である。

さらに ActivityPlayer / ParentScreen は Kids Quest由来の `Starfield` / `AppHeader` / `.card` / `.btn` / `learning.css` を使う。

**結果:** ManaEvoの中に「Kids Questという別アプリの画面」がそのまま埋め込まれ、学習開始時にUI shellが切り替わる。機能移植としては合理的でも、完成ゲームの画面構造としては未統合。

## ROOT-7: 正式画像の解決契約が一本化されていない

`PlaceholderMonster.jsx` は名前と責務が一致していない。実際には、

1. No.001〜020なら `/monsters/{speciesId}.svg`
2. `species.officialImageUrl`（runtime generatorでは `/monsters/{id}.webp`）
3. 条件付きlegacy sprite
4. generated placeholder

を1componentで解決する。

現行main自体が「No.001-020はSVGを優先、WebPをfallback」としている。`public/monsters/.formal-v1-marker.txt` は No.001-010 WebP を「Temporary formal release for in-game visual QA」と説明する。

つまり「正式画像」が、マスター上の `officialImageUrl` と、番号条件で優先されるSVGの2系統存在する。

**結果:** 正式/仮/レビュー用の意味がcomponent名・data master・asset directoryで一致せず、差し替え時に何が表示されるか追いにくい。

## ROOT-8: PWAの画像cacheが正式画像差し替えと相性が悪い

`sw.js` は `/monsters/` を **cache-first** にする。

同じURLの正式画像を差し替えても、service workerのcache key/versionを更新しなければ、既存PWAでは古い画像を返し続け得る。

現在の静的PWA testは、icon寸法・canonical URL・cache version文字列・precache存在等を確認するが、**正式画像更新時のcache invalidation契約**は確認しない。

UIを直したのに端末で古く見える、という再現性の低い問題を生みやすい。

## ROOT-9: UI testが「体験」ではなく「文字列/classが存在すること」を固定している

例:

- `mockup-ui-v3.test.js`: 6段階フロー、ゲーム説明、class名がsourceにあること
- `premium-ui-v4.test.js`: premium CSSがruntime CSSより後にあること
- `navigation.test.js`: `setView('adventure')` 等のsource regex

これらはregression guardとしては一部有用だが、

- 主CTAがfirst viewportに見えるか
- 情報が多すぎないか
- 画面を戻れるか
- 390px iPhoneで要素が競合しないか
- child flowが最後まで完走できるか
- 正式画像が表示されているか

は保証しない。

Playwright WebKit E2Eは存在するが、現時点では `capture-ring.webkit.spec.js` の捕獲2ケースのみである。

## ROOT-10: 巨大componentがUI責務とゲーム状態を密結合している

- `App.jsx`: 約17KB
- `GameScreens.jsx`: 約40KB

`GameScreens.jsx` に Map / Battle / Capture / Monster / Dex / Evolution Celebration が同居する。

画面を「少し直す」だけでも同一巨大ファイルと複数global CSSへ触りやすく、局所修正が局所で終わらない。

---

# 2. CSS / UIアーキテクチャ監査

## 現行の問題構造

### `src/styles.css`

- 冒頭に旧generic shell / header / nav / placeholder / battle等。
- 後半に `Mockup UI v3 — approved 2026-08-25 visual direction` を追記。
- 旧ruleを削除せず、同じselectorを後段で上書きする。
- 旧navは4列指定、後続で5tab化している。

**判定: REBUILD**

### `src/game/game.css`

- 初期game UI rule群。
- 後から `World progression redesign` を追記。
- さらに `Adventure map v2` を追記。
- 新旧screen conceptが同一file内で年代順に積層。

**判定: REBUILD**

### `src/game/runtime.css`

名前はruntimeだが、実際にはstage card、battle actions、generated monster、dex filter等のvisual overrideを多数含む。

**判定: REMOVE as visual patch layer / 必要ruleは画面所有先へ再配置**

### `src/premium-ui-v4.css`

良い意図:

- safe-area
- iPhone前提
- 世界mapの視覚化
- Monsterを画像主役にする
- 下部5tab

問題:

- 既存rule整理ではなく最終override layer。
- `!important` で過去layerを打ち消す。
- testもload orderをvisual authorityとして固定。

**判定: KEEP as visual reference / REMOVE as final override architecture / REBUILD into owned styles**

---

# 3. 画面別監査

## 3.1 ホーム

### 本来の目的

子どもが3秒以内に以下を理解すること。

1. いま一緒にいるモンスター
2. いま何をすれば遊びが進むか
3. 次に欲しいもの / 進化までの距離

### 原本

exact FINAL-CORRECTEDは未救出のためレイアウト断定不可。

baseline-adjacent evidenceでは、中心は「育てたい・進化させたいから学ぶ」であり、Home自体がゲーム説明書になる思想は確認できない。

また PR #31前のruntime Homeは、学習 / 現在地+進化 / 冒険 / 学習・モンスター程度に整理されていた。これは原本証拠ではないが、「追加改修によって情報量が増えた」ことを示す履歴証拠である。

### 後続の正当な改善

KEEP候補:

- 相棒を大きく見せる
- 現在地を見せる
- 次の進化までを見せる
- 学習完了状態に応じて主CTAを変える
- iPhoneで大きなtap target

### 現行実装

Global headerに所持品。
Home内にさらに、

1. brand + partner
2. 6-step flow
3. ticket / mana / current location / partner
4. study progress + 2CTA
5. game explanation + evolution goal
6. HowTo / Parent

### 問題

- headerとHomeでresource/statusが重複。
- 「6-step flow」と「ゲーム説明」と「HowTo」が役割重複。
- 主CTAが説明コンテンツに埋もれる。
- Heroが「冒険したい」よりbrand説明を優先。
- Homeの縦長化により、ゲームの状態より説明を読む画面になる。

### KEEP

- 相棒
- 今日の学習達成状態
- 現在地
- 次の進化目標
- 状態依存の主CTA

### REMOVE

- 常設6-step tutorial
- 常設ゲーム説明4行
- Home内のresource重複
- 初回以外も常に出る一般ルール

### REBUILD

**1 hero + 1 primary action + 1 next-goal** をfirst viewportに集約する。

Homeの主CTAは状態で1つを基本とする。

- 未学習: `まなぶ！`
- 学習済み+ticketあり: `ぼうけんへ！`
- battle直後/evolution ready: `シンカできる！`

Secondaryは1〜2個まで。

---

## 3.2 まなぶ

### 本来の目的

「今日の学習を迷わず開始し、終わったらゲームへ戻る」。学習品質はKids Questの完成度を活かす。

### 原本

exact UIは未確認。再建方針上、Kids Quest学習基盤を安易に簡略化しないことが重要。

### 後続の正当な改善

- Kids Questのadaptive / review / 「わからない」/ lesson等を維持。
- 学年/難易度を子どもが勝手に変更できない。
- core / free / review / trialを維持。

### 現行実装

`StudyHub` はManaEvo側で作られているが、task開始後は `kids-quest-study/screens/*` を直接表示する。

ActivityPlayerは独自 `Starfield`、`AppHeader`、Kids Quest paletteを持つ。

### 問題

- Hub → 問題画面で別アプリ風のshellへ切り替わる。
- `Kids Quest 学習エンジン` という開発者向け文言が子ども画面に出る。
- `src/study` と `src/kids-quest-study` のownershipが曖昧。
- 学習終了後の「ゲームへ戻る報酬感」がManaEvo shellとして統合されていない。

### KEEP

- Kids Quest学習ロジック
- core/free/review/trial/dictionary
- 「わからない」
- adaptive / mastery

### REMOVE

- 子ども向け画面の実装由来ラベル `Kids Quest 学習エンジン`
- 同じ機能の二重runtime ownership

### REBUILD

学習ロジックは変えず、**StudyFacade / ManaEvo Study Shell** を1層置く。

Kids Quest sourceを「engine + activity components」として使い、header/back/reward/finish flowはManaEvoが所有する。

---

## 3.3 ぼうけん

### 本来の目的

「地図を見て、行きたい場所と会いたいモンスターを選ぶ」。一覧検索ではなく冒険感が主。

### 原本

exact画面は未確認。

`design/20` で復活・維持された思想として、Area / zone Lv帯、前の地域へ戻った時の成長実感、boss→次area、進化による出会い解放が重要。

### 後続の正当な改善

- Area1〜4のworld route
- 入口 / 中盤 / 奥地
- 現在地
- zone Lv
- 日次最大5 encounter
- monster artを大きく
- 未GET / 育成向け / 初回 / おすすめ

### 現行実装

world routeの直下に、**同じArea1〜4を選ぶarea tabs** がもう一度ある。

その下に zone map、kind filter、search、daily summary、encounter listが続く。

### 問題

- Area選択が `world-area-route` と `world-area-tabs` で二重化。
- 世界を見る画面の直後にfilter/searchが出て、図鑑/管理画面化する。
- encounter cardにタグ、No、zone、kind、name、level、type、cost、reward、action等が同時表示。
- 「冒険先を選ぶ」より「データ一覧から行を選ぶ」に戻っている。

### KEEP

- world route
- zone route
- today encounters最大5
- 大型monster art
- unlock状態
- 推奨Lv/危険度

### REMOVE

- 重複area tabs
- default viewのkind filters/search
- 通常cardの過剰metadata

### REBUILD

`World → Zone → Encounter` の視覚階層を一本化する。

全件検索はsecondary actionから別sheet/secondary modeへ退避する。

---

## 3.4 バトル

### 本来の目的

「相手を見て、今の1手を選び、結果を気持ちよく理解する」。

### 原本

exact画面は未確認。

捕獲へつなぐHP条件、技、チーム、勝敗が主要な判断材料。

### 後続の正当な改善

- enemy/player art
- HP
- 4技
- type相性
- boss予兆
- まもる
- ギガ/バースト
- 捕獲可能時の明確な導線

### 現行実装

1画面に以下が縦積み。

- battle head
- challenge/special/boss banners
- arena
- 5行log
- 4 move cards（type/power/accuracy/effect/role）
- protect/giga/burst
- capture panel
- battle-point guide
- team switch

### 問題

- 1ターンで判断すべき要素以外の説明が多い。
- 「わをなげる」は見た目上の主CTAラベルだが、実操作は下の4ring button。
- 捕獲説明とbattle tipsが毎ターン常設。
- log 5行とarena結果表示が競合。
- primary action hierarchyが move / protect / special / capture で分散。

### KEEP

- arena
- enemy/player HP
- 4技
- type相性の短い表示
- boss予兆
- special発動条件
- team switch

### REMOVE

- 常設battle tips
- 毎ターン読む必要のない説明paragraph
- move roleの内部的説明をdefault表示
- 5行常設log（必要なら1〜2行/履歴sheet）

### REBUILD

arenaを上半分、action dockを下半分に固定。

通常時の主選択は4技。捕獲可能になった瞬間だけ `⭕ わをなげる` を強いalternate CTAとして出す。

---

## 3.5 捕獲

### 本来の目的

「今なら捕まえられる」という瞬間の緊張と、どの『わ』を使うかの選択。

### 原本 / 現存正本に近い要求

`design/03-screens-catch-and-raise.md` では投げる前に必須:

- 敵HP
- 4種類の「わ」
- 各所持数
- 実成功率
- 投数0/3〜3/3
- 捕獲可能条件

これはKEEPすべき機能情報である。

### 後続の正当な改善

- HP50%以下を視覚的に明確化
- 4段階演出
- ringごとの確率

### 現行実装

Battle内panel。説明見出し、文章、stars、4ring gridを常時同一縦面に配置。

### 問題

- BattleとCaptureで主操作領域が分離されていない。
- 捕獲不能時も大きなpanelを占有。
- 必須情報とチュートリアル文章が混ざる。

### KEEP

- 4ring
- 所持数
- 実成功率
- 残り投数
- HP条件
- 4段階演出

### REMOVE

- 毎回の長い説明文章
- 捕獲不能時の大面積panel

### REBUILD

Battle内のcompact CTA → 押したら capture sheet / mode を開く。

敵の姿とHPは背景に残し、ring選択時だけ必要情報を集中表示する。

---

## 3.6 モンスター

### 本来の目的

「誰を連れていくか」「誰を育てたいか」「次にどう進化するか」を決める。

### 原本

exact画面は未確認。

`design/03` では Lv/XP/type/stats/next evolution/必要itemが常時判断可能であることが主。

### 後続の正当な改善

- 3体teamを主役
- 大きな正式画像
- selected monsterのnext evolution
- team / box / dex区分

### 現行実装

Team/Box/Dex tabsの下で、selected detailに以下を全表示。

- 178px art
- No/family/name/Lv/stage/type
- description
- 4 stats
- 全技
- evolution progress
- 3進化方式の一般説明
- 進化思想4行
- Giga card
- Burst card

Boxでは全box listの後ろにdetailが来るため、個体数が増えるほどselected detailまで遠くなる。

### 問題

- 「次に育てる」が一般攻略説明に埋もれる。
- Monster detailが攻略本を兼ねている。
- Box listの長さとDetail位置が連動する。
- special form情報が対象外個体でも常時面積を取る。

### KEEP

- team showcase
- large official art
- Lv / XP / type
- next evolution
- required item / count
- team add/remove

### REMOVE

- 個体detail内の一般進化チュートリアル
- 毎回の全技詳細
- 常時Giga/Burst両カード（対象/必要時にprogressive disclosure）

### REBUILD

team/box listとselected detailを独立layoutにする。

selected monsterのfirst cardは **「次の成長目標」** を最優先する。

---

## 3.7 図鑑

### 本来の目的

「集めたくなる」「まだ知らない姿を見たくなる」。

### 原本

exact UIは未確認。

### 後続の正当な改善

- silhouette → seen → GET
- progress count
- area/type/search
- special form registration

### 現行実装

MonsterScreenの3番目tabとして `DexGrid`。

### 問題

機能自体は比較的整理されているが、Monster/Box/育成と同じ巨大componentに埋め込まれているため、図鑑という収集体験が独立しない。

### KEEP

- 3列grid
- silhouette
- GET/seen
- count
- filter

### REMOVE

- なし（優先度低）

### REBUILD

Monster section配下でもよいが、route/state上は `dex` を明示し、育成detailと責務を分ける。

---

## 3.8 進化

### 本来の目的

育成努力の最大報酬。「自分で育てたから進化した」を感じる。

### 原本

exact visualは未確認。

### 後続の正当な改善

現行のfull-screen `EvolutionCelebration` は方向性が良い。

- before → after
- stat gain
- self-grown message
- unlock note
- battle resultから直結

### 現行実装

Monster detailまたはBattle resultで進化実行 → overlay。

### 問題

進化そのものより、進化前のMonster detailに一般説明が多く、到達CTAが弱まる場合がある。

また Evolution がrouteではなくoverlay実装であること自体は問題ではないが、画面state契約が明文化されていない。

### KEEP

- full-screen celebration
- before/after art
- stat gain
- self-grown message
- world unlock feedback

### REMOVE

- 進化直前画面の一般ルール重複

### REBUILD

overlayは維持し、`evolution-ready` を明示的UI stateとして扱う。

---

## 3.9 あそびかた

### 本来の目的

困った時に必要なルールへすぐ届くこと。ゲームの開始前に全文読ませることではない。

### 原本

exact UIは未確認。

### 後続の正当な改善

`design/22` の「長文説明書ではなくゲーム内ガイド」「現在の仲間と次の進化目標」は正しい。

### 現行実装

現在も非常に長い。

- hero
- next evolution
- 7-step full loop
- 3種類の通常進化
- reward一覧
- Giga/Burst
- その他説明

### 問題

後続設計自身の「less document」に未到達。

### KEEP

- current partner / next evolution
- quick loop
- topic別の具体情報

### REMOVE

- defaultで全章展開
- Homeと重複する一般説明

### REBUILD

最初は `まずなにする？ / GET / シンカ / ごほうび / とくべつ` のtopic cards。

各topicを必要時に開く。

---

## 3.10 保護者

### 本来の目的

子どもの誤操作から隔離して、学年・先取り・難易度・音声・profile・backupを管理する。

### 原本

exact UIは未確認。

### 後続の正当な改善

- PIN gate
- adult check
- child UIから設定を外す
- Kids Questの詳細学習設定を維持

### 現行実装

`ParentGate` はManaEvo側だが、unlock後はKids Questの `ParentScreen` をそのまま表示。

ParentScreenは独自Starfield/AppHeader/card/button + 多数のinline styles。

### 問題

- UI shellが二段階で切り替わる。
- snapshot componentへの直接依存。
- Adult screenなので高情報量自体は許容されるが、child UIと同じCSS treeに混在する必要はない。

### KEEP

- gate
- settings内容
- profile / backup / voice / grade / difficulty

### REMOVE

- child game shellとのvisual cascade共有

### REBUILD

Parent areaを独立したadult shellとして隔離する。見た目をゲーム画面へ無理に寄せる必要はない。

---

# 4. 正式画像 / placeholder 解決経路

## 現行path

`runtime master CSV`
→ `scripts/generate-runtime-master.mjs`
→ `species.officialImageUrl = /monsters/{id}.webp`
→ `PlaceholderMonster.jsx`

ただし `PlaceholderMonster` 内で No.001〜020だけ先に `/monsters/{id}.svg` を候補に入れる。

順序:

1. `formalSvgUrl` (No.001〜020)
2. `officialImageUrl` WebP
3. image errorなら次候補
4. numbered speciesで画像が無ければ generated placeholder
5. legacy spriteは `!species.no` の特殊条件

## 問題

- `officialImageUrl` が常に第1候補ではない。
- 「formal」の意味が番号hard-codeに埋まる。
- component名が `PlaceholderMonster` のまま正式画像表示責務まで持つ。
- 238体の正式/仮statusをdata contractとして持たない。
- PWA cache-firstと組み合わせると差し替え確認が不安定。

## 推奨する将来契約

実装フェーズでは、`MonsterArt` の単一契約へ集約する。

- `art.status = official | provisional | placeholder`
- `art.src`
- `art.version`
- optional fallback

番号で分岐しない。

この監査では変更しない。

---

# 5. `kids-quest-study` と `study` の二重構造

## 事実

### `src/kids-quest-study`

README上は migration source snapshot。

しかし現在は実際に、

- state
- screen
- engine
- style
- sound
- TTS

の多くが直接runtimeから使用される。

### `src/study`

- `engine.js`: 「旧5問runtime互換」を残すコメントあり
- `srs.js`: kids-quest-studyのre-export
- local question/difficulty/mission系も残存

## 判定

**Legacy bridgeとして必要なものと、現在の正本学習engineを明確に分離する必要がある。**

最も危険なのは機能重複そのものより、開発者が「どちらを直せば現行画面が変わるか」を毎回追跡しなければならないこと。

UI再建では学習ロジックを再実装せず、adapter/facadeを唯一のManaEvo入口にする。

---

# 6. 遷移二重化一覧

| 箇所 | 二重化/曖昧さ | 影響 |
|---|---|---|
| Home | bottom nav + Home内 direct CTA | 同じ目的地に複数の意味付け |
| Study | bottom nav + `← ホーム` | global/local navigationの役割重複 |
| Adventure | bottom nav + `← ホーム` | 同上 |
| Adventure Area | world route + area tabs | 同じstateを2 UIで操作 |
| HowTo | bottom nav + Study/Adventure/Monster direct actions | guideがnavigation hub化 |
| Battle | `view=adventure` + `activeBattle` | route名と実画面が一致しない |
| Capture | Battle内panel | 捕獲modeの境界が無い |
| Monster | tab=team/box/dex + app view | URL/route/back stackで状態表現不可 |
| Evolution | local overlay state | 重要体験だが画面state契約なし |
| Parent | App focus view + Kids Quest internal AppHeader | shellが入れ子 |

---

# 7. UI関連test監査

## KEEP

- domain/game logic test
- unlock/progression test
- PWA icon dimension test
- capture WebKit E2E
- accessibility nameを守る意図

## REMOVE / REWRITE対象

### Source-string UI tests

`mockup-ui-v3.test.js` / `premium-ui-v4.test.js` / `navigation.test.js` の多くは、DOM behaviorではなくsource文字列を固定している。

特に以下は再建を妨げる可能性がある。

- 「6-step explanationがHomeに必ず存在」
- 「premium CSSがruntime CSSより後に存在」
- 特定class名
- `setView(...)` 実装詳細

### 欠けているcontract

最低限、将来は iPhone WebKit で次をE2E化する。

1. Fresh start → Home primary CTA
2. Home → Study → core completion → ticket reward
3. Study complete → Adventure
4. Adventure → Battle
5. Battle → HP条件達成 → Capture
6. Capture success → Monster/Box
7. Battle XP → Evolution ready → Evolution
8. Dex registration
9. reload during battle → resume
10. installed/offline PWA → core screen load
11. official art smoke test

Visual screenshotは全pixel固定ではなく、主要screenの構造regression用途で使う。

---

# 8. PWA監査

## KEEP

- `viewport-fit=cover`
- standalone
- portrait-primary
- apple touch icon
- 192/512 icon
- canonical GitHub Pages path
- network-first navigation + offline shell fallback
- old cache deletion mechanism

## 問題

### 8.1 `/monsters/` cache-first

正式画像を同名上書きした場合のversioning契約がない。

### 8.2 testはinstallabilityの十分条件ではない

静的file存在確認はあるが、実機相当で

- install後launch
- update後新asset取得
- offline reopen
- stale SWからのmigration

を確認していない。

### 8.3 previewとcanonical productionが強く結びつく

manifest `id/start_url/scope` はGitHub Pages本番URL固定。最終配布方針としては有効だが、preview環境でPWA behaviorを検証する時はproductionとの差を意識する必要がある。

---

# 9. KEEP / REMOVE / REBUILD 総括

## KEEP

- Kids Questの学習ロジックと教材資産
- game engine / save / progressionの既存動作を監査なしで捨てない
- world route / zone concept
- daily encounter最大5
- battle arena / HP / 4 moves
- 4種の「わ」
- team 3体
- evolution celebration
- dex silhouette / collection progress
- PIN parent gate
- PWA safe-area / install assets
- 20/21/22で追加された「画像を主役にする」「現在地」「次の進化」思想

## REMOVE（再建時）

- CSSを年代順に上から重ねる方式
- `premium-ui-v4.css` を「最後に勝つCSS」とする契約
- Homeの常設フルチュートリアル
- Adventureの重複Area selector
- Battleの常設rule guide
- Monster detailの常設攻略本
- HowToの全章常時展開
- UI source-string testによるclass/実装詳細固定
- formal artの番号hard-code優先順位

## REBUILD

- App shell / route contract
- screenごとのprimary CTA contract
- CSS ownership
- Study integration boundary
- MonsterArt contract
- PWA asset version contract
- UI E2E contract

---

# 10. 最短で子どもが遊べる完成版にするUI再建順序

重要: governance上、exact baseline救出とcanonical決定を飛ばしてUI実装へ進まない。以下は**実装開始後の優先順位**である。

## P0 — まず「1本のゲーム」を完成させる

### P0-0. Canonical screen contract確定

W-001/W-002/W-006の成果を使い、各screenについて1ページで確定する。

- screen purpose
- primary CTA 1つ
- secondary CTA最大2つ
- must-show info
- progressive disclosure info
- entry/exit

この時点でCSSを書かない。

### P0-1. App Shell / Navigationを先に一本化

画面を直す前に、

- Home
- Study
- Adventure
- Battle
- Monsters
- Dex
- HowTo
- Parent

のroute/state ownershipを定義する。

Capture / Evolutionはmodal/sheet/overlayでもよいが、明示的modeとして扱う。

bottom nav / back / cross-linkの役割を決める。

### P0-2. CSSのvisual authorityを1つにする

新CSSをさらに足さない。

実装時はscreen単位で旧ruleを削除しながら置換する。

完成条件:

- `!important` で過去layerを倒す必要がない
- load orderがdesign contractではない
- 1selectorの所有先が明確

### P0-3. `MonsterArt` 契約を先に固定

「本物のゲーム」に見えるかは正式画像の安定表示が大きい。

Home/Adventure/Battle/Monster/Evolutionの全てが同じresolverを使う。

- official/provisional/placeholder status
- src
- version/cache key

を一本化する。

### P0-4. 1本のvertical sliceを完成させる

**Home → Study → Adventure → Battle → Capture → Result → Monster → Evolution**

を、Area1の最小データで最初から最後まで完成品質にする。

239/238全体を先に全画面へ流し込むより、1ループを「子どもが説明なしで遊べる」状態にする。

行動経済学的にも、選択肢を一度に増やすより、次の1手を明確にし、即時フィードバックと進捗報酬をつなぐ方が継続行動を作りやすい。

### P0-5. iPhone WebKitのchild-flow E2E

上記vertical sliceを実ブラウザ操作で固定する。

source文字列testではなく、visible / clickable / transition / reward / reloadを検証する。

---

## P1 — 収集・説明・保護者・PWAを完成させる

1. Dexを独立責務化
2. HowToをtopic-based contextual guide化
3. Parentをadult shellへ隔離
4. Study shell統合をFree/Review/Trial/Dictionaryまで完了
5. PWA install / offline / update E2E
6. monster asset更新時のcache invalidation
7. full monster art status audit

---

## P2 — 完成度を上げるが、遊べることを遅らせない

- Giga / Burst専用演出
- Area別背景の追加作り込み
- transition animation
- haptics/audio polish
- advanced search/filter
- Dex special-form presentation
- boss-specific battle presentation
- accessibility fine tuning
- performance tuning

---

# 11. 最終提案 — 再建の判断基準

今後のUIレビューでは「モックに似たか」ではなく、各画面で次の5問だけを合否基準にする。

1. **この画面の目的を1文で言えるか。**
2. **子どもが最初に押すべきボタンが1つに見えるか。**
3. **その行動に不要な説明を隠せているか。**
4. **正式モンスター画像が画面の主役になっているか。**
5. **次の画面へ進んだ結果、学習→冒険→育成の報酬ループが強くなるか。**

5つのどれかがNOなら、CSS装飾を追加する前に情報構造を直す。

---

# 12. 監査成果のブロッカー / 他Workerへの引継ぎ

## BLOCKED

- exact FINAL-CORRECTED screen layoutの確定: W-001 PR #35がarchive待ち。
- BASELINE / CURRENT正式差分: W-002未完了。
- UI canonical最終決定: WORK-QUEUE上のW-006成果が必要。

## Worker 1へ

FINAL-CORRECTED救出時、UI関連file / screenshot / mock / screen transition / CSS / asset namingをmanifest上で明示してほしい。

## Worker 2へ

Study UI再建で学習仕様を誤って簡略化しないため、Kids Quest移植でKEEPすべきinteraction contractを明示してほしい。

## Worker 3へ

Battle/Capture/Evolutionで「must-show」と「攻略説明」を分離するため、行動時に必要な情報項目をcanonical化してほしい。

## Worker 4へ

AdventureのArea/zone/unlock情報のうち、子どもが選択時に必ず理解すべきものだけをcanonical化してほしい。

---

# 13. 監査した主な証拠

## Governance

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md`
- `design/rebuild/WORK-QUEUE.md`
- `design/rebuild/HANDOFF-TEMPLATE.md`
- PR #35 W-001 baseline rescue status

## Design

- `design/00-README.md`
- `design/01-catch-and-evolution-design.md`
- `design/03-screens-catch-and-raise.md`
- `design/20-world-map-evolution-progression.md`
- `design/21-mockup-ui-visual-system.md`
- `design/22-premium-ui-v4.md`

## Runtime / UI

- `src/App.jsx`
- `src/game/GameScreens.jsx`
- `src/styles.css`
- `src/game/game.css`
- `src/game/runtime.css`
- `src/premium-ui-v4.css`
- `src/HowToPlay.jsx`
- `src/parent/ParentGate.jsx`
- `src/kids-quest-study/screens/ParentScreen.jsx`
- `src/kids-quest-study/screens/ActivityPlayer.jsx`
- `src/kids-quest-study/styles/learning.css`

## Images

- `src/game/PlaceholderMonster.jsx`
- `scripts/generate-runtime-master.mjs`
- `public/monsters/*`
- `public/monsters/.formal-v1-marker.txt`

## PWA

- `index.html`
- `src/main.jsx`
- `public/manifest.webmanifest`
- `public/sw.js`

## Tests

- `tests/mockup-ui-v3.test.js`
- `tests/premium-ui-v4.test.js`
- `tests/navigation.test.js`
- `tests/adventure-map-v2.test.js`
- `tests/pwa-assets.test.js`
- `e2e/capture-ring.webkit.spec.js`

## History

- `687151e00ac6c5f88d5690e04c6e94679fc2393a` — mockup UI v3 / PR #31
- `b4349e1e24b47f3d610054d8ef7cb100111001a2` — premium UI v4 / PR #32
- `1594a8c6f4aca510957c3057bcc07f9cb7a4ec52` — formal art priority change

---

## 監査最終判定

**「本物のゲーム画面にならない」主因は、見た目の不足ではない。**

1. 正本未確定のまま現行DOMを温存し、
2. 説明要素を追加し、
3. CSS overrideを追加し、
4. source-string testでその追加を固定し、
5. Kids Quest UIとManaEvo UIを同じshell/cascadeに混在させ、
6. 画像resolverとPWA cacheも複線化したこと

による**UIアーキテクチャの累積負債**である。

したがって次回UI作業は「premium-ui-v5を追加」してはいけない。

**画面目的 → 主CTA → 情報削減 → route ownership → CSS ownership → art contract → E2E** の順で再建するのが最短である。
