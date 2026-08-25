# ManaEvo 再建監査 — バトル・捕獲・育成・進化・特殊形態

更新日: 2026-08-25  
担当: Worker 3 / SOL③  
対象runtime: `main` 2026-08-25 時点  
監査branch: `rebuild/battle-capture-evolution-audit`  
状態: **AUDIT ONLY / src・tests・既存正本は変更しない**

## 0. 結論

この監査で、現在動いているruntimeを正本とは扱っていない。また FINAL-CORRECTED を機械的に現在仕様へ戻す判断もしていない。

最重要の制約は、W-001 / PR #35 時点で `mana-evo-terra-FINAL-CORRECTED(3).zip` の実体がGitHub上から取得できず、`design/baseline/FINAL-CORRECTED/` には原本sourceが **0件** しか保存されていないこと。したがって A=FINAL-CORRECTED は、後続設計書が「FINAL-CORRECTEDから復元した」「旧原本はこうだった」と明記している箇所だけを **A-indirect** として扱う。原本未確認の項目を `SAME` に推定してはいけない。

一方で、後続設計・merged PR・runtime・testsの間には強い整合がある項目が多い。特に捕獲タイミング、わ倍率、Team XP、held-item進化、通常再戦、特殊形態対象は後続のレビュー履歴が追える。

現時点で修正候補として確実に切り出すべき implementation drift は次の2件。

1. **ボスsnapshotのbalanceVersion更新後再固定が壊れている。** `buildEnemyPlan()` は旧version snapshotを無効扱いにして新snapshotを計算するが、`startBattle()` は `existingSnapshot` が存在すると新snapshotを保存しない。そのためbalance version更新後は通常再戦のたびに再scaleし続け、「再評価した新snapshotへ固定」にならない。
2. **捕獲4段階演出が設計より弱い。** 設計は「わ + ★★★★」の4段階アニメーションを要求するが、runtime/UIは捕獲判定で星数を一括決定し、画面では `★/☆` 状態を表示する。段階的な時間演出を保証する実装・test契約は確認できない。

これ以外にも、原本欠落またはcurrent design内の世代差により `UNRESOLVED` とした項目がある。これらは実装を正として確定してはいけない。

---

## 1. 監査ルール

### 1.1 指定された再建governance

以下を `rebuild/canonical-governance` から先に確認した。

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md`
- `design/rebuild/WORK-QUEUE.md`
- `design/rebuild/HANDOFF-TEMPLATE.md`

適用した優先順位:

1. ユーザーの明示判断
2. FINAL-CORRECTED baseline
3. その後に承認された変更
4. current design / current canonical
5. data master
6. runtime
7. tests / review記録

runtime / tests が一致していることだけでは仕様確定根拠にしない。

### 1.2 判定ラベル

| ラベル | 意味 |
|---|---|
| `SAME` | Aと後続仕様が同じと追跡でき、D/Eも整合する。Aが直接読めない場合は本文でA-indirectと明記する。 |
| `CONFIRMED_CHANGE` | 旧仕様・旧設計から変わったが、後続の設計・レビュー・merged PR等に変更根拠がある。 |
| `IMPLEMENTATION_DRIFT` | current intentに対してruntimeまたはtest契約がずれている。 |
| `UNRESOLVED` | Aが取れない、Bが競合する、またはCの承認根拠が不足して一意に決められない。 |

### 1.3 A〜E

- **A FINAL-CORRECTED**: exact archiveは未救出。PR #35 / `design/baseline/FINAL-CORRECTED/README.md` で BLOCKED。
- **B current design**: 主に `design/01`, `06`, `09`, `10`, `11`, `12`, `17`, `19`, `20`。同一論点では後発の明示的上書きを優先。
- **C Git/PR/Issue**: 主に merged PR #15, #19, #22, #26, #27, #28, #29, #31, #32。関連Issue検索では独立した承認Issueは確認できなかった。
- **D runtime**: `src/game/engine.js`, `balance.js`, `progression.js`, `content.js`, `worldProgression.js`, `GameScreens.jsx`。
- **E tests**: `tests/game.test.js`, `balance.test.js`, `pr15-master.test.js`, `review-hardening.test.js`, `progression-review-fixes.test.js` 等。テストコードを証拠として読んだ。監査作業では既存testを変更していない。

---

## 2. current design内の優先順位衝突

current `design/` 自体が一枚岩ではない。以下は「古いファイルが残っている = 未決」とは扱わず、後発文書の明示的上書き関係を追った。

| 論点 | 古い記述 | 後発記述 | 監査判断 |
|---|---|---|---|
| 通常敵の戦力基準 | `design/06`: teamとrosterを混ぜるreference | `design/11/12`: 通常敵は現在team 1〜3体のみ、BOX無視 | 後発をcurrent intentとする |
| STAB / 乱数 / 急所 | `design/10`: STAB 1.5、damage 0.90〜1.00、通常急所あり | `design/11/12` と `01-UNRESOLVED-DECISIONS.md`: STAB 1.20、damage乱数なし、通常急所なし | 後発をcurrent intentとする |
| held-item進化 | `design/01`: item + 必要Lv | `design/11/12/17`: 固定Lvなし、装備後の次の実LvUP | 後発をcurrent intentとする |
| ボスsnapshotのversion更新 | `design/06`: 将来balanceVersionが変わっても既存snapshot尊重 | `design/20`（ユーザー承認済み）: balance version更新時は再評価可能 | `design/20`を優先 |
| 第2形態wild解放 | `design/20 §9`: `requiresOwnedSpeciesId` | 同文書の後発 §12: `evolutionDiscoveries` を正とする | §12を優先。runtime/testも§12 |
| 進化不可 | `design/01`: 原則進化、非進化は明示boss/divine例外 | `design/20`（ユーザー承認済み）: 元来の単段階種は例外としてwild GET可能 | 後発を優先 |

---

## 3. バトル監査

| 項目 | A FINAL-CORRECTED | B current design | C 承認/変更根拠 | D runtime | E tests | 判定 |
|---|---|---|---|---|---|---|
| バトル開始条件 | exact不明 | 今日の基本学習完了、stage解放、ticket、active battleなし | PR #19/#22/#26で学習完了gate・battle開始不具合を修正 | `startBattle()` が `DAILY_NOT_COMPLETED / NO_TICKET / LOCKED_STAGE / BATTLE_ALREADY_ACTIVE` を実装 | `game.test.js` が日跨ぎ学習完了を拒否 | **UNRESOLVED**。B〜Eは一致するがAを確認できない |
| 手持ち | exact不明 | 最大3体、active 1体、交代あり | PR #15/#31/#32が3体battleを前提 | `setTeam()` 最大3、`teamAtStart` 最大3 | 最大3体・HP保持・強制交代をtest | **UNRESOLVED**。current契約は強いがA不明 |
| 敵編成 | exact不明 | stageごとに敵1体を基本とする実装設計 | PR #15 runtime 216 stages | `battle.enemy` は単一species | battle testsは単体enemy前提 | **UNRESOLVED**。敵party制を否定する原本根拠なし |
| HP / 攻撃 / 防御 / 素早さ | A-indirect: `design/10` が実装前設計から復元した式として管理 | 4能力、同種同Lvは同能力、隠しIV/EV等なし | PR #15レビュー・master化 | `statsFromBase()` が同式 | `balance.test.js` がLv5/50/100を検証 | **SAME**（A-indirect。exact archiveで再確認要） |
| 4技 | exact不明 | 1体4技。共通`まもる`は別action | PR #15で238体×4通常技 + burst8技を確定 | species `moves[4]`; burst時も4枠置換 | PR15 master / review-hardeningで4枠を固定 | **UNRESOLVED**。currentは確定だがA不明 |
| 共通「まもる」 | baseline根拠未回収 | 100%、1行動、連続不可、ボス大技にも有効 | `design/17`で採用、PR #15 MERGE GO | `useProtect()` | PR15 runtime gateでPASS | **CONFIRMED_CHANGE**。後続レビューで採用された追加仕様 |
| タイプ相性 | exact不明 | 18タイプ、0 / 0.5 / 1 / 2、技選択前表示 | PR #15 formal master | `typeEffectiveness()` | fire/grass, fire/water, electric/ground等をtest | **UNRESOLVED**。currentは一致、A直接証拠なし |
| STAB・乱数・急所 | A exact不明。旧`design/10`は STAB1.5 / 0.90〜1.00乱数 / 急所1/16 | 後発 `design/11/12`: STAB1.20 / damage乱数なし / 通常急所なし | `design/11`が06/10より新しい確定差分。PR #15 merge | `damageAmount()` STAB1.2、damage乱数/critなし | current testsは周辺契約を固定 | **CONFIRMED_CHANGE**。少なくともcurrent design世代間の変更根拠あり |
| XP曲線 / Lv上限 | A-indirect: `design/10`が復元値として `6*(Lv-1)^1.9` | 同式、Lv100 | PR #15 | `totalXpForLevel`, `xpToNext`, Lv100 cap | `game.test.js` | **SAME**（A-indirect） |
| Battle XP配布 | baseline不明 | 開始時team最大3体へ勝利/捕獲成功で100%ずつ。捕獲個体は対象外 | `design/11/12/17`、PR #15で明示的に確定 | `awardTeamBattleXp()` | win/captureのtestあり | **CONFIRMED_CHANGE**。後続確定事項として強い |
| 敗北 | baseline不明 | 全員戦闘不能でloss。健在控えがいれば強制交代 | PR #15 runtime gate | `resolvePlayerFaint()` | loss/needs_switch test | **UNRESOLVED**。B〜E一致、A不明 |
| 敗北/明示離脱ticket | baseline不明 | 敗北/離脱は元期限で返却、勝利/捕獲は消費確定 | PR #15 / `design/19` MERGE GO | `refundLostBattleIfNeeded()`, `abandonBattle()` | exactly once / original expiry test | **CONFIRMED_CHANGE**。後続release gateで明示確定 |
| 通常再戦 | A exact不明。後続レビュー前は固定/完全追従の案が混在 | current team soft scale、初回reference、repeat cap×1.10、成長時HP/DEF easing | `design/11/17/19`, PR #15 | `buildEnemyPlan()` | `balance.test.js` | **CONFIRMED_CHANGE**。PR #15でsimulationまで通した後続仕様 |
| ボス再戦 | exact不明 | 初回snapshot、通常再戦固定、challenge再戦rescale。`design/20`はbalanceVersion更新時再評価可 | PR #15 + PR #27〜29、`design/20`はユーザー承認済み | 通常version一致時はlocked、challengeはrescale | `balance.test.js` | **IMPLEMENTATION_DRIFT**。version更新後だけ新snapshotが保存されず毎回再scaleする不具合あり（詳細§8） |
| 同速 | exact不明 | 同速はplayer先手 | `design/12` | `playerStats.speed >= enemyStats.speed` | 専用testは未確認 | **UNRESOLVED**。A/Cが弱い |

---

## 4. 捕獲監査

| 項目 | A FINAL-CORRECTED | B current design | C 承認/変更根拠 | D runtime | E tests | 判定 |
|---|---|---|---|---|---|---|
| 捕獲タイミング | **A-indirect明示**: `design/10` が FINAL-CORRECTED旧案を「勝利後捕獲」と記録 | HP50%以下から戦闘中に投げる | 後日承認仕様として`design/10`自身が優先。PR #26/#31/#32 | `canAttemptCapture()` HP≤50% | HP50%以下までblock test | **CONFIRMED_CHANGE** |
| 「わ」4種 | A-indirect: 旧原本に銀/金倍率記録あり | ほし / ぎん / きん / にじ | PR #15/#26、UI PR #31/#32 | `CAPTURE_CONFIG` 4種 | 4種の性能test | **CONFIRMED_CHANGE**。少なくとも倍率は旧原本から変更 |
| わ倍率 | **A-indirect**: ぎん1.5 / きん2.0 | ほし1.0 / ぎん1.2 / きん1.5 / にじ100%、非にじ上限92% | `design/10/11/12`, PR #15 | `CAPTURE_CONFIG` | `game.test.js` | **CONFIRMED_CHANGE** |
| 捕獲率の基礎式 | exact不明 | `catchRarity` とstageから `catchRank` を確定。base chanceの具体式はcurrent designで十分に正本化されていない | catchRankは`design/17` P0解消・PR #15 | `0.34 + missing*0.62 - catchRank*0.07`, clamp 0.12〜0.90、その後わ倍率 | catchRank masterは全238体test。base式そのものの定数testは弱い | **UNRESOLVED**。catchRankは確定、base chance定数はcode由来が強すぎる |
| 最大3投 | A exact不明 | 1battle最大3投 | PR #15/#26/#31 | `MAX_CAPTURE_ATTEMPTS=3` | 4投目拒否test | **CONFIRMED_CHANGE**。戦闘中捕獲への後続変更と一体で固定 |
| 捕獲失敗時 | Aの勝利後捕獲案とは構造的に異なる | 1turn消費し敵が行動 | 後続承認仕様、PR #26でburst turn消費も補強 | `attemptCapture()` failure → enemy action | failed capture test | **CONFIRMED_CHANGE** |
| 捕獲演出 | exact不明 | `design/01`: 「わ + ★★★★」4段階アニメーション | UI PRは4段階表示を維持と説明 | engineは4 roll結果を一括決定、UIは`★/☆`を状態表示。時間的4段階animation契約は確認できない | animation sequencingを固定するtestなし | **IMPLEMENTATION_DRIFT** |
| 捕獲成功後XP | baseline不明 | battle開始teamへ撃破と同額、捕獲個体はその戦闘XPなし | `design/11/12`, PR #15 | `awardTeamBattleXp()`後にcaptured生成 | rainbow capture test | **CONFIRMED_CHANGE** |
| 捕獲成功後Mana | baseline不明 | 撃破時の50% | `design/11/12` | `floor(stage.mana/2)` | 専用定数testは弱い | **CONFIRMED_CHANGE** |
| 捕獲個体の所属 | exact不明 | 設計上BOX/手持ち管理はあるが「手持ち3未満なら自動加入」までの明示正本は確認できず | 強い承認根拠未発見 | 捕獲時BOX追加、team<3なら自動追加 | 捕獲testはspecies登録を確認 | **UNRESOLVED**。自動加入はcode-onlyに近い |
| 捕獲でstage clear / 初回報酬 | baseline不明 | 捕獲成功も戦闘成功として扱う後続設計 | PR #15で捕獲成功XP、PR #26以降のtrial/special reward | caught時も`stagesCleared`、evo/special first-clear rewardを処理 | snapshot等をtest | **CONFIRMED_CHANGE** |

---

## 5. 育成・通常進化監査

| 項目 | A FINAL-CORRECTED | B current design | C 承認/変更根拠 | D runtime | E tests | 判定 |
|---|---|---|---|---|---|---|
| 通常進化方式 | exact原本未回収 | `level / stone / held_item_levelup` の3方式 | PR #15で155遷移=123/21/11を確定 | `evolutionConditionMet()` | `pr15-master.test.js`, `game.test.js` | **UNRESOLVED**。currentは強固だがA直接確認不能 |
| level進化 | exact不明 | 指定Lv到達でReady | PR #15 | runtime masterの`evolution.level` | E2E test | **UNRESOLVED**（方式はcurrent確定、A不明） |
| 進化Lvのワールド補正 | 原本/旧CSVはワールドLv帯導入前 | `design/20 §12`: 第1形はwild zone max+4以上、後段は前進化+10以上。originalLevelを保持 | **ユーザー承認済み** `design/20`、merged PR #29 | generated runtimeで実効Lvを利用 | `progression-review-fixes.test.js` | **CONFIRMED_CHANGE** |
| stone進化 | exact不明 | item 1個消費、固定Lvなし | PR #15 | `evolveInstance()`で1個消費 | E2E test | **UNRESOLVED**。current一致だがA直接不明 |
| held-item進化条件 | `design/01`旧記述は「item + 必要Lv」 | 後発: 固定必要Lvなし。装備中の**次の実LvUP**でReady | `design/17` P0、PR #15 GO/MERGE | `gainXp()`で`evolutionReady=true` | 実LvUP必須test | **CONFIRMED_CHANGE** |
| held item消費 | exact不明 | 進化後も装備維持 | PR #15 | `normalEvolve()`は保持 | E2E test | **UNRESOLVED**。current一致、A不明 |
| 進化アイテム取得 | 原本exact不明。初期runtimeには固定stage案が存在 | stone21 + held11の32遷移ごとに専用trial、初回クリアで必要item 1個保証。random/課金なし | `design/11/12/17/18`, PR #15 | stage first-clear reward | `pr15-master.test.js`で32/32 | **CONFIRMED_CHANGE** |
| trial挑戦条件 | exact不明 | area gate + source owned + 今日の基本学習完了 | PR #15 | stage unlock + battle start daily gate | acquisition master test | **CONFIRMED_CHANGE** |
| 進化後処理 | exact不明 | instance/Lv/XP維持、species切替、図鑑登録。自力進化記録で上級wild解放 | `design/20`ユーザー承認済み、PR #29 | `evolveInstance()` | progression review test | **CONFIRMED_CHANGE**（特に`evolutionDiscoveries`） |
| 進化不可個体 | `design/01`の一般原則は「原則進化、明示boss/divineのみ例外」 | `design/20`は元来の単段階種を例外としてwild GET可能。各family最終形は当然その先なし | `design/20`状態=ユーザー承認済み、PR #27〜29 | `species.evolution`なしを最終/単段階として扱う | 155遷移/83系列をmaster test | **CONFIRMED_CHANGE**。ただし「どの単段階種を例外にするか」のbaseline照合はW-005で再確認要 |
| 最終進化形の通常捕獲 | 原本exact不明 | 通常wildに出さず、育成到達のごほうび。boss/試練で姿を見るのは可 | `design/20`ユーザー承認済み、PR #27〜29 | final wildはhidden/captureDisabledになるworld rule | progression tests | **CONFIRMED_CHANGE** |

---

## 6. ギガシンカ監査

### 6.1 対象12体

`design/09` は対象割当を FINAL-CORRECTED の `scripts/forms.mjs` 等から復元したと明記している。exact archiveは未救出だが、これはA-indirectとして最も強い復元証拠。

| No. | ID | 名前 |
|---:|---|---|
| 003 | m003 | ジュランガ |
| 006 | m006 | グレンドウ |
| 009 | m009 | ワダツラ |
| 051 | m051 | マシュランテ |
| 054 | m054 | メンタリオン |
| 072 | m072 | ライテイガ |
| 090 | m090 | センガンジ |
| 121 | m121 | ヒョウガルド |
| 153 | m153 | キュウビガミ |
| 156 | m156 | ガードヴァルツ |
| 159 | m159 | イワガミラ |
| 186 | m186 | ニジリュウガ |

**判定: `SAME`（A-indirect）**。PR #15で「再選定しない」、master testで12体・burstとのoverlap 0を固定。

### 6.2 条件・取得・効果

| 項目 | B/C | D/E | 判定 |
|---|---|---|---|
| 最終形のみ | `design/09`, PR #15 | `specialProgressionStatus().isFinal` | `SAME`相当だがA exact未確認のため **UNRESOLVED** |
| 共通ギガキー | 永久。`design/09`は「story early」、PR #26でArea1 boss clearへ具体化 | save migration含めArea1 bossで`gigaKeyOwned`; testあり | **CONFIRMED_CHANGE**（取得地点の具体化） |
| 種族別ギガコア | 最終進化後の専用challenge初回勝利で永久解放 | `gigaCoreSpecies[speciesId]` | **UNRESOLVED**。currentは一致、A exact取得条件未回収 |
| 発動回数 | party全体で特殊形態1回/battle | `specialUsed` | **UNRESOLVED**。current一致、A exact不明 |
| 効果 | 全4能力×1.35、battle終了まで、HP割合維持 | `GIGA_MULTIPLIER=1.35`, HP ratio preserve | **UNRESOLVED**。current一致、A exact数値未回収 |
| 図鑑 | 初回発動を同一species slotへ登録 | `specialDex.giga` | **CONFIRMED_CHANGE**。PR #26で明示補強 |

---

## 7. キョダイバースト監査

### 7.1 対象8体

| No. | ID | 名前 |
|---:|---|---|
| 060 | m060 | アカリガルド |
| 066 | m066 | ゲンコツヅラ |
| 133 | m133 | カイテイリオ |
| 136 | m136 | センジュガ |
| 142 | m142 | ヘラクレオン |
| 165 | m165 | テラガイア |
| 171 | m171 | フドウザン |
| 174 | m174 | テンショウガ |

`design/09`は対象ID割当をFINAL-CORRECTEDから復元したと記録し、PR #15も8体を再選定しない方針。**ID割当は `SAME`（A-indirect）**。

No.142だけは旧特殊形態文書名 `カブトレクス` と238体master `ヘラクレオン` が衝突し、`design/17`でID維持・正式名ヘラクレオンへ統一した。**名称は `CONFIRMED_CHANGE`**。

### 7.2 条件・効果

| 項目 | B/C | D/E | 判定 |
|---|---|---|---|
| 最終形 + 種族別mark | 専用challenge初回勝利で永久mark | `burstMarks` + final check | **UNRESOLVED**。current一致、A exact取得条件不明 |
| 3turn | `design/09`, PR #26 | `BURST_TURNS=3` | **UNRESOLVED**。A exact数値未回収 |
| HP×2 / 攻撃×1.2 | `design/09` | runtime定数、UI表示 | **UNRESOLVED**。current一致、A exact数値未回収 |
| 専用技 | 最強枠をpower110/acc95のburst技へ置換。5つ目にしない | `availableBattleMoveIds()`が4枠置換 | review-hardening test | **CONFIRMED_CHANGE**。PR #26で5枠化を明示的に避けた |
| turn消費 | 攻撃だけでなく捕獲失敗・自主交代でも消費 | PR #26 | runtime + tests | **CONFIRMED_CHANGE** |
| Gigaとの併用 | 1battleでparty全体1特殊形態のみ | `specialUsed` | **UNRESOLVED**。current一致、A exact不明 |
| 図鑑 | 初回発動を同一species slotへ登録 | PR #26 | `specialDex.burst` + test | **CONFIRMED_CHANGE** |

---

## 8. IMPLEMENTATION_DRIFT 詳細

### DRIFT-1: balanceVersion更新後のboss snapshotが再固定されない

**期待仕様**

- 通常のboss初回挑戦でsnapshotを保存。
- 通常再戦はそのsnapshot固定。
- challenge再戦だけ現在戦力へrescale。
- `design/20`（ユーザー承認済み）はbalance version更新時にsnapshotを再評価可能とする。

**runtime**

`balance.js` の `validBossSnapshot()` は `snapshot.balanceVersion === BALANCE_VERSION` を要求する。旧versionなら新しいboss planとsnapshotを生成する。ここまでは期待通り。

しかし `engine.js/startBattle()` は概略次の条件で保存する。

```js
const existingSnapshot = game.bossBalanceSnapshots?.[stage.id] || null
const balancePlan = buildEnemyPlan(... existingSnapshot ...)

if (balancePlan?.snapshot && !challenge && !existingSnapshot) {
  nextGame.bossBalanceSnapshots[stage.id] = balancePlan.snapshot
}
```

旧version snapshotも `existingSnapshot` 自体はtruthyなので、新しく計算したsnapshotが保存されない。結果、balanceVersion更新後の通常再戦では毎回その時点の戦力から再scaleされ得る。

**test gap**

`balance.test.js` は同一versionのsnapshot lockとchallenge rescaleは検証するが、`balanceVersion`が古い既存snapshotを渡した後に「新snapshotがsaveへ置換され、その後固定される」E2Eを検証していない。

**分類: `IMPLEMENTATION_DRIFT`**

再建実装フェーズでは、invalid existing snapshotの場合も新snapshotへ1回置換し、その後の通常再戦を固定する契約testが必要。

### DRIFT-2: 捕獲4段階アニメーション契約が不足

`design/01` は捕獲演出を「わ + ★★★★」の4段階アニメーションとしている。

current runtimeは:

- `attemptCapture()` が最大4 rollを一度に評価して `captureStars` を決定。
- `GameScreens.jsx` が4個の `★/☆` を現在状態として表示。
- CSSにcapture starの段階的sequenceを保証する定義は確認できない。
- testsは「4段階表示」「投げるUI」までで、時間的に1→2→3→4と見せる演出を契約していない。

これは確率ロジックの不整合ではなくUX演出のimplementation drift。

**分類: `IMPLEMENTATION_DRIFT`**

---

## 9. スター覚醒等の混入監査

current canonicalの判断は明確。

- `design/01`: 「不採用: スター覚醒 / スター覚醒用スターのかけら」
- `design/09`: Star Awakeningを採用しない
- `01-UNRESOLVED-DECISIONS.md`: 「スター覚醒なし」
- PR #15: 「スター覚醒なし」
- PR #27: 「スター覚醒（導入しない）」
- `tests/game.test.js`: legacy saveに `starShards` / `starAwakened` があってもcurrent saveへ残さないことを検証

つまり、**途中runtime/旧saveにはStar Awakening系fieldが混入した履歴が実在するが、current仕様では明示的に除去済み**。

A exact archiveが未回収なので「FINAL-CORRECTEDにも絶対なかった」とまではこの監査では断定しない。ただしcurrentへ復活させる根拠はゼロで、むしろ除外根拠が複数ある。

**分類: `CONFIRMED_CHANGE`（historical contamination removal）**

再建時に `starShards`, `starAwakened`, `gigaStones` 等のlegacy fieldを仕様として復活させない。

---

## 10. 分類サマリ

### `SAME`

- 4能力の基本Lv式 / Lv100（A-indirect）
- XP曲線（A-indirect）
- ギガ対象12 ID（A-indirect）
- バースト対象8 ID（A-indirect。No.142名称のみ後続変更）

### `CONFIRMED_CHANGE`

- STAB1.20・damage乱数なし・通常急所なしへの後発統一
- 共通`まもる`
- Team XP 100%
- 敗北/離脱ticket返却
- 通常再戦soft scale + repeat cap + mastery easing
- 戦闘中HP50%以下捕獲
- 4種のわの現倍率・92%cap
- 最大3投、失敗で敵turn
- 捕獲成功XP/Mana/first-clear処理
- held-item「固定Lvなし + 次の実LvUP」
- 実効進化Lvのworld補正
- 32遷移の専用進化trial初回保証
- `evolutionDiscoveries`
- 単段階種例外・最終形通常wild不可
- Giga keyのArea1 boss具体化
- Burst技4枠置換 / failed capture・自主交代のturn消費
- special form同一図鑑slot登録
- No.142正式名ヘラクレオン
- Star Awakening legacy混入の除去

### `IMPLEMENTATION_DRIFT`

1. balanceVersion更新後のboss snapshot再固定不全
2. 捕獲4段階animation契約不足

### `UNRESOLVED`

A exact archive未救出のため、以下はcurrent B〜Eが一致していても原本同一性を断定しない。

- battle開始条件
- team 3 / enemy 1の原本由来
- 4技・18typeの原本由来
- 同速player先手
- precise base capture chance定数
- 捕獲時team空き枠への自動加入
- 通常進化3方式そのものの原本同一性
- stone/held itemの消費・保持の原本同一性
- Giga/Burstのexact取得条件・倍率・turn数・party exclusivityの原本同一性（currentは内部整合）

---

## 11. 次工程へ渡す決定要求

この監査だけで仕様変更は決めない。次工程では以下の順で処理する。

1. **W-001でexact FINAL-CORRECTED archiveを救出**し、本監査のA=`UNRESOLVED`を再判定する。
2. DRIFT-1 boss snapshotは current user-approved design とruntimeの明確な不一致なので、再建実装work itemへ修正候補として送る。
3. DRIFT-2 capture animationは確率仕様を触らず、UX実装/契約testの不足として切り出す。
4. base capture chanceの数式定数は、コードを正本化せず、原本または承認ログが取れなければ `BLOCKED DECISION` とする。
5. Star Awakeningはcurrentへ戻さない。exact baseline救出で記載が見つかった場合も、後続の明示的不採用判断との時系列差分として扱う。

---

## 12. 主要証拠一覧

### Governance / baseline rescue

- `REBUILD-START-HERE.md` @ `rebuild/canonical-governance`
- `design/rebuild/DECISION-LOG.md`
- `design/rebuild/WORK-QUEUE.md`
- `design/rebuild/HANDOFF-TEMPLATE.md`
- `design/baseline/FINAL-CORRECTED/README.md` @ `rebuild/w-001-final-corrected-baseline`
- PR #35 `W-001: rescue FINAL-CORRECTED as immutable baseline` — exact archive unavailable / source 0件

### Current design

- `design/01-catch-and-evolution-design.md`
- `design/06-battle-and-progression-design.md`
- `design/09-special-forms-master.md`
- `design/10-initial-balance-master.md`
- `design/11-battle-character-boss-review.md`
- `design/12-detailed-balance-design-for-sol-review.md`
- `design/17-sol-pr15-review-amendment.md`
- `design/19-sol-pr15-runtime-completion.md`
- `design/20-world-map-evolution-progression.md` — 状態「正本仕様（ユーザー承認済み）」
- `01-UNRESOLVED-DECISIONS.md`

### Git / PR

- PR #15: 238体正式master、battle/evolution runtime MERGE GO
- PR #19/#22: 学習完了後のbattle gate / 日付不具合回帰
- PR #26: capture / special forms hardening
- PR #27/#28/#29: world progression / self evolution / effective evolution levels
- PR #31/#32: approved UI mockup反映。ただしゲームロジックは維持

### Runtime

- `src/game/engine.js`
- `src/game/balance.js`
- `src/game/progression.js`
- `src/game/content.js`
- `src/game/GameScreens.jsx`

### Tests

- `tests/game.test.js`
- `tests/balance.test.js`
- `tests/pr15-master.test.js`
- `tests/review-hardening.test.js`
- `tests/progression-review-fixes.test.js`

---

## 13. Worker handoff

- 完了: A/B/C/D/Eのbattle-capture-evolution差分監査
- 変更したもの: この監査Markdownのみ
- 変更していないもの: `src/**`, `tests/**`, current `design/**` canonical files
- BLOCKED INPUT: exact FINAL-CORRECTED archive
- 実装修正は未実施
- 次担当は `IMPLEMENTATION_DRIFT` 2件と `UNRESOLVED` 群を、baseline rescue完了後に再判定すること
