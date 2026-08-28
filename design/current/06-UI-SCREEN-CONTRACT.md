# ManaEvo CURRENT Canonical — UI / Screen Contract

- Work Item: **W-106**
- Phase: Rebuild Phase 2 / CURRENT canonicalization
- Status: **CURRENT CANONICAL OUTPUT — commander review pending**
- Date: 2026-08-28
- Scope: Home / Study / Adventure / Battle / Capture / Monster / Dex / Evolution / HowTo / Parent のUI目的、主判断、表示契約、画面遷移、focused state / overlay ownership。
- Out of scope: `src/**`, CSS, tests, game-engine implementation, balance tuning, data master changes。

## 0. Authority and evidence

この文書は次の優先順位で正本化する。

1. ユーザー明示決定
2. exact baseline `design/baseline/FINAL-CORRECTED/source/`
3. 承認根拠が確認できる後続仕様
4. `design/current/`
5. data master
6. runtime
7. 過去レビュー・完了報告

W-106では以下を直接根拠として確認した。

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md` — 特に D-003 / D-004 / D-005 / D-007 / D-013 / D-014 / **D-017**
- `design/rebuild/PHASE-2-COMMANDER-REVIEW.md`
- `design/rebuild/PHASE-2-WORK-ITEMS.md`
- exact baseline `00-START-HERE.md`
- exact baseline `03-screens-catch-and-raise.md`
- exact baseline `08-gameplay-state-spec.md`
- exact baseline `09-implementation-traceability.md`
- exact baseline `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`
- exact baseline `13-EXECUTION-FLOW.md`
- Phase 1.5 `design/rebuild/audit/ui-architecture-audit.md`
- Phase 1.5 `design/rebuild/canonical-draft/UI-SCREEN-CONTRACT.md`

### Exact-baseline facts carried into CURRENT

- 子ども向け画面のbaseline正本は `03-screens-catch-and-raise.md`、横断ゲーム状態は `08-gameplay-state-spec.md`。
- baselineの捕獲は勝利後CAPTUREだったが、D-004で **敵HP50%以下から戦闘中捕獲**へ明示的に置換されている。
- 捕獲の子ども向け主表示は **★＋日本語ラベル＋おすすめ**。正確な%は詳細/保護者向けの補助値であり、主ボタン・主情報にしない。
- D-017によりchild-facing capture itemは **ほしボール / ぎんボール / きんボール / にじボール**。stable domain key・倍率・cap・最大3投は変更しない。
- 捕獲演出は **1個を投げる → 命中/包み込み → 4つの星が順に点灯 → 成功/失敗** の時間的演出。UIは結果を再抽選しない。
- 育成詳細では、行動可能な次の通常進化と残りLv/必要アイテムを理解できるようにする。
- 画像は5〜8歳を主対象とし、小表示でも識別できる正式/placeholderの一貫した解決契約へ寄せる。
- 主要導線はiPhone縦の375〜390px級viewportで成立させる。D-017の実機playtest補正により430px級まで同じmobile contractで検証する。

### Phase 1.5 draftからの必須補正

PR #39 draftはそのまま昇格しない。D-013/D-017に従い、最低限次を補正する。

1. **Home**: 学習未完了なら Study、学習完了なら Adventure をprimaryとする。EvolutionはHome primaryを奪わず、獲得したflow内のfocused rewardとして扱う。
2. **Capture**: ★/日本語ラベル/おすすめをprimary representationとする。正確な成功率%はsecondary/detailに限定する。child-facing物体は「わ」ではなくManaEvo独自のボールとする。
3. **Battle ticket wording**: D-007に従い、開始時は1枚をreserveし、UI文書から「開始時に消費確定」という誤読を除く。詳細lifecycleはBattle canonical側の責務。
4. **iPhone interaction**: safe-area、top-level destinationごとのscroll ownership、focused flow開始位置、問題visualの主役サイズをUI contractとして扱う。
5. exact baselineは現在GitHubにimmutable保存済みなので、PR #39時点の「payload未着地」制約はCURRENTへ持ち込まない。

この文書は新しいゲームルールを作らない。ゲームルールの詳細は各domain canonicalへ委譲し、UIは「その時点で子どもが何を判断できる必要があるか」を固定する。

---

# 1. Cross-screen contract

## 1.1 One dominant child decision

通常の子ども向け状態では、**第一判断を1つ**に絞る。データや機能が存在するという理由だけで、全機能を同時表示しない。

- primary CTA / primary action surface は1つの判断を主役にする。
- secondary actionsはprogressive disclosureで開く。
- focused flow中は、通常navigationや別機能を同時にactiveにしない。

## 1.2 Top-level child navigation ownership

常設の子ども向けtop-level destinationは次の5つ。

- Home
- Study
- Adventure
- Monster
- HowTo

次は常設child tabにしない。

- Battle
- Capture
- Dex
- Evolution
- Parent

Parentはprotected adult flow。DexはMonster配下のlocal route/state。Battle / Capture / Evolutionはcontextual/focused flow。

### Scroll ownership

D-017により、5つのtop-level destinationは**独立したscroll位置**を持つ。

- Homeを下まで読んでStudyへ移っても、StudyにHomeの`scrollY`を持ち込まない。初回entryは上端から始める。
- 各top-level destinationへ戻った場合は、そのdestination自身の前回scroll位置を復元してよい。
- Battle / focused Study activity / Parent等のfocused flowへ入るときは上端から開始する。
- Battle等のfocused flowを終了して元top-levelへ戻るときは、元destination自身のscroll位置を復元する。
- browser全体の1つのscroll位置を全tabで共有してはいけない。

## 1.3 Progressive disclosure

通常状態で必要なのは「次の判断に必要な情報」。以下は必要時に展開する。

- search / filter
- 詳細ルール
- 全技一覧
- 特殊形態の長い説明
- 報酬経済の詳細
- 正確な捕獲%などの補助数値
- 長文tutorial

## 1.4 Focused state ownership

focused stateはownerを1つにする。

- Study activity → Study owner
- Battle → Adventure/Battle owner
- Capture → Battle substate owner
- Dex → Monster/Dex owner
- Evolution → full-screen reward owner
- Parent → protected adult owner

背景画面を残す場合も、focused state中は背景の競合操作を無効化する。

## 1.5 iPhone portrait / first viewport / safe area

主ターゲットはiPhone縦。Acceptanceの基準viewportは **390px幅** とし、baselineの375px級を崩さず、430px級まで同じmobile quality gateで扱う。

interactive screenは `safe-area-inset-top` / `safe-area-inset-bottom` をowner自身が処理する。

- iPhoneの時刻・Dynamic Island・status icon領域へBack/Home/回答/primary CTA等を重ねない。
- focused Studyはglobal game headerがないことを理由にstatus bar領域へ詰めない。
- bottom navigation / bottom CTAはhome indicator領域を侵食しない。

390px first viewportで最低限、以下がスクロール前に理解できること。

- 画面の目的
- 主役となるmonster/学習/場所
- 現在状態
- 次のprimary action

長文説明、巨大一覧、常設search/filterでprimary actionをfirst viewport外へ押し出さない。

### Japanese line breaking

狭いカードやstatus欄で、日本語label/地名/CTAが1〜2文字ずつ縦に崩れる表示を許容しない。

- 意味単位でwrapできるmarkupを使う。
- compact labelは必要に応じてnowrap/ellipsis/2行上限を選ぶ。
- 単純にfont-sizeを極小化して解決しない。
- 長文本文は通常wrapさせ、ボタン/地名/statusの短い意味単位だけを保護する。

## 1.6 Visual / CSS authority

画面契約がvisual hierarchyの権威を持つ。

禁止:

- 旧UIを残したまま新UIを積み増して解決する
- CSS load orderを仕様の権威にする
- stronger selector / `!important`で画面所有権を奪う
- `premium-ui-v5.css`のような新しいglobal override layerを設計解決策として追加する

将来実装ではscreen/component ownershipへ収束し、不要なlegacy layerを減らす。

## 1.7 Monster art presentation

画面側はformal / candidate / placeholderを個別ロジックで選び分けない。単一 `MonsterArt` contractに従い、その時点でruntime eligibilityを満たさない場合は明示的placeholderを使う。D-016のproduction-visible CANDIDATEはart resolver側のexplicit allowlistに従い、screen側で推測しない。

---

# 2. Home

## PURPOSE

子どもが一目で **「きょう、つぎに何をするか」** を理解し、partner・現在地・次の進化への意欲を保てる画面。

## PRIMARY CTA

primary CTAは状態から一意に決める。

- daily learning incomplete → `まなぶ！`
- daily learning complete → `ぼうけんへ！`

**Evolution readyはHome primaryを上書きしない。** 進化は獲得したflow内のfocused reward、またはMonster内の明示アクションとして扱う。Homeに進化可能表示を出す場合もsecondary motivationに留める。

## MUST SHOW

- current partner art / name / Lv
- 今日の学習進捗をcompactに
- usable ticket count
- 実際のcurrent adventure location（area/zone）。mobile幅でも地名が1〜2文字単位へ崩れない
- 次の通常進化target/progressが存在する場合はcompactに
- 状態に対応したprimary CTAを1つ

## MUST NOT SHOW

通常Homeに以下を常設しない。

- 6-step game loopの常設strip
- multi-line game manual
- full capture rules / capture item economy
- full evolution-method tutorial
- full Giga/Burst tutorial
- 同じvisual weightの複数primary CTA
- Parent settings detail
- 次の行動を変えない巨大status dashboard
- Evolutionを学習/冒険より上位のHome primaryとして自動昇格

## CHILD DECISION

UIが状態から問いを1つに絞る。

- 学習未完了: `いまは まなぶ！`
- 学習完了: `つぎは ぼうけん！`

## ENTRY / EXIT

ENTRY:
- app launch/resumeでactive focused flowがない
- top-level Home navigation
- flow完了後にHomeへ明示的に戻る

EXIT:
- primary CTA → Study または Adventure
- top-level navigation
- secondary protected entry → Parent
- secondary monster/evolution motivation → Monster（必要時）

## FOCUSED STATE / OVERLAY OWNERSHIP

- 小さな一回性reward/unlock toastは可
- 毎回tutorial modalを出さない
- Home上に別navigation modalを重ねない
- Evolution revealはHome overlayとして常設せず、Evolution ownerへ移す

## KEEP

- partner prominence
- current location
- next evolution motivation
- compact learning/ticket state
- clear Study/Adventure route

## REMOVE

- permanent six-step explanation
- permanent game explanation panel
- headerと重複するstatus
- Home上のverbose Parent/HowTo説明
- Home primaryとしての`シンカする！`自動優先

## REBUILD

「全部入りdashboard」から **today's next action + partner motivation** へ再構成する。

---

# 3. Study

## PURPOSE

Kids Quest由来の学習ロジックを壊さず、今日必要な学習を迷わず進める。

## PRIMARY CTA

`つづきの まなび` / 次のrequired task。

複数required taskを選択する仕様の場合も、optional modeより先にrequired taskを判断面へ出す。

## MUST SHOW

- profile/grade contextを子ども向けに
- 今日のrequired progress
- 残りrequired subject/task
- 問題数または必要量の目安（既存学習仕様で意味がある場合）
- required完了時のresult/reward handoff
- 学習engineが定義する `わからない`
- question activityでは**問題visual / 図形 / 時計 / 文字 / 絵を問題文と同等以上の主役サイズ**で表示する。375〜430pxで「何を見て答えるか」が一目で分からない小ささにしない

## MUST NOT SHOW

- `Kids Quest learning engine`等の実装用語
- optional modeをrequiredと同じvisual weightで最初から並べる
- game-wide capture/evolution manual
- Parent-only grade/ahead/difficulty control
- `src/kids-quest-study`と`src/study`の二重progress表現
- status bar領域へ戻る/進捗/問題visualを侵入させる
- 問題visualを大きな空白の中の小さな記号として扱う

## CHILD DECISION

Study hub: `つぎに どの ひつような まなびを やる？`  
Question activity: `この問題で、何を見てどれを答える？`

## ENTRY / EXIT

ENTRY:
- Home primary（学習未完了）
- top-level Study
- activity/review/trial終了後のStudy hub帰還

EXIT:
- daily required complete → reward confirmation → Homeまたは次の許可されたflow
- focused question activity外ならtop-level navigation

## FOCUSED STATE / OVERLAY OWNERSHIP

- question feedback / hint / audioはStudy-local overlay
- completion rewardは短いfocused celebration可
- Parent configurationをchild Study overlayにしない
- activity focus中は不要なglobal navigationを抑止可
- focused question activityはsafe-areaを自分で所有し、上端から開始する

## KEEP

- Kids Quest learning source-of-truth behavior
- required-task progression
- free study / review / trial / dictionaryのsecondary mode
- game reward handoff

## REMOVE

- child-facing engine/migration terminology
- required開始前のequal-weight optional menu
- Studyだけ別アプリに見えるvisual shell
- tiny question visual / excessive blank area

## REBUILD

学習ロジックは再実装せず、ManaEvo shellへ統合する。**Required learning first / question visual first**。

---

# 4. Adventure

## PURPOSE

子どもが **「どこへ行くか」「どの遭遇に1枚を使うか」** を理解し、world progressionと危険度を感じられる画面。

## PRIMARY CTA

encounter選択後の `バトルへ` / `ちょうせんする`。

## MUST SHOW

- area/world navigation representationを1つ
- current area / current zone
- zone recommended Lv / danger cue
- lock/unlock stateと必要なら短い理由
- normal stateの「今日の候補」は **最大5件**
- battleに必要なticket 1枚を開始前に明示（reserve/commitの詳細はD-007 / Battle canonical）
- candidate monster/encounter artを視覚主役に
- `ほかも さがす` でbrowse modeへ明示遷移

## MUST NOT SHOW

通常Adventureで以下を同時常設しない。

- **world route + duplicate Area tabs**
- permanent search box
- permanent kind/type filters
- huge all-stage list
- all zones / all stages / all rules / all unlock conditionsの同時展開
- global navと競合する重複`ホームへ` navigation
- encounter card内のfull Dex metadata

## CHILD DECISION

1. `どこへ いく？`
2. 選んだ場所で `きょう どれに 1まい つかう？`

一度に両方を大量情報で問わない。

## ENTRY / EXIT

ENTRY:
- Home primary（学習完了）
- top-level Adventure
- Battle resultからsaved area/zoneへ戻る

EXIT:
- encounter confirmation → Battle
- battle非active時はtop-level navigation

Battleへ入る直前のAdventure scroll位置はAdventure ownerが保存し、Battle終了後に戻せること。

## FOCUSED STATE / OVERLAY OWNERSHIP

- encounter detail sheetは必要な追加情報/確認に限定
- full browse/searchは独立した `BROWSE_ALL` state
- browse controlsをnormal stateへ常設しない

## KEEP

- world-first sense of place
- entrance / mid / deep progression direction
- recommended Lv / danger cue
- normal encounter candidates max5
- saved `adventureLocation`
- `ほかも さがす` secondary mode

## REMOVE

- simultaneous world route + Area tabs
- always-visible stage filters
- always-visible monster search
- normal stateのfull master-stage list

## REBUILD

**world/area → zone → max5 encounters → battle** のprogressive pathへ一本化する。

---

# 5. Battle

## PURPOSE

2体のmonsterを主役にし、**このターンの判断を1つずつ行う**。Battleは情報カードを縦積みする画面ではなく、arenaとcommandを視覚的に分けたfocused game surfaceとする。

## PRIMARY CTA

state-dependent action surface。

- normal turn → available move/action
- forced switch → next teammate selection
- capture eligibleかつchildが選ぶ → Capture focused state
- result → ownerが定義するcontinue / Adventure / Evolution reward

## MUST SHOW

- enemy / active ally artをarenaの視覚主役として十分大きく
- decisionに必要なname / Lv / type
- HPと明確なHP bar
- current turnで使えるmove/action
- moveの属性/威力/命中と、判断に意味がある場合の相性cue
- boss telegraph / special active stateが判断を変える場合、その状態
- capture eligible時のcompact `ボールを なげる`
- battle logは直近判断に必要な少量のみをcompactに。commandより大きくしない
- arena / current state-log / command deckの視覚階層を分離
- battle終了後のconcise result/reward

## MUST NOT SHOW

通常turnで以下を積み上げない。

- childがCaptureを選ぶ前のexpanded capture item grid
- permanent capture tutorial
- permanent battle tips panel
- switch不要時のpermanent full team list
- 全special-form rule説明
- current actionと競合するlong scrolling log
- battle終了前のresult controls
- stage名/地名を1〜2文字ずつ崩すheader

## CHILD DECISION

`このターン、なにをする？`

技名・相性・GET可能状態を、長文を読まなくても視覚的に比較できること。

## ENTRY / EXIT

ENTRY:
- Adventure encounter confirmation → active battle作成
- ticketはD-007に従い **開始時reserve**。UI文書では最終消費確定と扱わない
- focused Battleは上端から開始し、Adventureのscroll位置を引き継いでBattle途中から表示しない

EXIT:
- win/catch/loss/abandonの結果はBattle/Ticket canonicalに従う
- flow完了後はsaved Adventure location等のowner destinationへ
- evolution rewardが発生/実行される場合はEvolution focused stateへ

## FOCUSED STATE / OVERLAY OWNERSHIP

- Capture → Battle-owned focused substate
- forced switch → normal action areaを置換
- Evolution → full-screen reward owner
- abandon confirmation → modal可
- focused substate中、背面battle commandを同時activeにしない

## KEEP

- battle arena / monster prominence
- game ruleで定義済みのmove/action
- actionable protect / special action
- D-004のHP<=50% capture eligibility
- resultからearned Evolutionへ繋ぐ導線

## REMOVE

- permanent expanded capture panel
- permanent battle tips
- permanent team switch list
- ordinary turnのverbose special-form descriptions
- oversized dead arena space that pushes the current decision far below the monster state

## REBUILD

Subsystemを縦積みせず、**cinematic arena → concise state → command deck** とし、battle stateに応じてcommand area自体を入れ替える。

---

# 6. Capture

## PURPOSE

子どもが **「どのボールを使うか」** を色・星・言葉・在庫・おすすめから判断し、1投から結果までの時間的捕獲演出を集中して体験する。

## PRIMARY CTA

ボールを選ぶ → `○○ボールを なげる！`。

## MUST SHOW

throw前のprimary representation:

- enemy HP / capture eligibility
- **ほしボール / ぎんボール / きんボール / にじボール** の4択
- 各ボール自体の識別できる色/意匠
- 各ボールのowned count
- **★評価＋子ども向け日本語ラベル**
- **おすすめボールの明確な強調**
- current throw count / remaining attempts（最大3投）
- selected ballの明確な状態

throw中:

- **1試行につき1個のボールを1回投げる**投球motion
- enemyへ命中し、光で包み込む/収めるtransition
- その後に4つの星が順に点灯するtemporal presentation
- 成功時は4つ点灯→ボールが閉じて光る→GET
- 失敗時は4つ揃う前で止まり、光がほどけてenemyが戻る/飛び出す結果motion

補助情報:

- 正確なsuccess chance `%` は **secondary/detail** で確認可能にしてよい
- `%`をprimary button、primary label、first decisionの主情報にしない

## MUST NOT SHOW

- exact `%` を★/日本語ラベルより強いprimary representationにする
- 4星を4〜5個の追加投球のように見せる
- UIでcapture resultを再抽選する
- 既存作品の固有capture device、配色分割、logo、固有animation timingを複製する
- normal move gridをCapture decision背面で同時active
- full battle tips
- full team management
- world navigation
- unrelated evolution/special-form explanation
- animation開始前から4つの星を結果済み状態で表示

## CHILD DECISION

`どのボールを つかう？`

読みが十分でない子でも、**球の色/形・星・おすすめ強調**で選べること。

## ENTRY / EXIT

ENTRY:
- BattleでD-004のcapture eligibilityを満たし、attemptが残り、childが`ボールを なげる`を選ぶ

EXIT:
- success → capture/result ownerへ
- failure → Capture/Battle canonicalが定義するbattle flowへ戻る
- throw前cancel → Battle turn
- attempts exhausted → Battle側でcapture actionを無効化

失敗後のenemy responseやturn消費などのゲームルールをW-106で新規定義しない。

## FOCUSED STATE / OVERLAY OWNERSHIP

CaptureはBattle-ownedのfocused sheet/full-screen substate。

- 背景Battleはcontextとして見えてよい
- 背景commandはnoninteractive
- ball selection → throwing → outcomeの間に他画面navigationを競合させない

## KEEP

- stable 4 capture item keys / D-004の倍率・cap
- ★＋日本語ラベル
- recommendation emphasis
- owned quantity
- max3 throws
- D-004 HP ruleへの準拠
- exact chanceをsecondary detailとして確認できる余地
- 4-stage sequential star completion

## REMOVE

- child-facing「○○のわ」物体表現
- ordinary Battleでpermanent expanded capture controls
- capture explanation repeated every turn
- exact chanceを子どもの主判断にする表現
- star countだけ切り替わり、投球/命中/結果が存在しないpresentation

## REBUILD

Captureを **one-ball throw → containment → four-star suspense → outcome** の短いfocused decision-and-reward sequenceとして独立させる。

---

# 7. Monster

## PURPOSE

現在のチームと選んだmonsterを主役にし、**だれを育てる/チームにするか**を判断できる画面。

## PRIMARY CTA

selected monsterの状態に応じたcontextual action。

- evolution ready → `いま シンカする！`（進化canonical上、実行可能な場合）
- それ以外 → team change / 必要item操作など、現在の個体に必要な管理action

一覧の閲覧自体より、選択した1体の次の行動を強くする。

## MUST SHOW

- current team（最大3）をfirst
- selected monster art / name / Lv / type
- concise core stats
- next normal evolution / progress / required item
- team membership controls when relevant
- Box / Dexへ明示的に入れるlocal mode/link

## MUST NOT SHOW

通常team/detailで以下を全部同時表示しない。

- Team + entire Box + entire Dex
- permanent full move encyclopedia
- permanent evolution-method tutorial
- permanent `なぜ進化するか` tutorial
- 全monsterへのGiga/Burst eligibility/rule説明
- current management decisionを変えない長文説明

## CHILD DECISION

`だれを そだてる／チームにする？`

## ENTRY / EXIT

ENTRY:
- top-level Monster
- capture result shortcut（owner flowが提供する場合）
- Home partner/evolution secondary shortcut

EXIT:
- top-level navigation
- valid evolution action → Evolution
- Box / Dex local route

## FOCUSED STATE / OVERLAY OWNERSHIP

- Evolution → full-screen owner
- move detail / item equip / special detail → local sheet可
- Box / Dexを同一画面の常時展開領域にしない

## KEEP

- team-first presentation
- large monster art
- name/Lv/type/core stats
- next normal evolution as primary raising motivation
- Box / Dex access

## REMOVE

- permanently expanded evolution method guide
- permanently expanded evolution explanation card
- permanently expanded Giga/Burst cards
- list modeごとのduplicated detail pile

## REBUILD

**Team first → one selected monster detail → secondary detail on demand**。

---

# 8. Dex

## PURPOSE

collection/discovery progressを見てspeciesを調べる。Monster managementをdatabase画面へ変えない。

## PRIMARY CTA

species tileを選んでdetailを見る。

## MUST SHOW

- `GET x/238`
- `はっけん x/238`
- grid-first species overview
- unknown / seen / caughtの区別
- active scope **No.001〜238のみ**
- discovery ruleで許可されたart / name / No.

## MUST NOT SHOW

- No.239をactive denominator/listへ含める
- search + all filtersをfirst-view permanent chromeにする
- team management controls
- full raising/evolution tutorial
- grid内に全speciesのfull stats/movesをinline表示

## CHILD DECISION

`どのモンスターを みる？`

## ENTRY / EXIT

ENTRY:
- Monster → Dex
- Capture/Evolutionのregistration shortcutからspecies detailへ入る場合はlocal ownerとして扱う

EXIT:
- Monsterへ戻る
- species detail → Dex grid

## FOCUSED STATE / OVERLAY OWNERSHIP

- species detail sheet/page
- search/filterは要求時に展開
- grid first-viewをdatabase controlで埋めない

## KEEP

- device幅が許すcompact grid direction
- unknown/seen/caught visual distinction
- collection counts
- formal art when available

## REMOVE

- active No.239
- always-expanded database controls

## REBUILD

**Grid first; search/filter/detail on demand**。

---

# 9. Evolution

## PURPOSE

**「自分で育てたmonsterが新しい姿になった」** という感情的報酬をfocusedに届け、強化/解放を理解させる。

## PRIMARY CTA

`つづける！`

reveal中に複数の戦略的選択を競合させない。

## MUST SHOW

- before → after identity/art
- new species name
- clear evolution celebration
- meaningful stat gains
- evolution canonical/world canonical上、今回の進化で新規解放される情報がある場合はconciseに
- self-raised evolutionを強める言葉

## MUST NOT SHOW

- reveal中のbottom/top-level navigation
- unrelated Monster tabs / Box / Dex controls
- long evolution-method tutorial
- unrelated special-form tutorial
- multiple competing CTA
- Home primaryを奪うためだけの常設`EVOLUTION_READY` dashboard

## CHILD DECISION

reveal中の戦略判断はなし。rewardを見て `つづける！`。

## ENTRY / EXIT

ENTRY:
- **進化が獲得/実行された元flow**から入る
- Battle / learning / Monster等、実際の発火条件はEvolution canonicalに従う
- Monsterで明示的に進化を実行する場合も同じfocused ownerへ入る

EXIT:
- updated species/unlock stateを反映して、originating contextへ戻る

## FOCUSED STATE / OVERLAY OWNERSHIP

full-screen focused reward state。

- background interaction disabled
- global navigation hidden/suppressed
- revealの時間的段階はEvolution ownerが持つ

## KEEP

- full-screen celebration
- before/after art
- stat gains
- Dex/area unlock feedback when actually applicable

## REMOVE

- ordinary page chrome during reveal
- explanatory clutter
- Homeのprimary CTAとして自動割込みする設計

## REBUILD

detail-cardの値更新ではなく、**temporal reward sequence**として扱う。

---

# 10. HowTo

## PURPOSE

子どもの **「どうやるの？」** に短く答え、すぐ遊びへ戻す。

## PRIMARY CTA

- landing: help topic selection
- topic detail: current contextに戻る `つづけて あそぶ` / relevant destination

## MUST SHOW

- short core loop
- clear help topics: learning / adventure / battle-capture / raising-evolution / special forms-rewards
- concise answer first
- detailは展開式
- current partner/next evolution hintが質問解決に必要な場合のみcontextualに
- Capture説明ではD-017のボール名・1投→4星→結果flowを使用する

## MUST NOT SHOW

landingで以下を全展開しない。

- all steps manual wall
- all evolution methods
- all reward economy cards
- full Giga/Burst manual
- Battle/Monsterで既にcontextual表示されるruleの重複常設
- implementation terminology
- child-facing旧「○○のわ」説明

## CHILD DECISION

`なにを しりたい？`

## ENTRY / EXIT

ENTRY:
- top-level HowTo
- contextual help link

EXIT:
- originating screenへ戻る
- relevant destinationへ進む

## FOCUSED STATE / OVERLAY OWNERSHIP

- topic/accordion ownerはHowTo
- deep modal stackを作らない
- contextual helpから戻り先を失わない

## KEEP

- child-readable language
- contextual next-evolution help
- direct route back to play

## REMOVE

- always-expanded manual wall
- landing上のexhaustive reward/special-form explanation

## REBUILD

**Answer the current question** を優先し、設計書全文を見せる画面にしない。

---

# 11. Parent

## PURPOSE

adult-only configurationをchild flowから隔離し、保護者が明示的に入るprotected screen。

## PRIMARY CTA

- locked: established adult/PIN checkによるunlock
- unlocked: adultが選択したsettings action

PIN/ownership詳細はplatform canonicalへ委譲し、W-106では「child navigationから保護されること」を固定する。

## MUST SHOW

- protected/adult-only identity
- adult check / PIN flow（platform canonicalに準拠）
- recovery/reset path（既存保護モデルに準拠）
- unlock後のみadult settings
- explicit exit/relock

## MUST NOT SHOW

- Parentをnormal child bottom/top-level tabにする
- child game CTAをgateと競合させる
- unlock前にadult settingsを見せる
- Parent settings内へchild tutorialを混在させる

## CHILD DECISION

なし。childには明確なprotected boundaryのみを見せる。

## ENTRY / EXIT

ENTRY:
- Home/menu等のsecondary protected entry

EXIT:
- explicit close/back → relock → Home/origin

## FOCUSED STATE / OVERLAY OWNERSHIP

- gateはParent-owned focused screen
- unlock後のadult dialogはParent owner
- child navigationを内部に持ち込まない

## KEEP

- ParentGate concept
- established local PIN/adult-check behavior
- adult-only settings ownership

## REMOVE

- child top-level navigationとしてのParent
- Kids Quest由来visual shellが別app boundaryに見える状態
- adult settings内のchild-facing navigation

## REBUILD

ManaEvoの意図的なadult shellとして統一する。

---

# 12. State ownership map

| Product state | Owner | Permanent child top-level nav |
|---|---|---|
| Home | App shell | Yes |
| Study hub | Study | Yes |
| Study activity/free/review/trial/dictionary | Study focused flow | No separate tab |
| Adventure map | Adventure | Yes |
| Battle | Adventure/Battle flow | No |
| Capture | Battle focused substate | No |
| Monster team/box | Monster | Yes |
| Dex | Monster/Dex local route | No separate tab |
| Evolution | Full-screen reward | No |
| HowTo | Help | Yes |
| Parent | Protected adult flow | No child tab |

---

# 13. KEEP / REMOVE / REBUILD summary

## KEEP

- one clear child decision
- world-first Adventure direction
- team-first Monster direction
- grid-first Dex direction
- full-screen Evolution reward
- Kids Quest learning logic with ManaEvo UI shell
- formal/art-runtime-eligible monster prominence / safe placeholder fallback contract
- iPhone portrait priority
- capture probability/domain contract

## REMOVE

- old+new UI stacking
- Home permanent six-step/manual panels
- Adventure world route + Area tabs duplication
- Adventure permanent search/filter/huge list
- Battle permanent capture/team/tips pile
- Monster Team+Box+Dex+tutorial pile
- Capture exact `%` as child primary representation
- child-facing「○○のわ」物体表現
- Home Evolution primary override
- Parent in normal child navigation
- cross-tab scroll leakage
- iPhone status bar overlap
- tiny question visual
- Japanese labels breaking into one/two-character columns

## REBUILD

- screen/component visual ownership
- state-driven Battle command surface
- one-ball focused Capture flow
- progressive Adventure browsing
- ManaEvo-consistent Study shell with large question visual
- topic-based HowTo
- Parent adult shell
- per-top-level scroll ownership

---

# 14. Runtime classification / implementation boundary

Phase 1.5監査およびD-017実機playtestで確認されたruntimeの構造は仕様根拠ではなく、実装時のdeltaとして扱う。

代表的なREBUILD対象:

- CSS authorityがload order / `!important`へ依存する箇所
- legacy + new UI accumulation
- Home information overload / awkward compact wrapping
- Battle multi-purpose vertical pile / weak visual hierarchy
- Monster multi-purpose vertical pile
- navigation ownership ambiguity / cross-tab scroll leakage
- Study shellの二重性 / focused safe-area / tiny problem visual
- MonsterArt resolutionの多重性
- UI testsがchild behaviorよりclass/source/load-orderを固定する箇所

W-106 canonical自体はgame ruleを変更しない。

---

# 15. Acceptance contract for W-106

このCURRENT canonicalを使う次工程は、古いUI設計文書を読み直さなくても次の行動契約を実装できること。

必須Acceptance:

1. **10画面すべて**に PURPOSE / PRIMARY CTA / MUST SHOW / MUST NOT SHOW / CHILD DECISION / ENTRY-EXIT / focused state-overlay ownership / KEEP-REMOVE-REBUILD がある。
2. Home primaryは **learning incomplete → Study / learning complete → Adventure**。EvolutionがHome primaryを奪わない。
3. Captureのprimary representationは **ボール自体＋★＋日本語ラベル＋おすすめ**。exact `%` はsecondary/detail。
4. Capture child-facing名は **ほしボール / ぎんボール / きんボール / にじボール**。stable domain key / 倍率 / cap / 最大3投を変更しない。
5. 1capture attemptは **1個のボールを1回投げる → 命中/包み込み → 4星temporal sequence → success/failure motion**。UI reroll禁止。
6. Adventure normal stateは area navigationを1つだけ持ち、world route + duplicate Area tabsを同時表示しない。
7. Adventure normal stateにpermanent search/filter/huge listを置かず、encounter candidatesはmax5。
8. Battle normal turnにexpanded capture item grid / team list / tipsを常時積まない。arena / concise state / command deckが視覚分離される。
9. Monster normal stateにTeam + Box + Dex + tutorial群を同時展開しない。
10. Evolutionはoriginating earned flowから入るfull-screen focused rewardで、Home primary overrideにしない。
11. Parentはchild top-level navigationから隔離する。
12. **375〜430px iPhone portrait**で目的・主役・現在状態・primary actionが理解でき、interactive controlがsafe-areaへ侵入しない。
13. top-level 5 destinationは独立scroll位置を持ち、destination間でscroll leakageしない。focused flowは上端から開始し、終了後はorigin top-level positionへ戻れる。
14. Study question visualは375〜430pxで問題の主役として十分大きく、図形/時計/絵/文字が小さな記号にならない。
15. compact status/header/buttonの日本語が1〜2文字単位の不自然な縦崩れを起こさない。
16. 新しいglobal CSS override layerや`!important`を設計解決策にしない。
17. active Dex scopeはNo.001〜238。No.239をactive progressへ含めない。
18. Battle開始ticketはD-007に従いreserveとして扱い、UI仕様から開始時確定消費を示さない。
19. game-rule詳細の未確定項目をUI都合で新規定義しない。

## BLOCKED DECISION

UI実装時にgame-rule詳細が必要な場合は、該当domain canonical（Learning / Battle / Capture / Evolution / World / Platform）を参照し、未確定ならそこでBLOCKED扱いにする。D-017はpresentation/navigation/legibilityの明示決定であり、捕獲確率・ticket・進化等の未確定game ruleを解消しない。
