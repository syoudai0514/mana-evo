# 未決事項 — PR #15 runtime完了後

更新日: 2026-08-24
最新判定: **MERGE GO / Production release allowed**

レビュー履歴は `design/16-sol-pr15-full-review.md` / `design/17-sol-pr15-review-amendment.md`、設計修正判定は `design/18-sol-pr15-fix-resolution.md`、runtime完了の最新判定は `design/19-sol-pr15-runtime-completion.md` を正とする。

## 1. 設計上のP0/P1は解消済み

以下は確定済み。

- catchRank: 各形態自身の `catchRarity` + stage補正。
- held_item_levelup: 固定Lvなし。指定もちもの装備中の次の実LvUPで `evolutionReady`。
- No.142: `m142 / ヘラクレオン / burstEligible=true`。
- 進化item32遷移: `design/14e-evolution-item-acquisition-master.csv` の専用trial初回クリア保証。
- normal stage: current team soft scale + first-clear reference + repeat cap ×1.10。
- 既クリア通常stage: 成長率に応じたrepeat mastery easingをHP/DEFへ適用。詳細はdesign/19。
- Battle XP: 戦闘開始時の最大3体へ100%ずつ。捕獲成功も同額。
- formal move schema: `moveId/name/type/power/accuracy/effect/role`。
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
- チケットTTL 7日、期限近い順消費。敗北/明示離脱返却、勝利/捕獲成功消費。

## 3. Runtime gate — 全件完了

1. 238体正式runtime master投入 — PASS
2. 238体formal move master + validator — PASS
3. healer/support identity effect — PASS
4. No.181 / 182固有move identity — PASS
5. role semantic runtime誤用排除 — PASS
6. `まもる` + ボス予告UI E2E — PASS
7. boss snapshot / rematch / challenge E2E — PASS
8. normal repeat +20%成長simulation — PASS
9. ギガ/バースト相対強度simulation — PASS
10. 進化trial32件 stage/reward — PASS
11. CI / production build — PASS

## 4. Final validation

GitHub Actions CI run #175:

- generated runtime: **238 species / 960 moves / 216 stages**
- tests: **97 / 97 PASS**
- failures: **0**
- npm audit high: **0 vulnerabilities**
- Vite production build: **SUCCESS**

normal repeat simulationは、初回1行動のfloor戦を除く「短縮可能sample」で+20%前後の成長後に平均1turn以上短縮することを確認する。理由と最終式は `design/19-sol-pr15-runtime-completion.md` に記録済み。

## 5. 現在の未決事項

PR #15を止める仕様・runtime blockerは **0件**。

正式キャラクター画像238体のファイル制作・配置は別制作工程であり、今回の正式monster data / battle / evolution runtimeのmerge blockerにはしない。画像ファイルが未配置の個体は識別可能な準備中fallbackを表示する。

## 6. 判定

**MERGE GO**

PR #15はDraft解除、main merge、Vercel Production公開へ進めてよい。
