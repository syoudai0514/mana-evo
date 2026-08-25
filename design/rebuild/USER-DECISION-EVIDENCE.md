# ManaEvo 再建 — 回収済みユーザー明示判断

この文書は、GitHubへ移されていなかった過去チャットの明示判断を、再建司令塔が会話履歴から回収して記録する証拠台帳です。

## 使い方

- `REBUILD-START-HERE.md` の優先順位に従い、ここに記録された明示判断は FINAL-CORRECTED baseline より後の承認済み変更として扱う。
- runtime / tests / 後続designに書かれているだけの事項を、この文書へ勝手に追加しない。
- 原本との差は「変更されたこと」と「変更が承認されたこと」を分けて記録する。
- 時刻は UTC と Asia/Tokyo を併記する。

---

## UDE-001 現行モンスター範囲 001〜238 / No.239除外

- User evidence: 2026-08-24 07:23:33 UTC / 16:23:33 JST
- Explicit decision: 現行スコープの有効マスターは No.001〜238。No.239 `シラユキヒメ` は元資料に残すがゲームから除外する。
- Baseline difference: FINAL-CORRECTED は 84系列 / 239体で No.239 `シラユキヒメ` を含む。
- Classification: `CONFIRMED_CHANGE`
- Affected: monster master / dex / runtime generator / tests / image scope

## UDE-002 戦闘中捕獲と「わ」性能

- User evidence: 2026-08-24 06:49:53 UTC / 15:49:53 JST
- Explicit decision:
  - 捕獲は敵HP50%以下から可能
  - ほしのわ ×1.00
  - ぎんのわ ×1.20
  - きんのわ ×1.50
  - にじのわ 100%
  - 非にじ最終成功率上限 92%
  - 1バトル最大3投
- Baseline difference: FINAL-CORRECTED は勝利後CAPTURE方式、ぎん×1.5 / きん×2.0、HP非依存。
- Classification: `CONFIRMED_CHANGE`
- Affected: battle / capture / UI / tests

## UDE-003 ボス再戦は育成で楽になる

- User evidence: 2026-08-24 03:04:31 UTC / 12:04:31 JST
- Explicit decision: story / area boss は育成後の再戦でプレイヤーが有利になれること。プレイヤーLvへ完全追従して強さを相殺しない。
- Classification: `CONFIRMED`
- Affected: boss balance / snapshot / rematch

## UDE-004 画像未完成でもゲームデータ・進化は先に動かす

- User evidence: 2026-08-24 01:17:43 UTC / 10:17:43 JST
- Explicit decision: 正式画像未完成個体はplaceholderでよいが、キャラ設定・HP・進化等のゲームデータ/ロジックは動作させる。
- Classification: `CONFIRMED`
- Affected: runtime / art fallback / release gate

## UDE-005 ワールド・自力進化方向の後続承認

- User evidence:
  - 2026-08-25 00:40:57 UTC / 09:40:57 JST — 提案された進化/ワールド方向を受け入れ、原本方針との照合を要求
  - 2026-08-25 00:43:21 UTC / 09:43:21 JST — コンセプトをGitHubへ文書化し実装継続することを承認
  - 2026-08-25 01:25:24 UTC / 10:25:24 JST — 再レビュー修正を承認し実装修正を指示
- Approved direction: `design/20-world-map-evolution-progression.md` 系の「自分で育てて進化させる体験」を強化する方向は後続承認済み。
- Note: 個々の細目は FINAL-CORRECTED と current design を照合し、承認された提案範囲に含まれるかを監査で明記する。
- Classification: `CONFIRMED_CHANGE`（方向性）
- Affected: world / zone / evolution discovery / final-form wild policy / UI

## UDE-006 UI修正実装の明示依頼

- User evidence: 2026-08-25 02:57:36 UTC / 11:57:36 JST
- Explicit decision: 提案されたUI修正を実装するよう指示。
- Note: これは `21/22` の全細目を無条件に正本化する証拠ではない。どの提案内容を指していたかをPR/会話順序と合わせて監査する。
- Classification: `EVIDENCE_FOR_LATER_CHANGE`
- Affected: UI/UX

## UDE-007 捕獲成功でもBattle XPを付与

- User evidence: 2026-08-24 12:19 UTC / 21:19 JST
- Explicit decision:
  - 捕獲成功でも撃破/勝利と同額のBattle XPを付与する。
  - その戦闘で新しく捕まえた個体には、その戦闘XPを付与しない。
- Corroboration: `design/current/03-CAPTURE-DUPLICATES.md` §0 / §7 and `design/18-sol-pr15-fix-resolution.md` §3.
- Classification: `CONFIRMED_CHANGE`
- Affected: battle settlement / capture / XP

---

## 未回収・要継続調査

以下は現時点で「原本との差」が確認できるが、この証拠台帳だけでは最終承認を断定しない。

- 進化アイテム: 原本の探索ポイント + 20%抽選 + 地域別6回目保証 → currentの専用進化trial
- 追加学習ticket: 原本の追加1問ごと+1上限なし → currentの3問中2問で+1
- わ配布経済: 原本 core task/star、all-clear/silver、extra4問3正解/gold → current design/runtimeとの差
- ボス解放: 原本の地域別学習進行12pt + unique skill 2 → currentの探索クリア条件との差
- duplicate capture の `なかまにする / おうえんにかえる` と育ちのかけら

これらは別Workerが baseline / later user evidence / runtime を照合し、司令塔が最終判断する。
