# Review findings status — latest

## PR #4 source review

P0/P1の基盤修正はPR #5前半で実施済み:

- free-ticket daily gate
- daily queue resume
- SRS/difficulty接続
- MASTER到達可能性
- Kids Quest snapshot import整合
- party HP / activeBattle / max3 capture
- evolution method engine
- Giga/Burst permanent ownership shape

## PR #5 design-led review: P0 2 / P1 5

### P0-01 誤答→「わかった」で完了できる
**FIXED**

- explanation acknowledgementは状態記録のみで完了しない
- 同じ技能への正しい再回答が必要
- fast-wrongでsuspiciousなら別確認問題も正解必須

### P0-02 持越しチケットで今日のdailyを迂回
**FIXED**

- `startBattle(..., { dailyCompleted })` のdomain gate
- UIだけではなくengineで拒否

### P1-01 チケット7日保持未実装
**FIXED**

- `ticketGrants[]` に獲得日/期限/枚数
- 7日TTL
- nearest-expiry first
- legacy整数ticket migration
- 「わ」は期限なし

### P1-02 「わ」性能差なし
**FIXED**

- star 1.00 / silver 1.20 / gold 1.50 / rainbow 100%
- non-rainbow 92% cap
- config化
- UIで各成功率表示

### P1-03 学習→「わ」循環なし
**FIXED**

- daily +3 star
- extra 3 correct +1 star
- unit MASTER +1 silver
- hard MASTER +1 gold

### P1-04 実マスタがlevel進化だけ
**FIXED**

- `wild-stone-*` 実系列 + `glow-stone`
- `wild-charm-*` 実系列 + `bond-charm`
- ステージ報酬→所持→UI条件→進化をE2E

### P1-05 未決資料が正本を誤上書き
**FIXED**

- `design/` 正本スナップショット追加
- SHA-256 manifest追加
- `01-UNRESOLVED-DECISIONS.md` を「本当に未決 / マスタ割当待ち / 実装待ち」に再分類
- Giga/Burst基本仕様を未決扱いしない

## P2 / 次段階

- PWA/offline
- dependency lockfile（可能ならこのPRで追加）
- Kids Quest全教材UI routing
- TTS/iPhone実機E2E
- Giga/Burst実戦発動
