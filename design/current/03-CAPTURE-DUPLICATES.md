# ManaEvo CURRENT — Capture / Duplicates

Work Item: W-103  
Status: **CURRENT — D-017 + D-022 overrides applied**  
Updated: 2026-08-29  
Scope: 捕獲、捕獲結果、重複捕獲、BOX/TEAM境界。UI実装・battle engine実装は別owner。

> **重要:** 本文のin-battle HP<=50%、capture item、4-star presentation、duplicate/shard契約は維持する。Battle V6（D-022）により、ordinary capturable wildには**KO後の追加capture opportunity**が後続追加された。末尾§13を必ず併読する。

---

## 0. Authority / evidence precedence

本書は次を上から順に適用してCURRENTを一本化する。

1. ユーザー明示決定
2. `design/rebuild/DECISION-LOG.md` D-004 / D-010 / D-013 / D-017 / D-022
3. exact baseline `design/baseline/FINAL-CORRECTED/source/`
4. 承認済み後続設計
5. current runtime（差分確認用。正本ではない）

主な証拠:

- D-004 — 戦闘中捕獲、HP50%以下、stable capture item倍率、92% cap、最大3投、4星演出維持
- D-010 — 初回自動加入、重複2択、そだちのかけら復元
- D-013 — 子ども向け捕獲表示は5段階/おすすめを主、正確な%は詳細
- D-017 — child-facing捕獲道具をボール化し、1投→命中/包み込み→4星→成功/失敗の時間演出へ変更。stable domain key / 倍率 / cap / 最大投数は不変
- D-022 — Battle V6 ordinary wild post-KO capture opportunity / no double Battle XP
- exact baseline gameplay/catch/raise specs and rewards script
- Phase 1.5 battle/capture/evolution audit

### 後続ユーザー明示決定として本書に採用する追加証拠

2026-08-24 21:19 JST:

- **捕獲成功でも撃破/勝利と同額のBattle XPを付与する。**
- **その戦闘で新しく捕まえた個体には、その戦闘XPを付与しない。**

2026-08-28 iPhone playtest:

- 子ども向け「○○のわ」を **ほしボール / ぎんボール / きんボール / にじボール**へ変更。
- 1個のボールを実際に投げ、命中/包み込み→4星→成功/失敗motion。
- 既存作品はinteraction grammarのみ参考、固有球デザイン/配色/animationを複製しない。

2026-08-29 Battle V6:

- ordinary capturable wildをKOした場合も、battle resolution後にcapture opportunityを残す。
- KO時にsettleしたBattle XPをpost-KO captureで再付与しない。

---

## 1. Canonical summary

### 1.1 通常のin-battle捕獲可能条件

通常の捕獲対象では、次をすべて満たしたときin-battle captureを試行できる。

- battleが進行中
- 敵がまだ倒れていない
- **敵HPが最大HPの50%以下**
- そのbattleでの捕獲試行が**3回未満**
- 使用するcapture itemを1個以上所持
- stage/event側でcapture禁止でない

HP50%はin-battle捕獲を開始できる閾値。**HPがさらに低いほどbase捕獲率を追加上昇させるかは別論点であり、勝手にproduct rule化しない。**

Battle V6 post-KO windowは§13で追加定義する。

### 1.2 Capture item 4種 — stable keyとchild-facing名を分離

| stable key | 子ども向け名 | 倍率 / 保証 | CURRENT |
|---|---|---:|---|
| `star` | **ほしボール** | ×1.00 | CONFIRMED |
| `silver` | **ぎんボール** | ×1.20 | CONFIRMED |
| `gold` | **きんボール** | ×1.50 | CONFIRMED |
| `rainbow` | **にじボール** | 100% | CONFIRMED |

- stable key `star / silver / gold / rainbow` はsave/domain互換のため変更しない。
- 過去設計・内部変数に `ring` / `わ` が残る場合、それは互換名でありchild-facing表示名ではない。
- 非rainbowの**最終1投成功率は92%を上限**。
- `rainbow` / にじボールは92% cap対象外で**100%成功**。
- **1battle最大3投**。
- 1試行では選択したcapture item 1種類だけを使う。所持0は選択不可。
- 「かならずつかまる」「100%」という主張はにじボールだけ。

### 1.3 In-battle捕獲成功のbattle結果

敵が生存中の捕獲成功はそのbattleの成功終了であり、enemyを追加で0HPにする必要はない。

- battle result: `caught` 相当
- 捕獲試行はそこで終了
- reserved ticketは W-102 / D-022 に従い消費確定
- speciesは `seen=true` / `caught=true` 相当
- 所持個体は初回/duplicateで§5分岐

stage clear、進化item、特殊形態報酬など捕獲以外のstage固有報酬は、W-102/W-104/W-105のowner contractに従う。

---

## 2. Capture probability contract

### 2.1 CURRENTとして固定する部分

非rainbow:

```text
finalChance = min(baseChance × captureItemMultiplier, 0.92)
```

rainbow:

```text
finalChance = 1.00
```

固定するのは:

- multiplier `1.00 / 1.20 / 1.50`
- rainbow guarantee
- non-rainbow cap `0.92`
- in-battle eligibility enemy HP ratio `<= 0.50`
- max attempts `3`

### 2.2 baseChanceはCURRENT product ruleへ昇格しない

現runtime `src/game/engine.js` は具体式を持つが、HP50%以下でさらに削る効果、catchRank係数、具体定数は明示承認を確認できていない。

したがってruntime式を「実装済みだから」という理由でproduct canonicalにしない。playtest tuningとして維持する場合も、canonical acceptanceで未承認定数を永久固定しない。

---

## 3. Capture presentation — 1投 + four-star suspense

4つの星は最終結果4文字ではなく**時間方向を持つsequence**。D-017により、その前後を1個のManaEvo-original ballの投球・結果motionで接続する。

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

- 1試行=**1個・1回**の投球。
- 星は順に点灯。
- 4つ揃う前に失敗確定時点で停止。
- ボールの光がほどけenemyが戻る/飛び出す結果motion。
- 4回の物理的「揺れ」を必須にしない。

### 3.3 確率と演出を分離

- 最終1投成功率と4星presentationは別契約。
- UIはdomainが決めた結果を表現し、**再抽選しない**。
- 4星演出によって最終成功率を変えない。
- exact animation durationはplaytest調整可。
- 既存作品の固有capture device/配色分割/ロゴ/効果音/固有timingをコピーしない。

---

## 4. Child-facing probability presentation

主表示:

- ボールの色/意匠
- 5段階つかまえやすさ
- 日本語ラベル
- おすすめ
- 所持数
- 残り投数

5段階語彙:

1. かなり つかまえにくい
2. つかまえにくい
3. ふつう
4. つかまえやすい
5. ほとんど つかまる

必要に応じて`おすすめ！`。にじボールだけは`かならずつかまる`と表現可。

Exact percentageはsecondary/detail。exact %を通常の主CTAにしない。

---

## 5. First catch / duplicate catch

D-010によりbaselineへ戻す。

### 5.1 初回捕獲

そのspeciesをまだ1体も所持していない初回捕獲は自動で`なかまにする`。

- dex caught
- 独立instanceをBOXへ1体追加
- duplicate choiceなし

「自動でなかま」はBOX ownership経路の自動選択。team 3枠への自動編成までを意味しない。

### 5.2 2匹目以降

必ず2択:

#### A. `なかまにする`

- 新しい別instanceとしてBOXへ追加
- 既存個体を上書きしない
- 同種複数所持可
- 個体ごとに育成状態

個体の思い出として想定される情報:

- nickname
- 捕獲日
- 使用したcapture item
- 覚えさせた技
- 育成Lv / XP

#### B. `おうえんにかえる`

- 新規BOX instanceを作らない
- `そだちのかけら +1`
- dex caught維持

1回のduplicate捕獲から両方を同時取得してはいけない。

---

## 6. そだちのかけら

```text
3 そだちのかけら
→ 現在の手持ちから任意の1体
→ 育成XP +30
```

- 1回3個消費
- current teamの選択1体
- BOX全体へ一括付与しない
- +30は通常XP進行へ接続
- resulting LvUP/evolutionはW-102/W-104へ
- duplicate captureは主要育成手段ではなく補助

---

## 7. Capture XP / Mana

### 7.1 In-battle capture Battle XP — CONFIRMED

後続ユーザー明示判断により、生存中のcapture successは**同stageを撃破して勝利した場合と同額のBattle XP**を付与する。

- XP settlement対象/配分/具体量はW-102の**現在のD-020/D-022 XP contract**を参照
- **その戦闘で捕まえた新規個体は、その戦闘XPの対象外**
- duplicate new instanceにも遡及付与しない
- W-103側で別capture XP値を作らない

旧「team全員100%ずつ」の記述はD-020 Evolution pacing V5で置換済み。現在のteam XP distributionはW-102を正とする。

### 7.2 Post-KO capture Battle XP

§13を正とする。KO時に既にsettleしたBattle XPをcapture successで**再付与しない**。

### 7.3 Mana — BLOCKED DECISION

現runtimeのcapture success Mana具体式を正本化する明示承認は未確認。

**BLOCKED DECISION:** capture success Manaの正式付与式。既存runtime値をproduct CURRENTとして引用しない。

---

## 8. BOX / Team contract

### 8.1 BOX

- BOXは個体単位
- 同species複数保持可
- `なかまにする`だけ新規instance追加
- `おうえんにかえる`は追加しない

### 8.2 Dex

- species単位
- `seen` / `caught`を分ける
- duplicateでもDex枠は1つ
- active scope m001〜m238、m239除外

### 8.3 Team

- Team上限3
- BOX instance参照
- 捕獲で既存team memberを暗黙置換しない

**空きteam slotがあるとき新規捕獲個体を自動追加するか**は明示確定できていないためBD-04のまま。

---

## 9. Failed in-battle capture behavior

### 確定済み

- 1battle最大3投
- 失敗した1投もattempt count
- 4星完成しなければ成功にしない

### 未確定

D-022はpost-KO opportunityを追加したが、**生存中のcapture失敗時にenemy turnを必ず与えるかという元BD-01自体を新規明示決定してはいない**。

current runtimeがそう動くことだけを理由にCURRENTへ昇格しない。

---

## 10. Runtime / implementation delta notes

| 項目 | CURRENT |
|---|---|
| in-battle捕獲開始 | enemy HP <= 50% |
| post-KO opportunity | ordinary capturable wildのみ、§13 |
| 最大投数 | 3 |
| star/silver/gold/rainbow | 1.0 / 1.2 / 1.5 / 100% |
| child-facing名 | ほし/ぎん/きん/にじボール |
| non-rainbow cap | 92% |
| baseChance | product canonical未固定 |
| 投球visual | 1試行=1個を1回 |
| 4星 | 1→2→3→4 temporal |
| 失敗visual | 4星完成前で止める |
| child主表示 | 5段階/おすすめ/所持数/残り投数。exact % detail |
| duplicate | 2択必須 |
| shard | 3→XP30 |
| in-battle capture XP | W-102 current victory settlement相当、新規capture個体除外 |
| post-KO capture XP | double grant禁止 |
| capture Mana | 未確定 |
| empty team slot auto-add | 未確定 |
| in-battle失敗時enemy turn | 未確定 |

---

## 11. BLOCKED DECISIONS

### BD-01 — 生存中capture失敗時のturn / 3投失敗後resolution

未確認:

- 失敗をplayer1行動としてenemy turnへ渡すか
- 3投目失敗後もbattle継続か
- encounter resolveか

### BD-02 — base capture chance structure

未確認:

- HP50%以下でさらに削るほど成功率を上げるか
- catchRank具体寄与
- runtime式具体定数

### BD-03 — capture success Mana

正式式未確認。

### BD-04 — free team slot auto-add

runtime挙動だけでは正本化しない。

---

## 12. Implementation acceptance

少なくとも:

1. in-battle capture enemy HP `<=50%`。
2. post-KO captureは§13。
3. 1battle最大3投。
4. stable item `1.0/1.2/1.5/rainbow100%`。
5. child-facing balls、stable key不変。
6. non-rainbow <=92%。
7. baseChance具体式を固定しない。
8. 1試行1投。
9. temporal 4 stars、failedで4完成禁止。
10. UI reroll禁止。
11. exact % secondary。
12. first catch auto-box instance。
13. duplicate 2択。
14. shard 3→selected current-team monster XP+30。
15. in-battle capture XPはW-102 current XP settlementに従い、新規捕獲instance除外。
16. post-KO captureはno double XP。
17. BD-01〜04を推測実装しない。

---

## 13. 2026-08-29 Battle V6 post-KO capture override — D-022

### 13.1 追加window

ordinary capturable wildを攻撃でKOした場合、in-battle HP<=50% captureを使わなかった/成功しなかったからといって、そのwildを即座に失うだけにはしない。

KO/勝利settlement後に**post-KO capture opportunity**を持てる。

対象条件:

- ordinary wild encounter
- `captureDisabled != true`
- boss / evolution trial / Giga/Burst challenge等ではない
- enemy HPが0以下でbattle resultがwinとしてsettle済み
- total capture attempts < 3
- usable capture itemあり

### 13.2 これは旧post-win-only方式への巻き戻しではない

- 生存中のHP<=50% in-battle captureは引き続き存在する。
- post-KOは**追加のforgiving opportunity**。
- childは「削って捕まえる」か「倒してから最後に捕獲を試す」両方の経路を持てるが、boss等は例外。

### 13.3 XP exactly once

KO時点でBattle XPがsettle済みの場合:

- post-KO capture successでBattle XPをもう一度付与しない。
- new captured instanceへKO Battle XPをretroactive付与しない。
- duplicate settlementでもXP double grantしない。

### 13.4 Ticket settlement

battle ticketはW-102 D-022のplayed-battle settlementに従う。

KO/win時点ですでにreserved ticketはcommit対象。post-KO captureは**同じbattleの追加resolution**であり、新しいticketをreserveしない。

### 13.5 Attempt/item semantics

- in-battleで既に投げた回数と同じbattle attempt counterを使う。
- battle全体で最大3投を超えない。
- 1 post-KO attemptにつき選択item1個を消費。
- probability/item multiplier/capは§2と同じ。KO自体を未承認の追加chance bonusにしない。

### 13.6 Presentation gate

子どもがattackした直後に、KO animationより先にcapture UIへ飛ばさない。

```text
player action
→ hit / HP change
→ KO / win presentation
→ turn presentation complete
→ post-KO capture CTA becomes actionable
```

Capture animation自体は§3の1投+4-star contract。

### 13.7 Post-KO failure

KO済みenemyはpost-KO capture failure後に攻撃してこない。

- attempts/itemsが残れば同じpost-KO opportunity内で次を選べるimplementationは許容する。
- max 3 total attemptsを超えない。
- 捕獲を終える/使い切る場合、battleは既にwonとして完了している。

### 13.8 Acceptance

- boss/captureDisabledへpost-KO CTAを出さない。
- win settlement/Battle XP exactly once。
- post-KO capture success no double XP。
- captured instance XP=そのbattle分を遡及付与しない。
- same battle ticketを二重reserveしない。
- in-battle + post-KO combined attempts <=3。
- KO/turn presentation完了前にpost-KO CTAをactionableにしない。
