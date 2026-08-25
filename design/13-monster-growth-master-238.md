# ManaEvo 238体 成長ステータスマスター — W-209 reconciliation index

更新日: 2026-08-25  
Work Item: **W-209**  
状態: **DERIVED MASTER RECONCILED / runtime未実装**

## 目的

No.001〜238の派生成長データを、Phase 3 の権威順序に従って active monster data master として再照合するための索引です。runtimeを正本とはせず、`REBUILD-START-HERE.md` / `design/rebuild/DECISION-LOG.md` / CURRENT canonical / exact FINAL-CORRECTED を優先します。

W-209では新しいモンスター仕様や数値を作っていません。既存238体データのidentity・進化リンク・特殊形態対象を再検証し、既知の未承認driftだけを補正しています。

## W-209 reconciliation

- active scope: **m001〜m238 / 83系列**。
- No.239 `シラユキヒメ` は immutable baseline/reference のみに保全し、active masterへ入れません。
- No.142 `m142` は、exact baselineの旧表示名 `カブトレクス` より後の承認済みCURRENT決定を優先し、**`ヘラクレオン` を維持**します。
- No.236 `m236` は、exact baselineの `ホシラディア` に対し派生CSVだけが `ソラリオン` へ変わっていた未承認driftだったため、**`ホシラディア` に補正**しました。
- したがって raw baseline との表示名直比較では、補正後も承認済み変更である m142 の1件だけが意図的に異なります。権威順序を適用した**未承認identity mismatchは0件**です。
- m236は単独完成個体であり、今回の名前補正による進化リンク数の変化はありません。

## 238体データファイル

下記7ファイルを合わせて238体ちょうどです。

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

## 1行に含む項目

- No / stable ID / 系列No / 系列名 / 名前
- エリア / タイプ
- stage / maxStage
- `catchRarity` / `powerTierV1`
- 復元元 `sourceRole` / `combatRoleV2`
- BST / 基礎HP / 基礎こうげき / 基礎ぼうぎょ / 基礎すばやさ
- 進化方式 / 条件 / 次ID / 次の名前
- encounterPool / capturePolicy / wildCatchable / catchRank
- 技威力profile
- gigaEligible / burstEligible
- motif / concept / description
- Lv1 / 5 / 10 / 20 / 30 / 50 / 100 の HP・攻撃・防御・素早さ

## 数値の読み方

Lv能力値は `design/12-detailed-balance-design-for-sol-review.md` の既存式で算出されています。W-209はこの数値設計を変更していません。

`powerTierV1` と `catchRarity` もW-209では再チューニングしません。今回の担当はactive data-master reconciliationであり、新しいバランス仕様は追加しません。

## 進化比較

155進化遷移は以下4ファイルで確認できます。

| ファイル | 対象 | 遷移数 |
|---|---|---:|
| `14a-evolution-balance-area1.csv` | Area1 | 36 |
| `14b-evolution-balance-area2.csv` | Area2 | 42 |
| `14c-evolution-balance-area3.csv` | Area3 | 43 |
| `14d-evolution-balance-area4.csv` | Area4 | 34 |
| **合計** | 全エリア | **155** |

CURRENT canonicalの内訳と一致します。

- `level`: 123
- `stone`: 21
- `held_item_levelup`: 11

`design/14e-evolution-item-acquisition-master.csv` は専用evolution trial初回クリアを進化アイテム取得源にしていた旧派生資料です。D-008 / `design/current/04-EVOLUTION-ITEMS-SPECIAL-FORMS.md` により、これは**CURRENT取得仕様へ再昇格しません**。W-209は14eをactive acquisition authorityとして扱っていません。

## W-209 検証結果

- active ID: m001〜m238、欠番0、重複0
- active系列: 83
- No.239 active混入: 0
- identity: m236 drift補正後、権威順序違反0
- approved later decision: m142 = `ヘラクレオン` を維持
- 進化リンク: 155 = level 123 / stone 21 / held_item_levelup 11
- Giga: 12 stable IDs
- Burst: 8 stable IDs
- Giga/Burst重複: 0
- baseline / `src/**` / `tests/**`: W-209変更なし

詳細は `design/15-sol-review-validation-report.md` を参照してください。
