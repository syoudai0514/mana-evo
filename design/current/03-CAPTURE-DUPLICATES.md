# ManaEvo CURRENT — Capture / Duplicates

Work Item: W-103  
Status: **CURRENT CANONICAL CANDIDATE — PHASE 2**  
Updated: 2026-08-28  
Scope: 捕獲、捕獲結果、重複捕獲、BOX/TEAM境界のみ。UI実装・battle engine実装は行わない。

---

## 0. Authority / evidence precedence

本書は次を上から順に適用してCURRENTを一本化する。

1. ユーザー明示決定
2. `design/rebuild/DECISION-LOG.md` D-004 / D-010 / D-013 / **D-017**
3. exact baseline `design/baseline/FINAL-CORRECTED/source/`
4. 承認済み後続設計
5. current runtime（差分確認用。正本ではない）

主な証拠:

- `design/rebuild/DECISION-LOG.md` D-004 — 戦闘中捕獲、HP50%以下、stable capture item倍率、92% cap、最大3投、4星演出維持
- `design/rebuild/DECISION-LOG.md` D-010 — 初回自動加入、重複2択、そだちのかけら復元
- `design/rebuild/DECISION-LOG.md` D-013 — 子ども向け捕獲表示は5段階/おすすめを主、正確な%は詳細
- `design/rebuild/DECISION-LOG.md` **D-017 — child-facing捕獲道具をボール化し、1投→命中/包み込み→4星→成功/失敗の時間演出へ変更。stable domain key / 倍率 / cap / 最大投数は不変**
- `design/baseline/FINAL-CORRECTED/source/08-gameplay-state-spec.md` §9 / §10 — 重複捕獲、4星演出、子ども向け表示
- `design/baseline/FINAL-CORRECTED/source/01-catch-and-evolution-design.md` §7 — 図鑑とBOXの分離、手持ち3体
- `design/baseline/FINAL-CORRECTED/source/03-screens-catch-and-raise.md` — 捕獲結果、4星演出、BOX/図鑑表示
- `design/baseline/FINAL-CORRECTED/source/scripts/rewards.mjs` `GROWTH_SHARD` — 3個でXP+30
- `design/rebuild/audit/battle-capture-evolution-audit.md` — Phase 1.5差分・runtime drift
- `design/18-sol-pr15-fix-resolution.md` §3 — 捕獲成功Battle XPの後続仕様記録

### 後続ユーザー明示決定として本書に採用する追加証拠

2026-08-24 21:19 JST のユーザー明示判断:

- **捕獲成功でも撃破/勝利と同額のBattle XPを付与する。**
- **その戦闘で新しく捕まえた個体には、その戦闘XPを付与しない。**

2026-08-28 のiPhone実機playtestで、ユーザーは次を明示判断した。

- 子ども向けの「○○のわ」表現を廃止し、**ほしボール / ぎんボール / きんボール / にじボール**へ変更する。
- 捕獲時は1個のボールを実際に投げ、命中/包み込みの後に4星の時間演出を見せ、成功/失敗のmotionまでつなげる。
- 既存作品は操作文法の参考に留め、固有の球デザイン・配色・意匠・animationを複製しない。

これらはD-017に記録済み。表示変更はstable key / save / probability / economy migrationを要求しない。

---

## 1. Canonical summary

### 1.1 捕獲可能条件

通常の捕獲対象では、次をすべて満たしたときだけ捕獲を試行できる。

- battleが進行中である
- 敵がまだ倒れていない
- **敵HPが最大HPの50%以下**
- そのbattleでの捕獲試行が**3回未満**
- 使用するcapture itemを1個以上所持している
- stage/event側で捕獲禁止にされていない

HP50%は「捕獲を開始できる閾値」として確定する。**HPが50%よりさらに低くなるほどbase捕獲率を追加上昇させるかは別論点であり、本書では勝手に確定しない。**

### 1.2 Capture item 4種 — stable keyとchild-facing名を分離

| stable key | 子ども向け名 | 倍率 / 保証 | CURRENT |
|---|---|---:|---|
| `star` | **ほしボール** | ×1.00 | CONFIRMED |
| `silver` | **ぎんボール** | ×1.20 | CONFIRMED |
| `gold` | **きんボール** | ×1.50 | CONFIRMED |
| `rainbow` | **にじボール** | 100% | CONFIRMED |

- stable key `star / silver / gold / rainbow` はsave/domain互換のため変更しない。
- 過去設計・内部変数に `ring` / `わ` が残る場合、それは互換名でありchild-facing表示名ではない。
- 非rainbowの**最終1投成功率は92%を上限**とする。
- `rainbow` / にじボールは92% capの対象外で、**100%成功**。
- **1battle最大3投**。
- 1回の試行では選択したcapture item 1種類だけを使う。所持0は選択不可。
- 「かならずつかまる」「100%」という主張をしてよいのは、確定保証であるにじボールだけ。

### 1.3 捕獲成功のbattle結果

捕獲成功はそのbattleの成功終了であり、enemyを追加で0HPにする必要はない。

- battle result: `caught` 相当
- 捕獲試行はそこで終了
- 予約ticketの扱いは W-102 / D-007 に従い、**捕獲成功で消費確定**
- speciesは `seen=true` / `caught=true` 相当の図鑑状態になる
- 所持個体の扱いは「初回」か「重複」かで §5 のとおり分岐する

stage clear、進化item、特殊形態報酬など**捕獲以外のstage固有報酬を捕獲成功で同時付与するかはW-103では新規定義しない**。それぞれ W-102 / W-104 / W-105 の正本に従う。

---

## 2. Capture probability contract

### 2.1 CURRENTとして固定する部分

非rainbowの最終確率は、少なくとも次の境界を守る。

```text
finalChance = min(baseChance × captureItemMultiplier, 0.92)
rainbow     = 1.00
```

互換コード内で `ringMultiplier` と呼んでも意味は同じであり、D-017は計算式を変更しない。

固定するのは以下だけ。

- capture item multiplier: `1.00 / 1.20 / 1.50`
- rainbow: `1.00 guaranteed`
- non-rainbow cap: `0.92`
- eligibility: enemy HP ratio `<= 0.50`
- max attempts: `3`

### 2.2 baseChanceはCURRENT product ruleへ昇格しない

現runtime `src/game/engine.js` は次の式を持つ。

```text
base = clamp(0.12,
  0.34 + missingHpRatio * 0.62 - catchRank * 0.07,
  0.90)
```

しかし、以下はユーザー明示承認を確認できていない。

- HP50%以下の範囲で、さらにHPを削るほど成功率を上げること
- `catchRank` の具体係数
- `0.12 / 0.34 / 0.62 / 0.07 / 0.90` の具体定数

PR #5系ではcapture base chanceの最終値はplaytest調整対象として扱われている。したがって、**現runtime式を「実装済みだから」という理由でCURRENT product ruleにしない。** 実装作業で一時的なtuning defaultとして保持する場合も、canonical acceptance testでこの具体定数を固定しない。

---

## 3. Capture presentation — 1投 + four-star suspense

4つの星は単なる最終結果の4文字表示ではなく、**時間方向を持つsequence**である。D-017により、その前後を1個の球形capture deviceの投球・結果motionで接続する。

### 3.1 成功

```text
1個の選択済みボールを投げる
↓
enemyへ命中し、ボールの光で包み込む
↓
★ ☆ ☆ ☆
↓
★ ★ ☆ ☆
↓
★ ★ ★ ☆
↓
★ ★ ★ ★
↓
ボールが光って閉じる
↓
ゲット！
```

### 3.2 失敗

- 投球は1試行につき**1個・1回**として見せる。4星を4〜5個の追加投球のように見せてはいけない。
- 星は1つずつ順に点灯する。
- 4つ揃う前に失敗が確定した時点でsequenceを止める。
- ボールの光がほどけ、enemyが外へ戻る/飛び出す結果motionを見せる。
- 4回の物理的な「揺れ」を必須仕様にはしない。

### 3.3 確率と演出を分離する

- 最終1投成功率と4星presentationは別契約。
- 投球・命中・光・星・成功/失敗は**既にdomainが決めた結果を表現するpresentation**であり、UIが再抽選してはいけない。
- 内部で4段階sub-rollへ分解するかはengine実装詳細。
- どの内部方式でも、**4星演出を使ったことで最終成功率を変えてはいけない。**
- exact animation durationはproduct probability ruleではない。playtestで調整可。
- 既存作品の固有capture device、配色分割、ロゴ、効果音、固有animation timingをコピーしない。ManaEvoのdiamond/マナ意匠を使った独自球形deviceとする。

---

## 4. Child-facing probability presentation

子ども向け通常画面の主情報は**正確な%ではない**。

### 主表示

- ボール自体の色/意匠
- 5段階のつかまえやすさ
- 日本語ラベル
- どのボールがおすすめか
- 各ボールの所持数
- 残り投数

5段階ラベルはbaselineの語彙を継承する。

1. かなり つかまえにくい
2. つかまえにくい
3. ふつう
4. つかまえやすい
5. ほとんど つかまる

必要に応じて最適候補を **`おすすめ！`** と強調する。にじボールだけは保証なので `かならずつかまる` と表現してよい。

### secondary / detail

- exact percentageは詳細表示・保護者向け・補助値として表示可。
- exact %を通常の主CTAや各ボールの最も目立つ主情報にしない。
- 5段階への具体thresholdは、baseChanceがまだproduct canonical化されていないため本書では新規固定しない。

---

## 5. First catch / duplicate catch

D-010により、重複捕獲はbaselineへ戻す。

### 5.1 初回捕獲

そのspeciesをまだ1体も所持していない初回捕獲は、自動で **`なかまにする`**。

結果:

- speciesを図鑑で `caught` にする
- 捕獲した個体を**独立instanceとしてBOXへ1体追加**する
- duplicate choiceは出さない

ここでいう「自動でなかまにする」は、baselineの定義どおり**BOX個体として保持する経路を自動選択する**ことを意味する。手持ち3体への自動編成までを意味する証拠はない。

### 5.2 2匹目以降

同じspeciesをすでに所持している状態で捕獲成功した場合、次の2択を必ず出す。

#### A. `なかまにする`

- 新しい別instanceとしてBOXへ追加
- 既存個体を上書きしない
- 同種を複数所持できる
- 個体ごとに育成状態を持てる

baselineで個体の思い出として想定されている情報:

- nickname
- 捕獲日
- 使用したcapture item（child-facingでは各ボール名）
- 覚えさせた技
- 育成Lv / XP

#### B. `おうえんにかえる`

- 捕獲したduplicateの新規BOX instanceは作らない
- `そだちのかけら +1`
- 図鑑のcaught状態は維持

1回のduplicate捕獲成功から、`なかまにする` と `おうえんにかえる` の**両方の報酬を同時に得てはいけない。**

---

## 6. そだちのかけら

正本値は baseline `scripts/rewards.mjs` の `GROWTH_SHARD`。

```text
3 そだちのかけら
→ 現在の手持ちから任意の1体を選ぶ
→ 育成XP +30
```

- 1回使用ごとに3個消費。
- 対象は**現在の手持ち1体**。
- BOX全体へ一括付与しない。
- +30は既存個体の通常XP進行へ加える育成補助であり、別の隠し成長値を作らない。
- その結果のLvUP/進化可否は W-102 / W-104 の通常XP・進化contractへ接続する。
- duplicate捕獲を主要育成手段にはしない。baselineの標準学習350XP/日と比べ、3duplicate=30XPは補助報酬である。

---

## 7. Capture XP / Mana

### 7.1 Battle XP — CONFIRMED

後続ユーザー明示判断により、捕獲成功は**同stageを撃破して勝利した場合と同額のBattle XP**を付与する。

- 戦闘開始時の手持ち最大3体へ、それぞれ100%ずつ
- 戦闘中に瀕死になった個体も、開始時teamなら対象
- BOXの非参加個体は対象外
- **その戦闘で捕まえた新規個体は、その戦闘XPの対象外**
- duplicateを `なかまにする` でBOXへ追加した場合も、新規duplicate instanceにその戦闘XPを遡及付与しない
- XP具体量そのものはW-102のBattle XP正本を参照し、W-103側で別capture XP値を作らない

現runtimeの「capture successでも `battleXpForStage(stage)` をbattle開始時teamへ付与する」構造は、この点についてはCURRENTと整合する。

### 7.2 Mana — BLOCKED DECISION

現runtimeは捕獲成功時に `floor(stage.mana / 2)` を付与している。

しかし、以下を正本化するユーザー明示承認・commander decisionは確認できない。

- 捕獲成功でManaを付与するか
- 勝利と同額か
- 半額か
- 0か

したがって **`stage.mana / 2` をCURRENTへ昇格しない。** W-102との統合時に証拠回収または司令塔判断が必要。

---

## 8. BOX / Team contract

### 8.1 BOX

- BOXは**個体単位**。
- 同じspeciesを何体でも保持可能。
- `なかまにする` は新規instanceをBOXへ追加する。
- `おうえんにかえる` は新規instanceをBOXへ追加しない。

### 8.2 Dex

- Dexは**species単位**。
- `seen` と `caught` を分ける。
- 捕獲失敗でもseen記録は残せる。
- 同speciesを何体捕獲してもDex枠は1つ。

active scopeはD-003に従いNo.001〜238。No.239はbaseline referenceのみでactive Dexへ出さない。

### 8.3 Team

- Team上限は3体。
- TeamはBOX instanceへの参照で構成する。
- 捕獲によって既存team memberを暗黙に置換してはいけない。

**空きteam slotがあるとき新規捕獲個体を自動追加するか**は、baseline / user decision / commander decisionで明示確定できていない。現runtimeは空きがあれば自動追加するが、runtimeを正本根拠にはしない。§11 `BD-04` として保留する。

---

## 9. Failed capture behavior

### 確定済み

- 1battle最大3投
- 失敗してもその1投は失敗としてcountされる
- 4星が完成しなければ捕獲成功にしない

### 未確定

現current design/runtimeは:

```text
捕獲失敗
→ その行動でturn消費
→ 敵が1回行動
→ battle継続
```

としている。

しかし、UDE-002のユーザー明示決定は「HP50%以下から捕獲可能 / capture item倍率 / 92% cap / 最大3投」までで、**失敗時に敵turnを与えること自体の明示承認は回収できていない。** exact baselineは勝利後CAPTURE方式だったため、この論点をbaselineから自動継承することもできない。

よって、失敗時のaction economyと3投失敗後のbattle/encounter継続方法は §11 `BD-01` として保留する。実装済みという理由だけでCURRENTへ昇格しない。

---

## 10. Runtime / implementation delta notes

D-017後に実装が満たすべきpresentation側の差分は次。

| 項目 | CURRENT |
|---|---|
| 捕獲開始 | enemy HP <= 50% |
| 最大投数 | 3 |
| star/silver/gold/rainbow | 1.0 / 1.2 / 1.5 / 100% |
| child-facing名 | ほしボール / ぎんボール / きんボール / にじボール |
| 非rainbow cap | 92% |
| baseChance | product canonical未固定 |
| 投球visual | 1試行=1個のボールを1回投げる |
| 4星演出 | 投球/命中の後に1→2→3→4のtemporal sequence |
| 失敗visual | 4星完成前で止め、ボールからenemyを開放 |
| 子ども主表示 | 5段階/おすすめ/所持数/残り投数。exact %はdetail |
| duplicate | 2択必須 |
| shard 3→XP30 | 必須 |
| 捕獲成功Battle XP | 勝利と同額、開始時team、新規捕獲個体除外 |
| 捕獲成功Mana | 未確定 |
| 空きteam slot自動追加 | 未確定 |
| 失敗時敵turn | 未確定 |

---

## 11. BLOCKED DECISIONS

### BD-01 — 捕獲失敗時のturn / 3投失敗後のresolution

未確認:

- 失敗をplayerの1行動として敵turnへ渡すか
- 3投目失敗後もbattleを継続するか
- encounterをその時点でresolveするか

current runtimeは「敵turn→battle継続」だが、明示承認証拠なし。

### BD-02 — base capture chance structure

未確認:

- HP50%以下でさらに削るほど成功率を上げるか
- catchRankの具体寄与
- 現runtime式の具体定数

確定済みのcapture item倍率 / cap / rainbow保証だけをproduct contractにする。

### BD-03 — capture success Mana

現runtime `floor(stage.mana / 2)` の承認証拠なし。W-102統合で決める。

### BD-04 — free team slotへのauto-add

現runtimeはteamが3未満なら新規捕獲instanceを自動追加するが、baseline/後続ユーザー明示/commander decisionで確定できない。BOX追加とteam編成を混同しない。

---

## 12. Implementation acceptance for later work

W-103/Capture UI実装担当は、少なくとも以下を満たすこと。

1. enemy HP `<= 50%` でのみ通常捕獲を開始できる。
2. 1battle最大3投。
3. stable capture item性能が `1.0 / 1.2 / 1.5 / rainbow100%`。
4. child-facing名は `ほしボール / ぎんボール / きんボール / にじボール`。stable keyは変更しない。
5. non-rainbow final chanceは`<= 92%`。
6. runtimeのbaseChance具体式をproduct acceptanceへ固定しない。
7. 1試行につき1個のボールを1回投げ、命中/包み込みから4星へ連続する。
8. 4星が**時間的に**1→2→3→4と進み、成功時はボールが閉じてGETする。
9. 失敗時は4星完成を見せず、enemyがボールから戻る/飛び出す結果motionを持つ。
10. UIはdomainのcapture result/presentation frameを再利用し、独自random rerollをしない。
11. 子ども主表示は5段階/おすすめ。exact %はsecondary/detail。
12. first catchは自動`なかまにする`。
13. duplicateでは必ず`なかまにする / おうえんにかえる`の2択。
14. `なかまにする`だけが新規BOX instanceを作る。
15. `おうえんにかえる`はBOX instanceを作らず`そだちのかけら+1`。
16. shard 3個を消費してcurrent teamの選択1体へXP+30。
17. capture success Battle XPは同stage victoryと同額でbattle開始時teamへ付与する。
18. 捕まえた新規instanceへ、その捕獲戦XPを付けない。
19. BD-01〜BD-04を実装者の推測で埋めない。

---

## 13. D-029 later authority — Capture V1 TUNING-DEFAULT / deterministic child UI

**D-029 is later authority.** It supersedes only the older statements in §1.1 / §2.2 / §4 / §10 / BD-02 / §12 that say HP-depth tuning, concrete `catchRank` values, five-band thresholds, and recommendation selection are unresolved or must not be tested. BD-01 / BD-03 / BD-04 remain unresolved and are not changed by D-029.

### 13.1 V1 capture tuning

For an eligible enemy (`hpRatio <= 0.50`):

```text
eligibleDepth = clamp((0.50 - hpRatio) / 0.50, 0, 1)

baseAt50 = {
  1: 0.55,
  2: 0.42,
  3: 0.28,
  4: 0.16,
  5: 0.10
}

lowHpBonus = {
  1: 0.15,
  2: 0.13,
  3: 0.10,
  4: 0.08,
  5: 0.05
}

baseChance = baseAt50[catchRank]
           + lowHpBonus[catchRank] * eligibleDepth
```

Then keep the existing structural contract:

```text
star   = baseChance × 1.00
silver = baseChance × 1.20
gold   = baseChance × 1.50
non-rainbow final chance = min(result, 0.92)
rainbow = 1.00 guaranteed
```

The five base values and five HP bonuses are **V1 TUNING-DEFAULT** values: canonical for the Bundle B runtime/tests, but intentionally retunable by a later explicit, playtest-backed product decision. The keys, multipliers, cap, HP<=50% eligibility, 3-attempt maximum, and rainbow guarantee remain structural D-017 authority.

### 13.2 Deterministic five-band mapping

Map the current **one-throw final chance** to exactly one child label:

| chance | label |
|---:|---|
| `< 20%` | `かなり つかまえにくい` |
| `20%–<40%` | `つかまえにくい` |
| `40%–<60%` | `ふつう` |
| `60%–<80%` | `つかまえやすい` |
| `>=80%` | `ほとんど つかまる` |

Rainbow additionally uses `かならず GET` / equivalent guaranteed wording. No non-rainbow ball may be described as guaranteed.

### 13.3 Deterministic recommendation

Recommendation considers **owned inventory only**.

1. Among owned non-rainbow balls, select the weakest tier whose current one-throw chance is `>=70%`.
2. If none reaches 70%, select the owned non-rainbow ball with the highest current chance.
3. Rainbow is never automatic recommendation in an ordinary encounter.
4. Rainbow may be recommended only when the encounter explicitly opts into a rainbow-recommendation contract and the player owns one.
5. If no usable ball is owned, no recommendation is emitted.

There is no implementation-defined `materially improves` branch.

### 13.4 Economy boundary

Existing canonical learning sources remain:

- star: daily / additional-learning reward paths owned by W-101/learning reward authority;
- silver: normal MASTER;
- gold: hard MASTER.

**Rainbow allocation/source remains unresolved and is outside Bundle B.** Runtime implementation must not invent a rainbow acquisition source merely to support the new probability UI.

### 13.5 Acceptance delta

Later implementation/tests must now lock:

- exact rank1..5 base values at HP50%;
- exact HP0 values after the low-HP bonus;
- monotonic linear interpolation between HP50% and HP0;
- existing 1.0 / 1.2 / 1.5 multipliers, 92% cap, rainbow 100%;
- max 3 attempts including pre/post-KO continuity;
- deterministic five bands and owned-inventory recommendation;
- rank1/rank2 early-play sanity and representative expected resource burn;
- no new rainbow supply source.

Historical §2.2 / BD-02 text remains in this document as provenance but is **superseded by D-029**.