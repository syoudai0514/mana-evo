# ManaEvo 238体 成長ステータスマスター — SOLレビュー索引

更新日: 2026-08-24
対象: PR #15 `chatgpt/monster-master-238`
状態: **SOL REVIEW READY / runtime未実装**

## 目的

No.001〜238の各キャラについて、キャラ設定と戦闘用数値を1行で横断レビューできるようにした詳細設計データです。GitHub上でレビューしやすいようエリア単位・必要に応じて分割しています。**下記7ファイルを合わせて238体ちょうど**です。

| ファイル | 対象 | 行数（ヘッダ除く） |
|---|---|---:|
| `13a-monster-growth-area1.csv` | No.001〜054 / Area1 | 54 |
| `13b-monster-growth-area2-part1.csv` | No.055〜086 / Area2前半 | 32 |
| `13b-monster-growth-area2-part2.csv` | No.087〜118 / Area2後半 | 32 |
| `13c-monster-growth-area3-part1.csv` | No.119〜151 / Area3前半 | 33 |
| `13c-monster-growth-area3-part2.csv` | No.152〜183 / Area3後半 | 32 |
| `13d-monster-growth-area4-part1.csv` | No.184〜211 / Area4前半 | 28 |
| `13d-monster-growth-area4-part2.csv` | No.212〜238 / Area4後半 + イベント完成個体 | 27 |
| **合計** | No.001〜238 | **238** |

No.239 `シラユキヒメ` は元資料保全のみで、現行238体masterには含めません。

## 1行に含む項目

- No / 正式ID候補 / 系列No / 系列名 / 名前
- エリア / タイプ
- stage / maxStage
- `catchRarity` / `powerTierV1`
- 復元元 `sourceRole` / 現行 `combatRoleV2`
- BST / 基礎HP / 基礎こうげき / 基礎ぼうぎょ / 基礎すばやさ
- 進化方式 / 条件 / 次ID / 次の名前
- encounterPool / capturePolicy / wildCatchable / catchRank
- 技威力profile
- gigaEligible / burstEligible
- motif / concept / description
- **Lv1 / 5 / 10 / 20 / 30 / 50 / 100 の HP・攻撃・防御・素早さ**

## 数値の読み方

Lv能力値は `design/12-detailed-balance-design-for-sol-review.md` の式で算出しています。進化後は前形態の4能力をfloorにして、増えたBST予算だけを進化後ロール比率で配分するため、進化による能力低下を禁止しています。

`powerTierV1` は初期seedとして元資料のcatchRarityと同値ですが、**フィールドは分離済み**です。別SOLレビューで戦闘力と捕獲レア度をさらに分離すべきと判断された場合、`powerTier`だけ修正できます。

## 進化比較

155進化遷移は以下4ファイルで全件確認できます。

| ファイル | 対象 | 遷移数 |
|---|---|---:|
| `14a-evolution-balance-area1.csv` | Area1 | 36 |
| `14b-evolution-balance-area2.csv` | Area2 | 42 |
| `14c-evolution-balance-area3.csv` | Area3 | 43 |
| `14d-evolution-balance-area4.csv` | Area4 | 34 |
| **合計** | 全エリア | **155** |

level進化ではトリガーLvでの進化前後実能力も記録しています。stone / held-item+levelupは固定トリガーLvを持たないため、基礎値差を監査します。

## 自動検証済み

- active ID: 001〜238、欠番0、重複0
- 83系列
- 18タイプすべて存在
- 155進化遷移 = level 123 / stone 21 / held-item+levelup 11
- 155遷移すべてで基礎4能力非減少
- 155遷移すべてでtarget BST一致
- Lv1/5/10/20/30/50/100の能力式不一致0
- BST合計不一致0
- 元 `families.mjs` のNo.001〜238との名前/area/type/rank/role/stage/設定/進化条件照合不一致0
- 野生155 / 進化専用79 / イベント完成個体4
- ギガ12 / バースト8 / 重複0
- No.239 runtime候補混入0

詳細は `design/15-sol-review-validation-report.md` を参照。

## レビュー時の注意

このCSVは**実装用確定masterではなく、SOLレビュー用の詳細設計候補**です。別SOLが `GO` または指摘修正後の `GO WITH FIX` を出すまでruntimeへ投入しません。

レビュー開始点はリポジトリ直下 `SOL-REVIEW-REQUEST-PR15-BALANCE.md` とします。
