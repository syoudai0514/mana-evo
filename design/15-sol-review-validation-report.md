# SOLレビュー前 バリデーション報告 — 238体 / 成長 / 進化

更新日: 2026-08-24
対象: PR #15 `chatgpt/monster-master-238`
状態: **SOL REVIEW CANDIDATE / runtime未実装**

## 1. 目的

`design/12`〜`14` が、過去の実装前設計を土台にした再現可能な詳細設計になっているかを、別SOLへ渡す前に機械検証した結果を記録する。

この報告は「runtimeへ実装済み」という意味ではない。No.001〜238の正式runtime masterへ投入する前の設計レビュー用データである。

## 2. 復元元

主な復元元は `mana-evo-design-v10-terra-ready` / `mana-evo-terra-FINAL-CORRECTED` 系の以下。

- `scripts/families.mjs`
- `scripts/forms.mjs`
- `scripts/battle.mjs`
- `scripts/capture.mjs`
- `scripts/wildEncounter.mjs`
- `02-dex.md`
- `01-catch-and-evolution-design.md`

`families.mjs` を機械的にflattenすると **84系列 / 239体**。現行ManaEvoの有効範囲は No.001〜238のため、元資料No.239 `シラユキヒメ` は資料保全のみでruntime候補から除外した。

## 3. 238体ソース照合

No.001〜238について、元 `families.mjs` と成長マスターを全件比較した。

比較項目:

- No
- 名前
- area
- type
- source rank (`catchRarity`)
- source role (`sourceRole`)
- stage / maxStage
- motif
- concept
- description
- evolution method / evolution param

**照合不一致: 0件**

したがって、名前・系列・エリア・属性・元レア度・元ロール・設定文・進化条件は今回その場で創作したものではなく、元資料から復元されたものと一致している。

## 4. active master構造

| 項目 | 結果 |
|---|---:|
| active monster | 238 |
| No範囲 | 001〜238 |
| 欠番 | 0 |
| ID重複 | 0 |
| active系列 | 83 |
| タイプ | 18 |
| Area1 | 54 |
| Area2 | 64 |
| Area3 | 65 |
| Area4 | 55 |
| wild | 155 |
| evolutionOnly | 79 |
| event完成個体 | 4 |
| No.239混入 | 0 |

## 5. 戦闘ロール分布

`sourceRole` は元設定保存用、`combatRoleV2` は現行の初期戦闘で意味が出る8ロールへ変換した値。

| combatRoleV2 | 体数 |
|---|---:|
| attacker | 48 |
| balanced | 44 |
| hpTank | 36 |
| speed | 26 |
| defenseTank | 23 |
| slowPower | 23 |
| guard | 20 |
| fastGlass | 18 |
| **合計** | **238** |

元 `healer` / `support` の設定は `sourceRole` に残し、初期版で未実装の回復・補助戦闘能力を前提にしないよう `combatRoleV2` へ変換している。個別設定との整合性はSOL重点レビューR4。

## 6. power tier分布

初期seedは元資料rankを `powerTierV1` に使っているが、`catchRarity` とフィールド自体は分離済み。

| powerTierV1 | 体数 |
|---|---:|
| common | 82 |
| rare | 87 |
| epic | 57 |
| legend | 12 |
| **合計** | **238** |

戦闘力と捕獲レア度をさらに独立補正すべきかはSOL重点レビューR1。

## 7. BST / Lv能力値検証

### 7.1 BST

全238体について:

```text
BST = baseHP + baseAttack + baseDefense + baseSpeed
```

**不一致: 0件**

### 7.2 target BST

`design/12` の進化段階基準BST × powerTier倍率で再計算したtarget BSTとの不一致:

**0件**

### 7.3 Lv能力式

Lv1 / 5 / 10 / 20 / 30 / 50 / 100について全238体を再計算。

```text
HP = floor(baseHP × Lv / 50) + Lv + 10
ATK/DEF/SPD = floor(base × Lv / 50) + 5
```

CSV記載値との不一致:

**0件**

## 8. 155進化遷移検証

| method | 件数 |
|---|---:|
| level | 123 |
| stone | 21 |
| held_item_levelup | 11 |
| **合計** | **155** |

全155遷移について `baseHP / baseAttack / baseDefense / baseSpeed` が進化後に減少しないことを確認。

**能力低下遷移: 0件**

全遷移中の最小増加量:

- baseHP: +13
- baseAttack: +13
- baseDefense: +9
- baseSpeed: +5

level進化についてはトリガーLv直前/直後の実能力も監査CSVへ記録。stone / held-itemは固定トリガーLvを持たないため、基礎値差を正とする。

## 9. 特殊形態対象照合

### ギガ12体

`003 / 006 / 009 / 051 / 054 / 072 / 090 / 121 / 153 / 156 / 159 / 186`

### キョダイバースト8体

`060 / 066 / 133 / 136 / 142 / 165 / 171 / 174`

- ギガ: 12/12
- バースト: 8/8
- 重複: 0
- すべてNo.001〜238内

対象割当の正本は `design/09-special-forms-master.md`。

## 10. SOLレビュー対象ファイル

- `design/12-detailed-balance-design-for-sol-review.md`
- `design/13-monster-growth-master-238.md`
- `design/13a-monster-growth-area1.csv`
- `design/13b-monster-growth-area2-part1.csv`
- `design/13b-monster-growth-area2-part2.csv`
- `design/13c-monster-growth-area3-part1.csv`
- `design/13c-monster-growth-area3-part2.csv`
- `design/13d-monster-growth-area4-part1.csv`
- `design/13d-monster-growth-area4-part2.csv`
- `design/14a-evolution-balance-area1.csv`
- `design/14b-evolution-balance-area2.csv`
- `design/14c-evolution-balance-area3.csv`
- `design/14d-evolution-balance-area4.csv`
- `design/09-special-forms-master.md`
- `design/11-battle-character-boss-review.md`

## 11. レビュー前結論

データ完全性・元資料整合・成長式・BST・進化非減少・特殊形態対象について、機械検証上のP0不整合は見つかっていない。

ただし以下は意図的に**別SOLの設計判断待ち**であり、runtimeへはまだ入れない。

1. `powerTierV1` を元catchRarityと同seedのまま始めるか
2. 戦闘開始時の手持ち3体へ全員100% Battle XPを配るか
3. ボス予告大技への共通行動 `まもる` を採用するか
4. source healer/support → combatRoleV2 の個別設定整合
5. にじのわ供給量（学年初回+1 / 全エリア後EX初回+1）

SOL判定 `GO` または指摘修正後の `GO WITH FIX` を受けるまで、No.001〜238正式runtime masterへの投入を開始しない。
