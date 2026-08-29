# ManaEvo 学習 × ゲーム経済 正本

更新日: 2026-08-29
状態: **DESIGN REVIEW REQUIRED / IMPLEMENTATION NOT YET AUTHORIZED**

この文書は、ManaEvoの「学習 → 報酬 → チケット → バトル → 捕獲 → XP → 育成 → ワールド進行」を1つの経済圏として扱う上位設計正本である。

戦闘の個別数値・モンスター能力・進化条件等は既存の各設計書を参照するが、**学習行動とゲーム報酬の関係、報酬最適化時の子どもの行動、study-first制約、anti-farming、ticket economy、Battle XP pacingについて競合がある場合は本書を優先する。**

---

## 1. 最上位プロダクト原則

ManaEvoはRPG付き学習アプリであり、RPGに学習が付属するアプリではない。

最上位不変条件は次の通り。

> **GAME REWARD MAXIMIZATION SHOULD LEAD TO HIGH-VALUE LEARNING BEHAVIOR.**
>
> 子どもが「できるだけ早くゲームをしたい」と合理的に行動しても、その最短ルートが、適正難度・苦手克服・新しい問題・適切な復習・継続学習になること。

したがって、以下がゲームへの最適経路になってはいけない。

- 簡単すぎる問題の大量周回
- 習得済み問題・同一skill・同一conceptの短期反復
- 得意教科だけの固定周回
- わざと誤答して難易度を下げる
- 高速タップのみで報酬を得る
- 画面放置で学習時間だけ稼ぐ
- 苦手問題を避け続ける
- free / extra / okawariの境界を利用する
- reload / replay / profile switchingで報酬を重複させる
- 格下敵・capture経路・弱bench等を利用してXP効率を上げる

禁止は最小限にし、望ましい行動を自然に選びたくなる**選択アーキテクチャ**を優先する。

---

## 2. 行動設計の原則

### 2.1 外発的動機は入口として使う

ゲームをしたいという欲求は学習開始のきっかけとして使ってよい。ただし、細かい倍率を子どもに見せて「勉強=報酬稼ぎ作業」にしない。

内部では精密に価値を計算しても、子ども向けには以下のような意味づけを優先する。

- 「このもんだいは もうバッチリ！」
- 「ちょうどいい もんだいに ちょうせん！」
- 「まちがえたところを もういちど！」
- 「きのうの もんだいを おぼえているかな？」
- 「あと少しで ぼうけんできるよ！」

### 2.2 失敗を損にしすぎない

正解だけに価値を置くと、苦手問題を避けることが合理的になる。

以下は教育価値の高い行動として評価対象にする。

```text
誤答
→ 解説・ヒント
→ 別形式または時間を置いた再挑戦
→ 自力正解
```

一方、同じ答えを即座に押し直すだけのretryは高価値にしない。

### 2.3 高速正解をcheat扱いしない

高速正解は本当の習熟かもしれない。

高速 + 高正答が続く場合は、報酬停止ではなく、

- そのskillを「習得済み寄り」と評価
- 次の難度へ進める
- 同じ簡単問題のLearning Valueを下げる

ことで処理する。

---

## 3. CURRENTとの差分と設計判断

Battle V6時点のCURRENTは、daily core完了で3 tickets、additional extraは5 correctで1 ticketというstudy-first pacingを採用している。

これは時間配分の方向性としては正しいが、**正解数のみでは学習価値を保証できない。**

したがって、additional battle ticketの正式な将来仕様は、単純な `5 correct` ではなく、以下の2条件を満たす方式を推奨正本とする。

```text
A. qualifying Learning Value >= threshold
AND
B. effective active study time >= minimum
```

実装値はレビュー・simulation後に確定する。初期提案値は以下。

```text
Learning Value threshold: 5.0
minimum effective study time: 20 sec / ticket
```

CURRENT productionはこの設計の完全実装前であり、実装変更は別PRで行う。

---

## 4. Learning Value

### 4.1 基本式

1問ごとのLearning Valueは概念的に次で表す。

```text
LV = base
   × personalDifficultyFit
   × masteryModifier
   × noveltyModifier
   × repetitionModifier
   × spacingModifier
   + recoveryBonus
   + challengeBonus
```

ただし、実装では既存skill/difficulty/SRS情報から可能な限り単純に導出し、不必要な新状態を増やさない。

### 4.2 初期推奨レンジ

| 状態 | Learning Value目安 |
|---|---:|
| 新規・本人に適正 | 1.00 |
| 少し難しい・初回自力正解 | 1.15〜1.25 |
| 苦手を解説後に別形式で克服 | 1.15〜1.30 |
| 適切なspaced review | 0.80〜1.00 |
| 習得済み復習 | 0.40〜0.60 |
| 直近で同skillを反復 | 0.20〜0.50 |
| 同一question短期再答 | 0〜0.20 |
| 明らかに簡単すぎる問題 | 0.20〜0.40 |

難問bonusは最大でも概ね1.25程度を基本とし、難しい問題を無理に選ぶ方が最適にならないようにする。

### 4.3 本人基準

問題の一般的難易度ではなく、**その子にとっての難易度**を重視する。

例:

- 一般には簡単な問題でも最近失敗している → 高価値
- 一般には難しい問題でも本人が毎回即答する → 価値を徐々に下げて次へ

既存 `skill.level / recent / correct / attempts / streak / miss` を主要情報として利用する。

---

## 5. 難易度適応とintentional failure対策

CURRENT difficulty engineは、概ね直近4問中3正解で難易度を上げ、直近5問中3ミスで下げる。

この仕組みは適応学習として維持する。ただしゲーム報酬と接続すると、

```text
難しくなる
→ わざと間違える
→ 難易度を下げる
→ 簡単問題で報酬farm
```

が理論上成立する。

対策原則:

1. 難易度を下げること自体は罰しない。
2. demotion直後の既知easy問題はLearning Valueを一時的に低くする。
3. 苦手克服経路は逆に高価値にする。
4. intentional failure検知を単独の罰則トリガーにはしない。

子どもが本当に苦戦しているケースを誤罰しないことを優先する。

---

## 6. 反復・教科偏重への対策

### 6.1 同一skill diminishing returns

短時間に同じskill / conceptへ偏るほどLearning Valueを段階的に下げる。

例:

```text
1st: 1.00
2nd: 0.90
3rd: 0.70
4th: 0.50
5th+: 0.30
```

ただし、翌日またはSRS上の適切なreview interval到達後は回復させる。

### 6.2 spaced repetitionは価値を下げすぎない

「前に正解した問題だから簡単」と「忘却曲線上ちょうど復習すべき問題」は区別する。

SRS上dueである問題は、習得済みでも0.8〜1.0程度を許容する。

### 6.3 教科多様性

得意教科だけを無限周回することは最適にしない。ただし、特定教科の集中学習を禁止しない。

初期案:

- 同一分野だけでもticket progressは可能
- 複数分野を含む場合に小さなdiversity bonusを与える、または同一分野のdiminishing returnsで自然に分散させる

ハードな「2教科必須」は、学習目的によっては邪魔になるため初期実装では避ける。

---

## 7. 有効学習時間

### 7.1 minimum time

Learning Valueだけでは、極端な高速処理でゲーム時間が学習時間を上回る可能性がある。

初期提案:

```text
1 ticketあたり effective active study time >= 20 sec
```

### 7.2 idle farming対策

経過時間をそのまま加算しない。

1問あたりのeffective timeは下限・上限を持つ。

初期提案例:

```text
counted time per answer = clamp(3 sec, elapsed, 20 sec)
```

60秒放置しても20秒しか加算しない。

極端な高速正解は0秒扱いにせず、mastery signalとして次難度へ誘導する。

---

## 8. Ticket Economy

### 8.1 Daily core

CURRENT基準:

- 約20問
- 3 tickets
- learning telemetry avg ≈ 7.8 sec/question
- battle telemetry avg ≈ 15.5 sec/battle

概算:

```text
20問 ≈ 156 sec learning
3戦 ≈ 46.5 sec game
learning/game ≈ 3.35
```

この比率はstudy-firstとして妥当。

Daily coreは「毎日の学習習慣を形成する」目的が強いため、additionalより厳密なLearning Value gateをすぐ導入しない。

ただし、adaptive difficultyによってcore自体の質を担保すること。

### 8.2 Additional study

追加ゲーム権は、最もreward hackingされやすい。

将来正本:

```text
qualifying Learning Value >= 5.0
AND effective study time >= 20 sec
→ 1 battle ticket
```

free / okawari / extraの扱いは明示分離する。

- `free`: battle ticket progressへ加算しない
- `extra`: qualifying progress対象
- `okawari`: product intentを確認し、extraと同一にするか別目的にするか設計レビューで確定

**共通counterを介してfreeが間接的にticket thresholdへ寄与する設計は禁止する。**

### 8.3 Ticket settlement

1戦実際に遊んだら勝敗に関係なく1枚消費する。

- win: consume
- loss: consume
- abandon: consume
- capture success/failureを含むplayed battle: consume
- stale replay / duplicate settlement: consumeしない

battle startで予約したexact lotをsettleし、別FEFO lotを誤って消費しない。

### 8.4 TTLと貯め込み

7日TTLは継続する。

ただし、数日学習して1日ゲームだけ大量に遊ぶ行動が実測でstudy-firstを崩す場合は、TTL短縮より先にsoft daily spend capを検討する。

初期検討レンジ:

```text
6〜8 battles/day soft cap
```

現時点では即導入せず、telemetryで判断する。

---

## 9. Battle / XP Economy

### 9.1 共通XP settlement

Battle XPは全勝利経路で共通のcanonical pipelineを通す。

```text
base battle XP
→ global battle multiplier
→ teammate multiplier
→ level-gap multiplier
→ gainXp / evolution
```

KO / pre-KO capture / duplicate capture等で別ルートを作らない。

post-KO captureはKO時点でBattle XPがsettled済みのため追加XP=0。

### 9.2 Lv差補正

CURRENT Battle V6方向性を維持する。

```text
player - enemy >= +6  → 0.50
>= +10 → 0.25
>= +15 → 0.15
enemy +3以上 → 1.15
enemy +5以上 → 1.25
```

目的:

- 旧エリアは「強くなった実感」を得る場所
- 旧エリアを最効率XP farmにはしない
- 少し格上へ挑む価値を残す

### 9.3 弱bench exploit

normal enemy referenceはactive単独powerを下回ってはいけない。

推奨原則:

```text
reference = max(
  activePower,
  activePower * 0.70 + strongestSupportPower * 0.30
)
```

これにより、弱い控えでenemyを弱体化できず、強い控えがいる場合は一定程度反映できる。

### 9.4 新しい低Lv monster育成

低Lvmonsterをactiveにした場合までbox最強個体へ完全追従させると、新規捕獲個体を育成できない。

したがって通常戦はactive中心のsoft scalingを維持する。

「高Lv active + 弱bench exploitを防ぐこと」と「低Lv activeを育成できること」は別問題として両立させる。

---

## 10. Capture Economy

捕獲はXPを増やすためではなく、collection / team progressionの価値を持つ。

不変条件:

- KOとpre-KO captureで同じBattle XP policy
- post-KO captureで二重Battle XPなし
- boss / captureDisabled不可
- duplicate settlementはidempotent
- stale battle replayでitemやstateを再消費しない

captureがKOよりXP上の最適戦略になってはいけない。

---

## 11. Team育成

1体だけを育てることが完全な最適解にならないようにするが、team全員へ高XPを与えて進行を高速化しすぎない。

CURRENTのactive優遇 + teammate低倍率という方向性を維持する。

将来的に必要なら、以下の「小さな」incentiveを検討する。

- 新しいmonsterをactive使用した初回bonus
- 異なるtypeを活用した探索bonus
- 新規進化・新規図鑑のcollection reward

Battle XPそのものを大きく増やす方法は優先しない。

---

## 12. World progression

CURRENT推奨帯:

```text
Area1 Lv5-16
Area2 Lv14-27
Area3 Lv24-40
Area4 Lv37-58
```

XP curve:

```text
totalXpForLevel(level) = round(6 * (level - 1)^1.9)
```

world bandは固定日数ではなく、standard learner / heavy learner両方で破綻しない範囲を保つ。

旧エリアで勝ちやすくなることは成長実感として許容するが、XP効率はlevel-gap modifierで下げる。

---

## 13. Player Archetypes / 必須simulation

balance変更PRでは最低限以下を7日・30日simulationする。

1. Standard learner — 推奨問題を普通に解く
2. Reward optimizer — ゲーム最短到達を狙う
3. Easy-question farmer — 一番簡単な問題を探す
4. Strong-subject farmer — 得意教科だけ選ぶ
5. Rapid answerer — 高速正解
6. Intentional demoter — わざと誤答してdifficultyを下げようとする
7. Struggling learner — 誤答が多い
8. Recovery learner — 誤答→解説→再挑戦を行う
9. Heavy learner — additionalを大量に行う
10. Ticket saver — 数日貯めてまとめてbattle
11. Old-area farmer — 格下周回
12. Capture farmer — capture中心
13. Carry + weak bench
14. New-monster trainer
15. Slightly-harder challenger

比較項目:

- learning minutes/day
- effective Learning Value/day
- tickets/day
- battles/day
- game minutes/day
- learning/game ratio
- XP/day
- level velocity
- educational quality
- exploitability

**教育的に望ましくないarchetypeが、望ましいarchetypeより tickets/hour・game access/hour・XP/hourで有利ならFAIL。**

---

## 14. Guardrail Metrics

将来のtelemetry / QAで最低限監視する。

| Metric | 初期target / alert案 |
|---|---|
| learning minutes / game minutes | median >= 2.0, alert < 1.5 |
| daily core learning/game | target >= 3.0 |
| effective Learning Value / ticket | >= 5.0 |
| effective study time / additional ticket | >= 20 sec |
| mastered/easy question share in ticket progress | alert > 50% |
| same-skill short-repeat share | alert > 40% |
| challenge / appropriate difficulty share | monitor 30〜70% |
| recovery-after-error rate | trend monitor;低下を警戒 |
| subject concentration | 1分野>80%が長期継続なら警戒 |
| tickets earned/day | distribution監視 |
| tickets spent/day | p95急増を監視 |
| stored ticket age | 7日TTL内の偏り監視 |
| battle XP/day | level velocityとセットで監視 |
| old-area XP share | alert > 40% |
| capture/KO XP ratio | 同条件で1.0を逸脱したらFAIL |

数値は初期仮値。production telemetryが十分集まったら、PRで根拠付き調整する。

---

## 15. Child-facing UX

内部のLearning Value倍率をそのまま表示しない。

表示するのは、次の学習行動を肯定的に導くcueとする。

- mastery: 「もうバッチリ！ つぎへいこう」
- challenge: 「ちょっとむずかしいのに ちょうせん！」
- spaced review: 「きのうの もんだいを おぼえているかな？」
- recovery: 「まちがえたところを もういちどできた！」

子どもが内部formulaを知っても、良質な学習が最適行動になることを設計側で保証する。

---

## 16. Behavioral / Cognitive Guardrails

### operant conditioning

ゲーム報酬は開始のきっかけにするが、正解1回ごとの強い即時ゲーム報酬にはしない。

### present bias / goal-gradient

「あと少し」を可視化して学習継続を助ける。ただし簡単問題farmが近道にならないようLearning Valueで制御する。

### overjustification

倍率・効率・時給的な表示を避け、成長・発見・克服を前面に出す。

### desirable difficulty

成功率100%の簡単問題だけでは最大報酬にならない。少し考える適正難度を最も効率的にする。

### retrieval practice / spacing

適切な間隔での思い出しはLearning Valueを高く保つ。

### interleaving

同一skill短期反復の価値を徐々に下げ、自然な分散を促す。

### growth mindset

誤答を罰ではなく、解説後の克服機会として扱う。

### learned helplessness防止

難問bonusを大きくしすぎず、苦戦児が常にゲーム報酬で不利にならないようにする。

---

## 17. 実装前レビュー項目

この文書を実装へ移す前に、独立レビューで以下を確定する。

1. Learning Valueの実際の係数
2. minimum effective time 20 secの妥当性
3. okawariのticket progress扱い
4. demotion直後のvalue補正
5. same-skill diminishing return curve
6. SRS due問題のvalue
7. daily battle soft capの要否
8. telemetry取得可能性とprivacy
9. 7日/30日simulation
10. CURRENT saveとの互換性

---

## 18. 変更禁止 / scope safety

本設計を実装する際も以下を守る。

- 既存production monster levelを自動downgradeしない
- hidden migrationでレベルを下げない
- Monster Art / art registryをbalance都合で変更しない
- Cloud conflict UXを子ども画面へ戻さない
- profile separationを壊さない
- free studyをbattle ticket farmへ変えない
- Kids Quest学習runtimeをManaEvo都合で単純化しない

---

## 19. Acceptance principle

将来のbalance PRは「テストが通る」だけでは不十分。

次をすべて満たすこと。

1. standard learnerが自然に進める
2. struggling learnerが過度に不利にならない
3. high performerはより難しい問題へ自然に進む
4. reward optimizerの最短ルートが教育的に良質
5. easy-question / repetition / intentional-failure farmingが最適戦略でない
6. 学習時間がゲーム時間を継続的に上回る
7. Battle XPとcaptureが学習economyを迂回しない
8. save/reload/profile境界で報酬が増殖しない

この8条件をManaEvo Learning × Game Economyの正式な受入原則とする。
