# ManaEvo design — runtime summary / compatibility index

更新日: 2026-08-29  
状態: **RUNTIME SUMMARY — NOT TOP-LEVEL SPEC AUTHORITY**

このファイルは、古い `design/*` 資料と現在のruntimeをつなぐための要約です。
**設計の唯一の入口ではありません。**

現在の正本入口は次です。

1. `REBUILD-START-HERE.md` — 権威順位 / 司令塔復元 / canonical sync governance
2. `design/rebuild/DECISION-LOG.md` — 承認された変更理由
3. `design/current/00-START-HERE.md` — 現在のdomain contracts

`design/19-*`、`design/12-*`、`design/13*`、`design/14*`、過去review文書は履歴・derived masterとして参照できますが、CURRENTや後続の明示決定を上書きしません。

## 現在productionの大枠

- active monster: No.001〜238 / 83系列 / 18タイプ
- No.239はreference only
- Kids Quest学習runtimeを学習source of truthとして維持
- Home / Study / Adventure / Monster / HowToをchild-facing top-levelとして運用
- production canonical: `https://mana-evo.vercel.app/`
- GitHub = source / PR / CI
- Vercel = production + PR Preview
- Supabase = Auth / DB / Cloud Save

## Learning / ticket — production behavior

Kids Questの学習内容・SRS・mastery・試練等をManaEvo都合で簡略化しません。

現在productionのgame reward bridge:

- daily coreは5 task
- daily core完了でbattle ticket `+3`
- daily core完了で`star` capture item `+3`
- additional learningの`extra`は、**正解5回ごとにbattle ticket +1**（Battle V6）
- additional learningの正解3回ごとに`star` capture item +1
- normal unit MASTERで`silver` +1
- hard unit MASTERで`gold` +1
- free studyは直接battle ticketを付与しない
- 前日以前のticketを持っていても、当日のdaily core未完了では新規battleを開始しない

将来のLearning Value等の設計案は、明示承認されてDecision Log + CURRENTへ昇格するまでproduction contractではありません。

## Battle — production behavior

Battle V6の主要事項:

- battle開始時にticketをreserve
- **実際にプレイして勝利 / 捕獲成功 / 敗北 / 明示離脱したbattleは、そのreserved ticketを消費する**
- reload / Safari終了 / crashは同じactiveBattleをresumeし、二重消費しない
- normal enemy scalingは、強いactive + 弱い控えで敵が不自然に弱くならないことを目的にする
- current runtimeはactive power 70% + strongest support 30%をreferenceに使用しているが、active-onlyより下げないという意図を満たすかは継続review対象
- STAB `1.25`
- critical `1/16`, multiplier `1.35`
- damage random `0.92〜1.00`
- Battle XPはV5のactive/team配分に加え、V6でplayer-enemy level gapを反映
- playerが敵より15Lv以上高い: XP multiplier `0.15`
- 10Lv以上高い: `0.25`
- 6Lv以上高い: `0.50`
- 敵が3Lv以上高い: `1.15`
- 敵が5Lv以上高い: `1.25`

Battle詳細のownerは `design/current/02-BATTLE-TICKETS-BALANCE.md`。

## Capture — production behavior

stable domain keys:

- `star`
- `silver`
- `gold`
- `rainbow`

child-facing names:

- ほしボール
- ぎんボール
- きんボール
- にじボール

倍率 / guarantee:

- star `1.0`
- silver `1.2`
- gold `1.5`
- rainbow `100%`
- non-rainbow cap `92%`
- 通常の戦闘中capture gateはenemy HP `<= 50%`
- 最大3投

Battle V6では、wild monsterをKOした後にもcapture opportunityを残す。
post-KO capture成功は、そのbattleで既にsettleされたBattle XPを再付与しない。

## World recommendation bands — Battle V6 production

現在のproduction recommendation bands:

- Area 1: Lv.5〜16
  - 5〜8 / 9〜12 / 13〜16
- Area 2: Lv.14〜27
  - 14〜18 / 19〜23 / 24〜27
- Area 3: Lv.24〜40
  - 24〜29 / 30〜35 / 36〜40
- Area 4: Lv.37〜58
  - 37〜44 / 45〜51 / 52〜58
- EX: Lv.55〜100

これらはBattle V6のslower XP / study-first budgetに合わせたproduction bandsです。

## Evolution pacing

`design/current/08-EVOLUTION-PACING.md` がproduction tuning contractです。

V5の基本:

- encounter XP poolをそのまま全員へ与えない
- active battlerはlegacy poolの40%
- eligible teammateはactive受取量の40%
- level-evolution speciesを高Lvで捕獲した場合、次のlevel evolution thresholdの少なくとも5Lv手前へcapture levelをbufferする
- 既存saveを自動巻き戻ししない

## Save / account / hosting

D-018 / D-019を優先します。

- Auth accountとplayer profileは別
- 1 account内に複数player profile
- 端末で普段開くprofileはdevice-local preference
- cloud saveはlearning + game + reward bridgeをversioned snapshotとして保持
- same-profile conflictはsilent last-write-winsを避け、adult-owned resolution
- child gameplay中にcloud conflict UIを割り込ませず、Parent側で扱う
- local storageはoffline/cacheとして残す
- Vercel production origin `/` にPWA/Auth redirectを統一

## Monster Art

D-016により、FORMAL完成を待たず、candidate gateを通過した実画像を段階的にproduction表示してよい。

現在mainのexplicit production candidate overlayはPR #98由来の**184 species**です。

- FORMAL promotionではない
- `m239`は除外
- production visibilityとFORMAL approvalを混同しない
- W-306 / W-309 / W-313 / W-319はPR #98 overlayから除外
- 後続integration PRがopenでも、mergeされるまではproduction事実にしない

Monster Art詳細は `design/current/09-MONSTER-MASTER-ART-SPEC.md` とmanifestを参照します。

## Canonical sync

今後、protected runtime/art pathを変更するPRは、CIでcanonical impact declarationを要求します。

```text
Canonical-Impact: changed | none
Canonical-Domains: ...
Canonical-Reason: ...
```

product behaviorが変わる場合は、同じPRでowning `design/current/**` と `design/rebuild/DECISION-LOG.md` を更新します。

このファイルはruntime summaryであり、ここだけ更新してdomain contract更新を省略してはいけません。
