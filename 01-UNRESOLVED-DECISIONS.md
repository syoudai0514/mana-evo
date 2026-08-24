# 未決事項 — PR #15 SOL修正後

更新日: 2026-08-24
最新判定: **GO WITH FIX / runtime実装アンロック / Draft継続 / main merge不可**

レビュー履歴は `design/16-sol-pr15-full-review.md` / `design/17-sol-pr15-review-amendment.md`、修正後の最新判定は `design/18-sol-pr15-fix-resolution.md` を正とする。

## 1. 設計上のP0/P1は解消済み

以下はもう未決ではない。

- catchRank: 各形態自身の `catchRarity` + stage補正。
- held_item_levelup: 固定Lvなし。指定もちもの装備中の次の実LvUPで `evolutionReady`。
- No.142: `m142 / ヘラクレオン / burstEligible=true`。
- 進化item32遷移: `design/14e-evolution-item-acquisition-master.csv` の専用trial初回クリア保証。
- normal stage: current team soft scale + first-clear reference + repeat cap ×1.10。
- Battle XP: 戦闘開始時の最大3体へ100%ずつ。捕獲成功も同額。
- formal move minimum schema: `moveId/name/type/power/accuracy/effect/role`。
- healer/support identity: stat roleではなくmove effectで表現。
- `combatRoleV2`: 内部監査メタデータ。実戦は実能力値が正。
- 共通 `まもる`: 100% / 1行動 / 連続不可 / ボス予告大技に有効。
- powerTierV1: source catchRarityを初期seed、catchRarityとは別field。
- にじのわ: 各学年初回 + 全エリア後EX初回。ランダムなし。
- スター覚醒なし。
- ギガ12 / バースト8の対象IDは再選定しない。

## 2. 確定済みデータ

- active monster: No.001〜238 = **238体**。
- No.239はruntimeへ入れない。
- **83系列 / 18タイプ**。
- **155進化 = level123 / stone21 / held_item_levelup11**。
- 155進化で基礎4能力低下0。
- ギガ12 / バースト8 / overlap0。
- Lv上限100。
- 個体値/努力値/性格などの隠し補正なし。
- STAB 1.20。
- 初期版はダメージ乱数・通常急所なし。
- 捕獲はHP50%以下 / 最大3投 / ほし1.0 / ぎん1.2 / きん1.5 / にじ100% / 非にじ92%上限。
- 今日の基本学習未完了では持越しチケットでも新規バトル不可。
- チケットTTL 7日、期限近い順消費。敗北/明示逃走返却、勝利/捕獲成功消費。

## 3. 残っているのは「仕様未決」ではなくruntime実装gate

main merge前に実装・simulationが必要:

1. 238体正式runtime master投入。
2. 238体formal move master + 非劣位技validator。
3. healer/support identity watch個体の回復等effect実装。
4. No.181 / 182固有move identity。
5. role semantic flag全件レビュー。No.142をfastGlass前提で扱わない。
6. `まもる` とボス予告UIのE2E。
7. boss snapshot / rematch / challengeの実コンテンツE2E。
8. normal repeat capの+20%成長simulation。
9. ギガ/バースト相対強度simulation。
10. 進化trial32件の実stage/reward実装。
11. 最終CI green / Vercel Preview QA。

これらは実装途中で数値simulationにより微調整してよいが、**正本仕様を勝手に別仕様へ変更しない**。仕様変更が必要になった場合は、理由・simulation結果・影響範囲を記録してから設計書も同時更新する。

## 4. 現在の検証状態

GitHub Actions CI run #154:

- 92 tests / **92 pass / 0 fail**。
- build success。
- npm audit high: 0 vulnerabilities。

PR15 validator:

- 238体 / 83系列 / 18タイプ PASS。
- catchRank 238/238 PASS。
- 155進化 method count PASS。
- held11固定Lvなし PASS。
- item進化32/32 acquisition master PASS。
- No.142 ID/name/burst PASS。
- role semantic flag検出 PASS。

Vercel Previewは head `9ebb256e` で READY。Productionは変更していない。

## 5. 次の判定

設計レビューの `NO-GO` は解除済み。

次は上記runtime gateを全部満たした時点で **MERGE GO / NO-GO** を判定する。それまではPR #15をDraftのまま維持する。
