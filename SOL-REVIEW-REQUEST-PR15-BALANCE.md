# SOLレビュー依頼 — ManaEvo 238体 / 成長 / バトル / ボス

対象PR: #15 `chatgpt/monster-master-238`
レビュー種別: **実装前・詳細設計レビュー**

## 最重要

**まだruntime実装へ進めないでください。**

今回レビューするのは、No.001〜238のキャラクターマスター、Lv成長、進化、技、通常敵、ボス、捕獲、ギガ/バーストをruntimeへ投入する前の詳細設計です。

判定 `GO`、または指摘反映後の `GO WITH FIX` を得てから実装に進みます。

## レビュー開始順

1. `design/12-detailed-balance-design-for-sol-review.md`
2. `design/15-sol-review-validation-report.md`
3. `design/13-monster-growth-master-238.md`（索引）
4. No.001〜238 成長CSV
   - `design/13a-monster-growth-area1.csv`
   - `design/13b-monster-growth-area2-part1.csv`
   - `design/13b-monster-growth-area2-part2.csv`
   - `design/13c-monster-growth-area3-part1.csv`
   - `design/13c-monster-growth-area3-part2.csv`
   - `design/13d-monster-growth-area4-part1.csv`
   - `design/13d-monster-growth-area4-part2.csv`
5. 155進化比較CSV
   - `design/14a-evolution-balance-area1.csv`
   - `design/14b-evolution-balance-area2.csv`
   - `design/14c-evolution-balance-area3.csv`
   - `design/14d-evolution-balance-area4.csv`
6. `design/09-special-forms-master.md`
7. `design/11-battle-character-boss-review.md`

## 既に機械検証したこと

- 238/238、欠番0、重複0、No.239混入0
- 元 `families.mjs` のNo.001〜238と、名前/area/type/rank/role/stage/設定/進化条件の照合不一致0
- 83系列、18タイプ
- 155進化 = level123 / stone21 / held-item+levelup11
- 155進化すべてで基礎4能力非減少
- BST合計不一致0 / target BST不一致0
- Lv1/5/10/20/30/50/100の能力式不一致0
- ギガ12 / バースト8 / 重複0

機械的に正しいことだけでなく、**ゲームとして楽しいか・学習ゲームとして成長実感があるか**を重点的にレビューしてください。

## 必ず見てほしい観点

### 238 MASTER

- 各キャラの `baseHP / baseAttack / baseDefense / baseSpeed` が設定・見た目・系列に合っているか
- `combatRoleV2` が各キャラの設定と噛み合うか
- final/legend/standaloneが強すぎない・弱すぎないか
- Lv100まで伸びても極端な壊れ値がないか
- 進化で4能力非減少を保証する方式が単調すぎないか

### BATTLE

- XP曲線と進化体験日数
- 手持ち3体全員へ100% Battle XPを配る候補
- 40/60/80/100の技帯域、STAB1.20、初期版急所/ダメージ乱数なし
- normal敵の手持ち基準ソフトスケール
- boss初回snapshot → 通常再戦固定 → challenge再戦だけ再スケール
- Lv80+低Lv2体、弱い編成付替えなどの抜け道
- ボス予告大技と共通 `まもる` 候補

### CAPTURE

- 初回ストーリーボス `catchable:false`
- 初回撃破後に同種入手ルート / event完成個体はcaptureTrial
- `catchRarity` と `powerTier` の分離
- catchRank生成規則
- ほし1.00 / ぎん1.20 / きん1.50 / にじ100% / 非にじ92%上限
- にじのわ供給量

### SPECIAL

- ギガ12体 / バースト8体の対象・役割・強さ
- ギガ全能力×1.35
- バースト3ターン / HP×2.0 / 攻撃×1.2 / 専用技110
- 特殊形態で通常敵・ボスのスケーリングを後追いさせないこと

## R1〜R5への回答必須

**R1.** `powerTierV1 = source catchRarity` を初期seedとして開始してよいか。戦闘力と捕獲レア度を一部独立補正すべきNo.があれば列挙。

**R2.** バトル開始時の手持ち最大3体へ、全員100%の同一Battle XPを配る方式でよいか。

**R3.** ボス予告大技への共通行動 `まもる`（成功100%、次ターン再使用不可）を採用してよいか。

**R4.** 元 `healer/support` の設定を、初期戦闘で意味のある `hpTank/balanced` 等へ変換した個体に設定不整合がないか。

**R5.** にじのわを「各学年初回クリア+1 / 全エリア後EX初回+1 / ランダムなし / 章末配布なし」とする供給量が適切か。

## 返却形式

```text
判定: GO / GO WITH FIX / NO-GO

P0:
- ...
P1:
- ...
P2:
- ...

[238 MASTER]
- 数値異常No.
- role不整合No.
- 進化前後不整合No.

[BATTLE]
- XP
- 技
- 通常敵
- ボス
- 捕獲
- ギガ/バースト

R1〜R5への回答:
R1 ...
R2 ...
R3 ...
R4 ...
R5 ...

実装前に必ず直す内容:
1. ...
```

## レビュー後

指摘はPR #15の設計ファイルへ反映し、再検証します。その後にだけ正式runtime master / battle engine / boss AI / capture / special formsへ実装を開始してください。
