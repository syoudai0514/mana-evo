# ManaEvo 詳細バランス設計 — SOLレビュー反映版

更新日: 2026-08-24
対象: PR #15 `chatgpt/monster-master-238`
状態: **SOL FIX APPLIED / runtime実装アンロック候補**

本書は PR #15 の実装前詳細設計正本。`design/17-sol-pr15-review-amendment.md` の指摘を反映済みで、`design/18-sol-pr15-fix-resolution.md` の再判定と組み合わせて使用する。

現行active scopeは **No.001〜238**。No.239 は元資料保全のみでruntimeへ入れない。

## 0. 正本データ構成

238体成長master:

- `design/13a-monster-growth-area1.csv`
- `design/13b-monster-growth-area2-part1.csv`
- `design/13b-monster-growth-area2-part2.csv`
- `design/13c-monster-growth-area3-part1.csv`
- `design/13c-monster-growth-area3-part2.csv`
- `design/13d-monster-growth-area4-part1.csv`
- `design/13d-monster-growth-area4-part2.csv`

合計238行。

155進化比較master:

- `design/14a-evolution-balance-area1.csv`
- `design/14b-evolution-balance-area2.csv`
- `design/14c-evolution-balance-area3.csv`
- `design/14d-evolution-balance-area4.csv`

合計155遷移 = level123 / stone21 / held_item_levelup11。

その他:

- 特殊形態: `design/09-special-forms-master.md`
- バトル確定差分: `design/11-battle-character-boss-review.md`
- レビュー追補: `design/17-sol-pr15-review-amendment.md`
- 修正完了判定: `design/18-sol-pr15-fix-resolution.md`

---

## 1. 238体master必須項目

```text
id: m001 ... m238
no
familyId
name
area
type
stage / maxStage
catchRarity
powerTier
sourceRole
combatRoleV2
base.hp / attack / defense / speed
moves[4]
evolution
encounterPool
wildCatchable
catchRank
gigaEligible
burstEligible
imageStatus / imagePath
```

### 1.1 catchRarityとpowerTier

- `catchRarity`: 捕獲難度だけ。
- `powerTier`: BST予算だけ。
- 別フィールドを維持する。
- v1 seedは `powerTierV1 = source catchRarity` で開始してよい。
- No.018 / 021、No.235〜237はsimulation監視。異常が出た場合だけpowerTierを独立調整する。

---

## 2. Lv・能力・BST

Lv上限100。個体値・努力値・性格などの隠し補正は初期版へ入れない。同種・同Lvなら同じ能力。

```text
HP       = floor(baseHP      * Lv / 50) + Lv + 10
こうげき = floor(baseAttack  * Lv / 50) + 5
ぼうぎょ = floor(baseDefense * Lv / 50) + 5
すばやさ = floor(baseSpeed   * Lv / 50) + 5
```

基準BST:

| 形 | BST |
|---|---:|
| 3段階 第1形 | 200 |
| 3段階 中間 | 270 |
| 2段階 第1形 | 200 |
| 2/3段階 最終 | 340 |
| 単体完成形 | 380 |

powerTier倍率:

| tier | 倍率 |
|---|---:|
| common | 0.95 |
| rare | 1.00 |
| epic | 1.08 |
| legend | 1.20 |

`targetBST = round(baseBST * multiplier)`。

### 2.1 combatRoleV2

| role | HP | ATK | DEF | SPD |
|---|---:|---:|---:|---:|
| balanced | 27 | 27 | 24 | 22 |
| attacker | 24 | 38 | 20 | 18 |
| speed | 22 | 32 | 16 | 30 |
| guard | 32 | 20 | 36 | 12 |
| hpTank | 38 | 24 | 22 | 16 |
| defenseTank | 28 | 22 | 38 | 12 |
| slowPower | 30 | 38 | 24 | 8 |
| fastGlass | 20 | 34 | 14 | 32 |

`combatRoleV2` は内部生成・監査メタデータ。子ども向けUI表示やAI判断をロール文字列だけで行わない。実戦判定は実能力を使う。

### 2.2 進化時配分

1. 第1形をrole比率で配分。
2. 進化後は前形態4能力をfloorにする。
3. `growthBudget = targetBST - previousBST`。
4. growthBudgetだけを新role比率で配る。

155遷移で4能力非減少を必須とする。

### 2.3 role semantic review flag

最低限:

```text
fastGlass:   baseSpeed > baseDefense && baseDefense/BST <= 0.22
slowPower:   baseSpeed が4能力中最低
hpTank:      baseHP >= baseDefense
defenseTank: baseDefense >= baseAttack
guard:       baseDefense >= baseSpeed
```

違反は自動FAILではなく人間レビューflag。

No.142 `m142 / ヘラクレオン` は HP106 / ATK87 / DEF111 / SPD63 で `fastGlass` と大きく不一致するため必ずflag対象。runtime/UXは実能力を正とする。

---

## 3. XP / LvUP / Team育成

```text
totalXp(L) = round(6 * (L - 1)^1.9)
xpToNext(L) = totalXp(L+1) - totalXp(L)
```

通常敵XP:

| difficulty | XP |
|---|---:|
| weak | 90 |
| normal | 110 |
| strong | 125 |
| rare | 145 |
| elite | 165 |

ボスXP:

| rank | XP |
|---|---:|
| C | 180 |
| B | 200 |
| A | 220 |
| S | 250 |
| EX | 300 |

### 3.1 Team XP

戦闘開始時の手持ち最大3体へ勝利/捕獲成功時に100%ずつ同額付与。

- BOX控え: 0%。
- 戦闘中に瀕死: 対象のまま。
- 捕獲直後個体: その戦闘XPなし。
- 捕獲成功でも撃破と同額Battle XP。
- 捕獲成功Manaは撃破50%。

---

## 4. 通常進化

### level

```text
method = level
param = level N
```

N到達で進化Ready。

### stone

```text
method = stone
param = itemId
```

- 1個消費。
- 固定Lvなし。
- 子どもが「つかう」で進化。

### held_item_levelup

```text
method = held_item_levelup
param = heldItemId
```

**固定Lv閾値なし。**

1. 指定もちもの装備。
2. その状態で次の実LvUP。
3. `evolutionReady=true`。
4. 進化演出。
5. 進化後も装備維持。

装備しただけでは進化しない。別itemへ付替えたらready解除し、指定item装備中の次LvUPが再度必要。

11遷移:

- 058→059 emberwick
- 062→063 sunscale
- 068→069 steelplate
- 092→093 windband
- 123→124 frostgem
- 141→142 barkarmor
- 149→150 nightfeather
- 155→156 steelplate
- 173→174 skyplume
- 185→186 dragonfang
- 197→198 corepart

---

## 5. 進化アイテム取得設計

stone21 / held-item11 は遷移ごとに1回だけ開く専用 `evolutionTrial` の初回クリア報酬で必要itemを1個保証する。

### 5.1 unlock milestone

| source area | milestoneId | 条件 |
|---:|---|---|
| 1 | `evo-a1` | エリア1主ルート50%到達 |
| 2 | `evo-a2` | エリア1ボス撃破 + エリア2主ルート35%到達 |
| 3 | `evo-a3` | エリア2ボス撃破 + エリア3主ルート35%到達 |
| 4 | `evo-a4` | エリア3ボス撃破 + エリア4主ルート35%到達 |

実装時は `ceil(mainRouteStageCount * ratio)` で実stage数に変換する。

各transition trial:

```text
areaEvolutionGate cleared
AND source species owned
AND 今日の基本学習完了
```

で挑戦可能。

```text
unlockMilestone = areaEvolutionGate + sourceSpeciesOwned
earliestAcquisition = transitionTrial first clear
```

- ランダムなし。
- 有料通貨なし。
- 各transition 1回限り。
- 共有stone/itemでもtransition単位に報酬を持たせ、238体コンプリートに必要な総個数を保証する。

stone種別は現CSVの `thunder / water / leaf / moon / fire / ancient / dusk / ice` を正とする。

held item種別は `emberwick / sunscale / steelplate / windband / frostgem / barkarmor / nightfeather / skyplume / dragonfang / corepart`。`steelplate` は2遷移で使用するため2transition分を保証する。

---

## 6. formal move master

最低スキーマ:

```text
moveId
name
type
power
accuracy
effect
role
```

`effect` は少なくとも:

```text
{ type: damage }
{ type: heal, healRatio: 0.20, usesPerBattle: 1 }
{ type: guard }
```

を表現可能にする。

最終形の基本profile:

```text
stable   40〜60 / acc100
coverage 60     / acc100 / STABと異なる相性用途
strong   80     / acc95
finisher 100    / acc90
```

単体完成形は 60/80/80/100 を基準。バースト専用は110/95。

- STAB 1.20。
- タイプ相性 0 / 0.5 / 1 / 2。
- 0倍は0damage。
- ダメージ乱数なし。
- 初期版通常急所なし。
- 4技すべて同タイプ・同効果にしない。

### 6.1 非劣位技gate

各最終形で代表相性ケースを回し、4技中最低2技に少なくとも1ケースずつ合理的な選択理由があること。

No.181 / 182 は「技を覚える／つなげる」設定を個別moveで表現する。

### 6.2 healer/support identity

強いwatch:
041 / 050 / 098 / 209 / 210 / 235。

追加watch:
042 / 049 / 051 / 099 / 115 / 116 / 175 / 176 / 177 / 208。

設定文が明確に回復を示す場合、技名だけではなく原則として1戦1回・20%の確定回復effectを持たせる。stat roleはhpTank/balanced等のままでよい。

---

## 7. ダメージ・行動順

```text
baseDamage = floor(((((2*Lv/5)+2) * power * Attack / Defense) / 50) + 2)
damage = floor(baseDamage * STAB * typeEffectiveness)
```

同速はプレイヤー先手。

通常敵AIはプレイヤー入力前に行動候補を内部決定し、入力を見て変更しない。期待ダメージ `power * accuracy * typeEffectiveness` 最大を基本とする。

---

## 8. 通常敵soft scaling + repeat cap

`combatPower` は実能力から計算し、技威力やタイプ相性は入れない。攻略メリットを敵側で相殺しないため。

### 未クリア

```text
currentTeamPower = team 1〜3体 combatPower平均
normalReferencePower = currentTeamPower
```

BOXは無視。

### 初回クリア

```text
stage.firstClearReferencePower = battle start時のnormalReferencePower
```

### 既クリア再戦

```text
repeatCap = stage.firstClearReferencePower * 1.10
normalReferencePower = min(currentTeamPower, repeatCap)
```

初回snapshotを下限には使わない。

Difficulty:

| difficulty | target multiplier | target turn |
|---|---:|---:|
| weak | 0.82 | 2〜4 |
| normal | 0.92 | 3〜5 |
| strong | 1.02 | 4〜6 |
| rare | 1.065 | 4〜7 |
| elite | 1.12 | 5〜8 |

受入:

- +20%育成で既クリア同stage平均決着が最低1turn短縮。
- 低Lv育成teamは旧snapshotに引き上げられない。
- 未クリアはcurrent team追従。
- cap係数調整は1.05〜1.10のみ。

---

## 9. ストーリー／エリアボス

初回挑戦開始時:

```text
teamWeighted   = 手持ち上位3体 50/30/20
rosterWeighted = 所持上位3体 50/30/20 * 0.85
carryFloor     = 所持最強 * 0.80
bossReferencePower = max(teamWeighted, rosterWeighted, carryFloor)
```

snapshot保存後:

- 通常再戦は固定。
- challenge再戦だけcurrent powerへ再scale。

Rank:

| rank | target | HP | ATK | DEF | big move |
|---|---:|---:|---:|---:|---:|
| C | 1.02 | 1.20 | 1.02 | 1.00 | 100 |
| B | 1.08 | 1.35 | 1.04 | 1.03 | 120 |
| A | 1.14 | 1.50 | 1.07 | 1.05 | 140 |
| S | 1.20 | 1.65 | 1.10 | 1.08 | 155 |
| EX | 1.28 | 1.80 | 1.12 | 1.10 | 170 |

予告:

- C/B: 通常2〜3 → 予告 → 大技。
- A: 通常2 → 予告 → 大技。
- S/EX: 通常1〜2 → 予告 → 大技。
- 予告後大技は命中100%。
- 同じ大技連続なし。
- 初見予告なし満タン即死を作らない。

### 共通まもる

- 成功100%。
- 1行動。
- その敵行動のdamage/statusを防ぐ。
- 次turn連続不可。
- 予告大技にも有効。

UIは同一画面で「つぎに おおわざ！」「まもるなら いま」を出し、まもるを強調する。攻撃／交代も残す。

---

## 10. 捕獲

- HP50%以下。
- 最大3投。
- 失敗で敵turn。
- 捕獲成功でもBattle XP同額。
- Manaは撃破50%。

わ:

| item | multiplier |
|---|---:|
| ほし | 1.00 |
| ぎん | 1.20 |
| きん | 1.50 |
| にじ | 100% |

非にじcap 92%。

### 10.1 catchRank正式式

```text
rarityRank(common)=1
rarityRank(rare)=2
rarityRank(epic)=3
rarityRank(legend)=4
catchRank = min(5, rarityRank(monster.catchRarity) + (stage - 1))
```

**各形態自身のcatchRarityを使う。系列第1形態基準ではない。**

`wildCatchable=false` / `catchable=false` を捕獲不可判定として優先する。

全238体でvalidator必須。

---

## 11. にじのわ

- 各学年初回クリア +1。
- 全エリア後EX初回 +1。
- ランダムなし。
- 通常章末ごとの定期配布なし。
- 周回再取得なし。

小1〜小6のみなら最大7個。年長等を学年定義へ追加する場合は供給総数を再計算する。

---

## 12. ギガシンカ／キョダイバースト

正本は `design/09-special-forms-master.md`。

ギガ12:
003 / 006 / 009 / 051 / 054 / 072 / 090 / 121 / 153 / 156 / 159 / 186。

バースト8:
060 / 066 / 133 / 136 / **142 ヘラクレオン** / 165 / 171 / 174。

スター覚醒なし。

ギガ:

- 最終進化済み。
- ギガキー永久。
- 種族ギガコア永久。
- 専用challenge勝利で解放。
- battle終了まで。
- 4能力×1.35。
- HP割合維持。

バースト:

- バーストのしるし永久。
- 3turn。
- HP×2 / ATK×1.2。
- 専用技110 / acc95。
- HP割合維持。

referencePowerへ未発動特殊形態を先読みしない。1battleの特殊変身はparty全体1回。

正式runtime投入前に同一基準敵へ通常／ギガ／バーストをsimulationし、一方が全状況で上位互換にならないことを確認する。

---

## 13. 取得保証

- 野生155。
- 進化専用79。
- イベント完成個体4（235〜238）。

イベント完成個体は初回story/event戦で捕獲させず、撃破後 `captureTrial` を開放し捕獲成功まで再挑戦可能。

No.235〜237はlegend相当高BSTのため通常wild poolへ絶対に混ぜない。

---

## 14. 自動validator / simulation gate

### DATA

- 001〜238欠番0 / 重複0。
- 238体 / 83系列 / 18タイプ。
- 155進化 = 123/21/11。
- No239 runtime混入0。
- giga12 / burst8 / overlap0。
- No142 = `m142 / ヘラクレオン / burstEligible=true`。
- 4能力正数。
- 進化4能力非減少。
- targetBST一致。

### CATCH

- 238/238 catchRank式一致。
- 捕獲不可flag優先。
- rank1〜5 × HP50/25/1 × 4種のわ表出力。
- にじ100 / 非にじ<=92。

### EVOLUTION

- held11すべて固定Lvなし。
- 装備だけで発火しない。
- 指定item装備中の次LvUPでready。
- stone21 + held11すべてunlockMilestone / earliestAcquisitionを解決できる。

### GROWTH

- 238 × Lv1/5/10/20/30/50/100再計算一致。
- LvUP能力非減少。
- Lv100上限。
- role semantic flag出力。

### BATTLE

- team XP開始時3体100%。
- 捕獲成功XP同額。
- normal repeat cap受入条件。
- 0倍0damage。
- formal move schema。
- 各最終形最低2技に選択理由。

### BOSS / SPECIAL

- boss初回snapshot。
- normal rematch固定。
- challengeだけ再scale。
- まもる100% / 連続不可 / 予告UI。
- giga/burst HP割合維持。
- 1battle特殊形態1回。
- giga/burst相対強度simulation。

**main mergeは全gate green後のみ。**
