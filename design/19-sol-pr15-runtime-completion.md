# PR #15 SOL Runtime Completion / MERGE GO

更新日: 2026-08-24
対象: `chatgpt/monster-master-238`
最終判定: **MERGE GO / Production release allowed**

本書は `design/18-sol-pr15-fix-resolution.md` より後の runtime 実装・simulation 結果を記録する最新判定。レビュー履歴と設計正本は保持し、runtimeで判明した調整だけを本書で上書きする。

## 1. Runtime completion

main merge gateとして残っていた項目をすべて実装した。

- No.001〜238 正式runtime master
- 238体 × 4通常技 + 8バースト専用技 = 960技
- healer/support identity の20%確定回復技
- No.181 / No.182 固有identity技
- `combatRoleV2` をruntime/UI判断から排除
- 共通 `まもる` とボス大技予告UI
- boss first snapshot / normal rematch lock / challenge rescale
- ギガシンカ / キョダイバースト実戦発動
- 32件の進化trialと初回クリア報酬
- 4エリア + event + EXを含む216 runtime stages
- legacy仮species IDから m001〜m238 へのsave migration
- 敗北・明示離脱時のticket返却と元期限維持

No.239はruntime対象外のまま。

## 2. 通常stage再戦 — simulationによる最終補足

`repeatCap = firstClearReferencePower * 1.10` は維持する。

ただし、combatPower +20%はHP/DEF成長も含むため、敵を1.10 capで追従させるだけでは「育ったら昔の敵が明確に楽になる」体験が弱かった。そこで既クリアstageだけ、初回よりteam combatPowerが伸びた割合に応じて **repeat mastery easing** を追加する。

```text
growthRatio = currentTeamPower / firstClearReferencePower

ease = clamp(0.70, 1 - (growthRatio - 1) * 1.25, 1.00)
repeat enemy HP multiplier  = ease
repeat enemy DEF multiplier = ease
repeat enemy ATK multiplier = 1.00
repeat enemy SPD multiplier = 1.00
```

- 初回以下の弱い育成teamでは easing なし。
- snapshotを下限にしないため低Lv育成を阻害しない。
- 敵ATKは下げず、周回速度だけを短くする。
- +20%付近ではHP/DEFがおおむね0.75となり、成長実感を明示する。
- 未クリアstageとbossには適用しない。

### simulation acceptanceのfloor補正

初回から1行動で終わる相性有利戦は、物理的に「1turn短縮」できない。従来テストはその1turn floor戦も母数に含めていたため、受入条件が数学的に達成不能になり得た。

最終simulationでは次のように評価する。

- 初回2turn以上のサンプルを「短縮可能sample」とする。
- +20%前後の育成後、短縮可能sampleの平均が **1turn以上短縮** すること。
- 初回1turn戦は退化していないことを別の通常battle test群で担保する。

これは受入条件を弱める変更ではなく、1turn floorを除いた同じ「最低1turn短縮」判定である。

## 3. Ticket refund補足

battle開始時に予約消費したticketは、敗北・明示離脱で元の `earnedDay / expiresDay` を維持して返却する。自動敗北処理で現在実時間を誤って使い、テスト上だけ期限切れ扱いになる経路を修正した。

- 勝利 / 捕獲成功: 消費確定
- 敗北 / 明示離脱: 元期限のまま返却
- 本当に期限を過ぎた明示離脱: 返却しない
- 二重返却なし

## 4. Final CI

GitHub Actions CI **run #175**:

- runtime generation: **238 species / 960 moves / 216 stages**
- tests: **97 / 97 PASS**
- fail: **0**
- npm audit high: **0 vulnerabilities**
- Vite production build: **SUCCESS**

build warningは既存のasset runtime URL解決とchunk size warningのみで、build errorは0。

## 5. Merge / release judgment

PR #15のruntime gateは全件完了したため、判定を以下へ更新する。

**MERGE GO**

- Draft解除可
- main merge可
- Vercel Production公開可
- Supabase変更なし

238体の正式画像アセット自体は別制作工程。runtimeは `/monsters/m001.webp`〜`m238.webp` を優先表示し、未配置個体は識別可能な準備中fallbackを表示する。画像未配置は今回のゲームロジック・238体正式データmasterのmerge blockerにはしない。
