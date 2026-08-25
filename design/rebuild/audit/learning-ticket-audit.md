# Learning / Ticket / Kids Quest Migration Audit

- Worker: SOL② / Worker 2
- Scope: 学習・チケット・Kids Quest移植の差分調査のみ
- Audit date: 2026-08-25
- Repository: `syoudai0514/mana-evo`
- Runtime ref inspected: `main`
- Rebuild governance ref: `rebuild/canonical-governance`
- Baseline rescue ref inspected: `rebuild/w-001-final-corrected-baseline` / PR #35

> この文書は仕様を決定しない。現行source、現行design、古い原本のいずれも自動的に正本扱いしない。`REBUILD-START-HERE.md` / `DECISION-LOG.md` の優先順位に従い、証拠と未解決点を司令塔へ渡すための監査記録である。

## 0. 先に結論

### Baseline blocker

W-001 / PR #35 は `mana-evo-terra-FINAL-CORRECTED(3).zip` の実体を取得できておらず、`design/baseline/FINAL-CORRECTED/README.md` に以下を明記している。

- preserved original source files: **0**
- original-source manifest: **not generated**
- completeness: **BLOCKED / not yet verifiable**

したがって、本監査で `BASELINE` を原本ファイルから断定することはできない。原本内容を後続designやruntimeから逆算して作らない。

この制約のため、原本との一致を必要とする項目は原則 `UNRESOLVED` とする。ただし、GitHub上に「ユーザーが正式承認/確定」と明記された後続判断がある項目は、原本未取得でも優先順位1の証拠として `CONFIRMED_CHANGE` にできる。

### 強い後続証拠

1. PR #5 (`1e638b7...`) は「その後のユーザー承認」「今回ユーザーが確定した仕様」と明記し、次を固定している。
   - 新規バトル開始時にチケット1枚reserve
   - 敗北 / 明示的な逃走・やめる → 同じ期限の1枚を返却
   - 勝利 / 捕獲成功 → 消費確定
   - reload / Safari終了 / crash → `activeBattle` 再開、追加消費なし
   - 獲得日を含む7日間保持、期限近い順
   - daily ほしのわ+3 / 追加学習3正解ごと ほしのわ+1 / 単元MASTER ぎん+1 / むずかしいMASTER きん+1
2. PR #8 (`b8c658e...`) は初期縦切り `991e98a...` の「全科目合計5問」「自由学習1問正解=チケット+1」を誤った簡略化と記録し、Kids Quest基準へ戻したと説明している。
3. PR #9 (`8fdc4d8...`) はコピー済みKids Quest学習基盤が実行経路へ接続されず旧簡易 `src/study` が動いていた状態をP0/要件レベル問題として修正し、Kids Quest commit `ddfe594789890aef6958bf169bf50dccb72f818e` を学習sourceとして固定した。
4. 現行 `README.md` と `tests/full-kidsquest-runtime.test.js` は旧 `src/study` を現行画面へ再接続しないことを明記/検証している。したがって、旧 `src/study` 用テストは履歴・互換性証拠として読み、現行routingの証拠と混同しない。

### 判定サマリー

| 項目 | 判定 | 要点 |
|---|---|---|
| Kids Questから何を移植 | UNRESOLVED | B/C/D/Eは学習資産のみで一致。A原本未取得 |
| 1日の基本学習 | UNRESOLVED | 現行は5教科タスク。PR #8は簡略化回帰と記録。A未取得 |
| 科目数 | UNRESOLVED | 現行5タスク。A未取得 |
| 1科目あたり問題数 | UNRESOLVED | 国語/算数5、通常4、道徳2。A未取得 |
| 「わからない」 | UNRESOLVED | 現行あり。PR #8/#9は復元と記録。A未取得 |
| 難易度 | UNRESOLVED | 自動適応 + 保護者のみhard切替。A未取得 |
| 先取り | UNRESOLVED | grade/gradeMax + 保護者解放。A未取得 |
| 自由勉強 | UNRESOLVED | 現行チケット0。PR #8はfree ticketを回帰と記録。A未取得 |
| 章末/試練 | UNRESOLVED | ほしのしれん6問×別日2、合計12中9 + 単元条件。A未取得 |
| チケット基本付与 | UNRESOLVED | 5教科完了で3枚。A未取得 |
| 追加学習チケット | UNRESOLVED | 専用3問中2正解で+1。A未取得/明示承認証拠不足 |
| 日次上限 | UNRESOLVED | 現行extraは実質上限なし。current designに明文化なし、直接testなし |
| チケット有効期限 | CONFIRMED_CHANGE | PR #5でユーザー確定: 取得日含む7日、期限近い順 |
| チケット消費タイミング | CONFIRMED_CHANGE | PR #5でユーザー確定: 開始時reserve、成功時確定、中断resume |
| 敗北/逃走 | CONFIRMED_CHANGE | PR #5でユーザー確定: 同期限で返却 |
| 学習XP/報酬 | IMPLEMENTATION_DRIFT | PR #5承認の「追加3正解→ほしのわ+1」が現行full runtimeから消失。後続明示承認なし |
| 保護者設定 | UNRESOLVED | B/C/D/EはPIN・学年・先取り・hard・音声等で整合。A未取得 |

---

## 1. Kids Questから何を移植する設計だったか

**BASELINE**
- 原本payload未取得のため不明。W-001 / PR #35が0 source filesと明記。推測しない。

**CURRENT DESIGN**
- `design/00-README.md`: Kids Quest完成済み学習runtimeを使用し、ManaEvo都合で簡略化しない。
- `docs/KIDS_QUEST_STUDY_MIGRATION.md`: 学習専用sourceを `src/kids-quest-study/` に保持し、`itemKey` / `unitId` を互換境界とする。学習データ、学年、授業、SRS、難易度、learningUnits、review、trial、英語、TTS、学習UI候補を含む。
- 同台帳は battle / battleTickets / monsters / weapons / missions / planets 等のKids Questゲーム固有資産を移植対象外とする。
- ただし同台帳の「段階接続中」「自由学習でticket+1」はPR #9/#8より古い履歴記述なので、現状記述としてはstale。

**RUNTIME**
- `src/kids-quest-study/SOURCE_COMMIT.txt` = `ddfe594789890aef6958bf169bf50dccb72f818e`。
- `src/App.jsx` は `ActivityPlayer`, `FreeStudyScreen`, `ReviewScreen`, `ChapterTestScreen`, `EnglishDictionaryScreen` を `src/kids-quest-study/` から直接使用。
- game側は `src/game/*` に分離し、学習から報酬bridgeのみ行う。

**TESTS**
- `tests/kidsquest-snapshot.test.js`: source commit SHA形式、SRS/difficulty委譲、relative import解決、game-specific Kids Quest filesがsnapshotにないことを検証。
- `tests/full-kidsquest-runtime.test.js`: Appが旧 `src/study/engine.js` / `questions.js` をimportしないことを検証。

**CHANGE EVIDENCE**
- commit `3adf516...`: Kids Quest mainから学習専用source 49 filesを取り込み、ゲーム固有資産を除外したと記録。
- PR #9: copied-but-not-routed状態をP0として修正し、full learning runtimeを接続。

**判定: UNRESOLVED**
- B/C/D/Eは「学習だけ移植、ゲームはManaEvo」で強く整合するが、Aが未取得のため原本からの同一/変更を確定しない。

## 2. 1日の基本学習

**BASELINE**
- 原本payload未取得。断定不可。

**CURRENT DESIGN**
- `design/00-README.md`: 今日の基本は5教科タスク。
- `README.md`: 5つの教科タスクをすべて完了して基本学習完了。
- `design/06-battle-and-progression-design.md` §10には古い表現「今日の基本5問完了」が残るため、current design内部にstale wordingあり。

**RUNTIME**
- `src/kids-quest-study/engine/missions.js`: `CORE_TASK_COUNT = 5`。
- `src/App.jsx` StudyHub: remaining 5 subject tasksから子どもが順番を選択可能。
- `GameContext.jsx`: core taskをすべてclearした時点で `coreDone`。

**TESTS**
- `tests/full-kidsquest-runtime.test.js`: daily mission = five tasksを固定。
- `tests/kidsquest-flow.test.js`: “five subject tasks, not five total questions”を回帰テスト。

**CHANGE EVIDENCE**
- commit `991e98a...`: 初期縦切りで簡略学習を導入。
- PR #8: 「全科目合計5問」は誤った簡略化だったと明記し、5教科タスクへ復元。
- PR #9: full Kids Quest runtimeへrouting。

**判定: UNRESOLVED**
- 後続の意図は非常に強いが、PR #8の「復元」がFINAL-CORRECTED原本と同一だったかはA未取得で検証不能。PR #8本文にもこの点の独立したユーザー承認記録はない。

## 3. 科目数

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- 基本学習は5教科タスク。
- 国語/算数を固定し、学年・曜日に応じた教科で5枠を構成。

**RUNTIME**
- `missions.js` `weeklyDomains()` は `yomu` / `suuji` を含め、道徳該当日や学年別electiveを加えて最大5タスク。

**TESTS**
- `full-kidsquest-runtime.test.js`: `tasks.length === 5`。

**CHANGE EVIDENCE**
- PR #8/#9で5教科ミッションを復元/完全接続。

**判定: UNRESOLVED**
- A不在のためSAMEは付けない。

## 4. 1科目あたり問題数

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/00-README.md` / `README.md`: 国語・算数各5問、通常教科各4問、道徳は該当日2問。

**RUNTIME**
- `missions.js`: `QUESTIONS_PER_TASK = 4`; `yomu/suuji = 5`; `doutoku = 2`。

**TESTS**
- `full-kidsquest-runtime.test.js`: 上記問題数を直接assert。

**CHANGE EVIDENCE**
- PR #8: compatibility adapterの `questionCount: 1` を撤回し、Kids Quest基準へ復元。
- PR #9: 同じ数をfull runtimeに固定。

**判定: UNRESOLVED**
- B/C/D/Eは一致するがA不在。

## 5. 「わからない」

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/00-README.md`: `わからない` を残し、誤答→解説→補強→後日復習へ。
- `README.md`: 正解/解説を見せ、再回答/補強/後日の復習につなげる。

**RUNTIME**
- `ActivityPlayer.jsx`: `🤔 わからない（こたえを みる）` を表示。
- `handleDontKnow()` は初回をmissとして記録し、正解を見せ、reinforcement/review対象へ送る。

**TESTS**
- `full-kidsquest-runtime.test.js` はActivityPlayer接続を固定。
- 旧 `tests/learning.test.js` は「誤答→解説だけでは完了不可」「正しいretry」「suspicious時の別確認」を検証するが、これは現行画面ではないlegacy `src/study` 用。学習原則の履歴証拠としてのみ扱う。

**CHANGE EVIDENCE**
- PR #5: ユーザー承認反映として、誤答後は解説確認だけで完了せず正しい再回答が必要と記録。
- PR #8: `わからない` を「復活」と明記。
- PR #9: full ActivityPlayerへ接続。

**判定: UNRESOLVED**
- `わからない` 自体の現行存在は確実。ただしFINAL-CORRECTED Aとの関係を確認できないため、原本からのSAME/CHANGEは未確定。

## 6. 難易度

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/07-parent-controls.md`: 子どもは `ふつう / むずかしい` を変更不可。保護者のみ変更。
- 通常学習内では正誤履歴に応じて自動調整し、hardは別学習台帳。

**RUNTIME**
- `difficulty.js`: internal level 1〜12、start 2。直近4問中3正解で上昇、直近5問中3missで0.5低下、missに応じヒント増加。
- `ParentScreen.jsx`: normal/hard切替は保護者画面のみ。hardは別習熟度/復習台帳。

**TESTS**
- `tests/learning.test.js`: adaptive difficulty上昇/ヒント増加をlegacy互換として検証。
- `tests/full-kidsquest-runtime.test.js`: full learning stateと保護者境界を検証。

**CHANGE EVIDENCE**
- commit `991e98a...` / `3adf516...`: Kids Quest SRS/difficultyの移植。
- PR #9: full adaptive runtime + hard separate ledger接続。

**判定: UNRESOLVED**
- B/C/D/E整合。A不在。

## 7. 先取り

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/07-parent-controls.md`: 必須単元 + ほしのしれんで次学年を解放。子ども自身は学年変更不可。
- 保護者は `SET_GRADE`, `FORCE_GRADE_MAX`, `LOWER_GRADE_MAX` を使用可能。

**RUNTIME**
- `GameContext.jsx`: `grade`, `gradeMax`, `SET_GRADE`, `FORCE_GRADE_MAX`, `LOWER_GRADE_MAX`, `SET_MIN_SELECTABLE_GRADE`。
- `ParentScreen.jsx`: 先取り解放・戻し・学習学年選択。
- StudyHubは設定変更UIを持たない。

**TESTS**
- `full-kidsquest-runtime.test.js`: child hubにgrade/advance actionがないこと、parent側にあることをassert。

**CHANGE EVIDENCE**
- PR #9: parent ahead-grade controlsをfull runtimeへ接続。

**判定: UNRESOLVED**
- A不在。

## 8. 自由勉強

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/00-README.md` / `README.md`: 自由勉強は好きな教科、チケット0枚。

**RUNTIME**
- `missions.js`: `buildFreeTask()` = 4問task。
- `App.jsx`: 「じゆうべんきょう / 好きな教科・チケットなし」。
- `GameContext.jsx`: `kind === free` にticket reward処理なし。

**TESTS**
- `full-kidsquest-runtime.test.js`: free task 4問、ticket mintしない構造を固定。
- `learning.test.js` にもfree ticket=0のlegacy回帰あり。

**CHANGE EVIDENCE**
- 初期縦切り `991e98a...` はfree study 1正解でticket+1を導入。
- PR #8はこれを「誤って簡略化」と明記して削除。

**判定: UNRESOLVED**
- 現行意図は強いが、A原本未取得かつPR #8の変更に独立したユーザー承認記録がGitHub上で見つからないため、司令塔判断待ち。

## 9. 章末 / 試練

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `README.md`: `ChapterTestScreen` = ほしのしれん。1日6問、別日2回、合計12問中9問 + 必須単元条件。
- `design/07-parent-controls.md`: 必須単元 + ほしのしれんを学年解放条件とする。

**RUNTIME**
- `GameContext.jsx`: `STAR_TRIAL_QUESTIONS = 6`, `STAR_TRIAL_ROUNDS = 2`, `STAR_TRIAL_PASS_CORRECT = 9`。
- `learningUnits.js` `promotionResult()`: total >= 12, correct >= 9、required domains、missing unitsをすべてgateに含む。
- `unitReady()`: attempts >=4、first-attempt correct >=3、成功日2日以上、複数item unitでは2種類以上。

**TESTS**
- `full-kidsquest-runtime.test.js`: STAR_TRIAL_RESULT / grade advancement stateを固定。

**CHANGE EVIDENCE**
- PR #9: ほしのしれん「別日6問×2、12問中9＋単元条件」をfull runtimeへ接続。

**判定: UNRESOLVED**
- A不在。

## 10. チケット基本付与

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/00-README.md`: 基本5教科完了でバトルチケット3枚 + ほしのわ3個。
- `README.md`も同一。

**RUNTIME**
- `GameContext.jsx` `CLEAR_TASK(core)`: 最終core task完了時にreward ID `daily:<date>`、`ticketDelta: 3`, `captureItemDelta.star: 3` をenqueue。
- `App.jsx` reward bridge → `grantLearningReward()`。

**TESTS**
- `kidsquest-flow.test.js`: 全slot完了まで0、最後で3 tickets + 3 starを検証（legacy bridge guard）。
- `review-hardening.test.js`: reward ID冪等性を検証。

**CHANGE EVIDENCE**
- PR #8: 5教科task全完了報酬へ移行。
- PR #26: learning reward bridgeをreward IDで冪等化。

**判定: UNRESOLVED**
- 現行B/D/Eは一致するが、基本ticket 3枚自体のFINAL-CORRECTED根拠/後続明示承認をA/Cから確定できない。

## 11. 追加学習によるチケット

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/00-README.md` / `README.md`: 追加チャレンジ3問中2問正解でticket+1。
- 自由勉強とは分離。

**RUNTIME**
- `missions.js` `buildExtraTask()` = 3問。
- `GameContext.jsx` `CLEAR_TASK(extra)`: coreDoneかつ非suspicious、accuracy >= 2/3で `ticketDelta: 1`。
- `App.jsx`: 「ついかチャレンジ（3もん中2もん → 🎫+1）」。

**TESTS**
- `kidsquest-flow.test.js`: 3問中2正解/3正解で+1、0/1正解で0。
- `full-kidsquest-runtime.test.js`: extra task = 3問。

**CHANGE EVIDENCE**
- PR #8: free study ticketを廃止し、専用3問中2問のextra challengeへ分離。

**判定: UNRESOLVED**
- A不在。PR #8の理由は明確だが、後続ユーザー明示承認のGitHub証拠は未確認。

## 12. 日次上限

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/00-README.md` / `README.md` は基本3枚とextra +1条件を記載するが、extra ticketの日次上限を明文化していない。
- `OKAWARI_MAX = 6` は「おかわり学習」の回数上限であり、extra ticket challengeの上限ではない。

**RUNTIME**
- `GameContext.jsx`: `daily.extraIndex` は成功ごとに増えるがcap checkなし。
- `App.jsx`: `daily.coreDone` 後のextra challenge CTAはextraIndex上限条件なし。
- したがって現行runtimeは実質「追加ticket上限なし」。

**TESTS**
- extraの3問/2正解条件はあるが、「1日N枚まで」または「無制限」を直接固定するtestは確認できない。

**CHANGE EVIDENCE**
- PR #8/#9はextra challenge条件を記録するが、日次capの明示判断は見つからない。

**判定: UNRESOLVED**
- runtimeの挙動を仕様へ昇格しない。司令塔で明示判断が必要。

## 13. チケット有効期限

**BASELINE**
- exact payload未取得のため原本値は不明。

**CURRENT DESIGN**
- `design/00-README.md` / `README.md`: 獲得日を含む7日間保持、期限近い順。

**RUNTIME**
- `progression.js`: `TICKET_TTL_DAYS = 7`; grantは `expiresDay = earnedDay + 7`; valid条件は `expiresDay > today`。
- earned day〜day+6が有効、day+7開始時に失効。grantは期限順sort。

**TESTS**
- `game.test.js`: day+6有効、day+7失効をassert。
- nearest-expiry ticket消費もassert。

**CHANGE EVIDENCE**
- PR #5本文: 「今回ユーザーが確定した仕様」として、獲得日を含む7日間保持・期限近い順を明記。
- `design/DESIGN-SOURCE-METADATA.txt`: 2026-08-23 user decisionを入力に含める。

**判定: CONFIRMED_CHANGE**
- FINAL-CORRECTED原本の旧値は未確認だが、rebuild優先順位1の「後続ユーザー確定」がGitHubに明示されているため、現在採用すべき後続判断として確認済み。

## 14. チケット消費タイミング

**BASELINE**
- exact payload未取得。原本挙動不明。

**CURRENT DESIGN**
- `design/06-battle-and-progression-design.md` §10 / `README.md`: 新規開始時に期限近い1枚をreserve、`activeBattle` 保存、reload/crash resume、勝利/捕獲成功で消費確定。

**RUNTIME**
- `engine.js` `startBattle()`: daily gate通過後 `consumeTicket()` を実行し、その出所を `battle.ticketSource` に保存、`activeBattle` 永続化。
- 実装上はgrant inventoryから開始時に1枚減らすが、敗北/明示離脱で元期限を使って戻せるため意味論としてreserve。

**TESTS**
- `game.test.js`: nearest-expiry消費、`activeBattle` reload persistence、win/capture時にticketが戻らないことを検証。

**CHANGE EVIDENCE**
- PR #5: ユーザー確定として「開始時reserve / 成功時確定 / 技術中断resume」を明記。

**判定: CONFIRMED_CHANGE**
- 後続ユーザー確定証拠あり。

## 15. 敗北 / 逃走時の扱い

**BASELINE**
- exact payload未取得。原本挙動不明。

**CURRENT DESIGN**
- `design/06...` / `README.md`: 敗北・明示的なやめる/逃げるはreserve ticket返却。

**RUNTIME**
- `engine.js` `refundLostBattleIfNeeded()`: lost時に未返却ならrefund。
- `abandonBattle()`: 明示離脱でrefundしてactiveBattleをclear。
- `clearFinishedBattle()`: lost未返却をfail-safeでrefund。
- `progression.js` `refundTicket()`: original `earnedDay` / `expiresDay` を維持し、既に期限切れなら返さない。

**TESTS**
- `game.test.js`: explicit quitでoriginal expiry維持、lossでexactly once refundをassert。

**CHANGE EVIDENCE**
- PR #5: 「今回ユーザーが正式承認した仕様」として敗北/明示逃走は返却、勝利/捕獲成功は消費確定。
- `DESIGN-SOURCE-METADATA.txt`: “User decision 2026-08-23: ticket loss/explicit quit refunds”。

**判定: CONFIRMED_CHANGE**
- 後続ユーザー確定証拠あり。

## 16. 学習XP / 報酬

**BASELINE**
- exact payload未取得。学習XPとMana/ゲームXPの元設計関係を確認できない。

**CURRENT DESIGN**
- `design/00-README.md`: daily 3 tickets + star 3、unit MASTER silver、hard MASTER gold。
- `README.md`: 同様に学習完了/extra/Masterをgameへbridge。
- 現行designには `grantLearningReward()` のMana数値（ticket 1枚につきMana+5、unit MASTER +40、hard MASTER +80）の正本記述を確認できない。
- `design/06` のXPはbattle/progression XPであり、「学習XP」と同一とは断定しない。

**RUNTIME**
- `GameContext.jsx` stateに `xp: 0` は存在するが、今回確認範囲ではfull learning runtimeのANSWER/CLEAR_TASKからこのlearning `xp` を増やす処理を確認できない。
- `progression.js` `grantLearningReward()`:
  - ticketDelta > 0 → ticket付与 + Mana `ticketDelta * 5`
  - unitMastered → Mana +40 + silver ring +1
  - hardMastered → Mana +80 + gold ring +1
  - daily full clearは star +3
  - current extra challengeはticket +1のみでstar追加なし
- reward IDで冪等化。

**TESTS**
- `learning.test.js`: unit MASTER silver / hard MASTER goldを検証（legacy domain経由）。
- `review-hardening.test.js`: reward IDの冪等性をticket/star/manaで検証。
- current extra challengeで「3正解ごとstar+1」を保証するtestは確認できない。

**CHANGE EVIDENCE**
- PR #5は「今回ユーザーが正式承認した仕様」として:
  - daily → star +3
  - **追加学習3正解ごと → star +1**
  - unit MASTER → silver +1
  - hard MASTER → gold +1
  を明記。
- PR #8は後にfree-ticketを廃止しextra challengeを3問中2正解ticket+1へ変更したが、PR本文には「追加3正解ごとstar+1を廃止する」というユーザー明示承認はない。
- 現行full runtime `GameContext.jsx` はextra時starを付与しない。

**判定: IMPLEMENTATION_DRIFT**
- 少なくとも「追加学習3正解ごとstar+1」は、優先順位1の明示承認証拠(PR #5)と現行runtimeが食い違う。後続でこの報酬を撤回した明示的ユーザー承認証拠をGitHub上で確認できない。
- 学習XPそのもの、Mana +5/+40/+80はbaseline/current design根拠が不足しているため、この監査で新仕様として確定しない。

## 17. 保護者設定

**BASELINE**
- 不明（W-001 blocked）。

**CURRENT DESIGN**
- `design/07-parent-controls.md`: 子ども画面からgrade、gradeMax、normal/hard、TTS、profile、backup、道徳設定を変更不可。
- 4桁PIN gate。初回/再設定時は大人確認。
- 保護者メニュー: 学年・先取り / つくよみちゃん / むずかしさ / プロフィール / バックアップ。

**RUNTIME**
- `ParentGate.jsx` + `ParentScreen.jsx`。
- `ParentScreen`: grade/gradeMax、hard mode、TTS voice/rate/volume、profile、backup/import、道徳topic、SFX等。
- StudyHubはcurrent grade表示のみで設定actionなし。

**TESTS**
- `full-kidsquest-runtime.test.js`: child hubからgrade/ahead-grade/hard変更不能、homeからparent discoverable、4桁PIN、大人確認、parent action存在をassert。

**CHANGE EVIDENCE**
- PR #9: grade/gradeMax、parent ahead-grade controls、hard separate ledger、Tsukuyomi、profile/引継ぎをfull runtimeへ接続。
- PR #26: profile別game progressとbackup/restoreをhardening。

**判定: UNRESOLVED**
- B/C/D/Eは整合するがA未取得。原本とのSAME/CHANGEは司令塔へ保留。

---

## 18. Current design内のstale / conflict evidence

仕様決定ではなく、司令塔がcanonical化するときに見落とさないため記録する。

1. `docs/KIDS_QUEST_STUDY_MIGRATION.md`
   - 「コピー済みだが現行UIへ段階接続中」と記載するが、PR #9/current runtimeではfull connection済み。
   - 「自由学習1問正解 → ticket+1」「free正解時ticket+1を接続完了gate」とする古い記述が残るが、PR #8/current runtimeではfree ticket=0。
2. `design/06-battle-and-progression-design.md` §10
   - 「今日の基本5問完了」という古い表現が残る。
   - `design/00-README.md` / current runtimeは5教科タスク。
3. `tests/learning.test.js` / `tests/kidsquest-flow.test.js`
   - `src/study` legacy runtimeを直接検証するtestが残る。
   - これは current `README.md` と `full-kidsquest-runtime.test.js` により現行画面routingではないと明記されている。test件数だけを見てcurrent behaviorと誤認しないこと。

## 19. 司令塔へ渡す未決事項

このWorkerでは決めない。

1. **W-001 exact baseline payload取得後、全17項目のBASELINE欄を埋め直す。** 現時点の最大blocker。
2. PR #8/#9のKids Quest復元内容について、FINAL-CORRECTEDと同一なのか、原本後のユーザー変更なのかをbaseline + user approval evidenceで再判定する。
3. 追加ticketの日次上限。runtimeは実質無制限だがcurrent designに明文化/直接testがない。
4. PR #5承認の「追加学習3正解ごとstar+1」を維持するか。現行runtimeから欠落しており `IMPLEMENTATION_DRIFT`。
5. `grantLearningReward()` のMana +5/+40/+80およびlearning state `xp` の扱い。現行design根拠を確定してからcanon化する。
6. `design/06` の「基本5問」やmigration台帳の旧free-ticket記述を、canonical確定後に履歴文書として注記/移動するか判断する。今回のWorkerは既存designを変更しない。

## 20. 変更範囲確認

このWorkerが変更するのは本ファイルのみ。

- `src/**`: 変更なし
- `tests/**`: 変更なし
- 既存 `design/**`: 変更なし
- 新規: `design/rebuild/audit/learning-ticket-audit.md`

仕様修正・runtime修正・test修正は行っていない。
