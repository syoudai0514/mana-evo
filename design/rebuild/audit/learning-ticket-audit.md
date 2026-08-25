# Learning / Ticket / Kids Quest Migration Audit — Phase 1.5 re-audit

- Worker: SOL② / Worker 2
- Scope: 学習・チケット・Kids Quest移植の差分監査のみ
- Re-audit date: 2026-08-25
- Repository: `syoudai0514/mana-evo`
- Runtime ref inspected: `main`
- Rebuild governance ref: `rebuild/canonical-governance`
- PR: #36 / `rebuild/w-002-learning-ticket-audit`
- Constraint: `src/**` / `tests/**` は変更しない

> この文書はCURRENT仕様を新規決定する文書ではない。原本、後続のユーザー明示判断、Git/PR履歴、current design、runtime、testsを分離して比較し、`SAME` / `CONFIRMED_CHANGE` / `IMPLEMENTATION_DRIFT` / `UNRESOLVED` のいずれかへ分類するための監査記録である。

---

## 0. 判定ルールと今回使った証拠

### 0.1 正本順位

`REBUILD-START-HERE.md` / `DECISION-LOG.md` に従う。

1. ユーザーの明示決定
2. 原本 `mana-evo-terra-FINAL-CORRECTED`
3. 原本以降の、変更理由と承認を確認できる仕様
4. current canonical
5. data master
6. runtime
7. 過去レビュー / 完了報告

したがって、後続design・runtime・testsに存在するだけでは `CONFIRMED_CHANGE` にしない。

### 0.2 exact FINAL-CORRECTED の扱い

このWorker実行環境からZIP payload自体を再取得することはできなかった。一方、司令塔は exact `mana-evo-terra-FINAL-CORRECTED(3).zip` を直接展開し、32ファイルを確認済みである。

司令塔の `PHASE-1-COMMANDER-REVIEW.md` と PR #36 review では、原本 `08-gameplay-state-spec.md` / `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md` 等から少なくとも次を直接確認済みと記録している。

- Kids Quest 最新 `main` を学習 source of truth として移植する
- 学習ロジックをManaEvo側で独自に作り直さない
- core taskは5
- 基本ノルマ all clear で `ticket +3`
- 追加問題は **1問ごとに `ticket +1`**
- 追加ticketに日次上限なし
- core taskごとに `ほしのわ +1`
- core all clearで `ぎんのわ +1`
- 追加4問中3正解で `きんのわ +1`
- ticket lotは7日保持 / FEFO

上記は「後続designから原本を逆算」した値ではなく、exact ZIPを開いた司令塔による原本直接確認記録として扱う。

### 0.3 原本が委譲した Kids Quest source の直接確認

現行ManaEvoが固定している Kids Quest snapshot SHA は:

`ddfe594789890aef6958bf169bf50dccb72f818e`

`syoudai0514/kids-quest` の同commitを直接確認した。

`src/engine/missions.js`:

- core mission = 5 task
- 国語(`yomu`) / 算数(`suuji`) = 各5問
- 通常task = 4問
- 道徳 = 2問
- `buildExtraTask()` = 3問
- `buildFreeTask()` = 自由勉強、ticketなし

`src/screens/ActivityPlayer.jsx`:

- `わからない` を明示的に持つ
- `わからない` は初回missとして記録
- 正解 / 解説を提示
- 補強 / 後日SRSへ送る

`src/state/GameContext.jsx` / learning unit実装:

- `grade` / `gradeMax`
- 保護者による先取り解放
- `STAR_TRIAL_QUESTIONS = 6`
- `STAR_TRIAL_ROUNDS = 2`
- 2日分合計12問中9正解 + 必須単元条件による進級判定

原本はKids Quest学習ロジックそのものをsource of truthに指定しているため、これらは「ManaEvo後続designが勝手に追加した仕様」ではなく、委譲先学習sourceとの一致確認に用いる。

### 0.4 後続ユーザー明示判断

`USER-DECISION-EVIDENCE.md` には、この監査領域について原本を置換する新しい確定判断は回収されていない。むしろ同文書は次を「未回収・要継続調査」としている。

- 原本 `追加1問ごと+1 / 上限なし` と current `3問中2問で+1` の差
- 原本の `core task/star・all-clear/silver・extra4問3正解/gold` と current の差

一方、PR #5 は本文で **「今回ユーザーが確定した仕様」** と明示しており、学習報酬について次を後続承認済みとして扱える。

- daily完了 → `ほしのわ +3`
- 追加学習 **3正解ごと** → `ほしのわ +1`
- 単元MASTER → `ぎんのわ +1`
- むずかしいMASTER → `きんのわ +1`
- ticketは獲得日を含む7日、期限近い順

PR #8 / #9 は重要な実装履歴だが、PR本文だけを「ユーザー明示承認」とは扱わない。

---

## 1. 最終判定サマリー

| 項目 | 判定 | 結論 |
|---|---|---|
| Kids Quest移植境界 | `SAME` | 学習はKids Quest、ゲームはManaEvo、接点は報酬bridge。原本意図と現行active routingが一致 |
| 5教科 / 問題数 | `SAME` | 5task、国語/算数5、通常4、道徳2。委譲先Kids Quest sourceと現行runtimeが一致 |
| `わからない` | `SAME` | Kids Quest sourceにも現行active runtimeにも存在し、miss→解説→補強/SRS |
| 自由勉強 | `SAME` | Kids Quest source / currentともticket 0 |
| 追加チャレンジの学習task | `SAME` | Kids Quest source由来の3問extra taskをcurrentも使用。報酬方式は別判定 |
| 追加ticket方式 | `IMPLEMENTATION_DRIFT` | 原本は追加1問ごと+1無制限。currentは3問中2問でtask全体+1。後続明示承認を確認できない |
| ticket日次上限 | `SAME` | 原本は上限なし。current extraにも回数上限なし。`OKAWARI_MAX=6`はextraではない |
| 基本ノルマticket | `SAME` | 原本 / currentともall clearで+3 |
| ticket 7日保持 / FEFO | `SAME` | 原本 / PR #5 / current / testsが一致 |
| `わ`の学習報酬 | `IMPLEMENTATION_DRIFT` | 原本からの報酬変更自体はPR #5で承認済みだが、currentは「追加3正解ごとstar+1」を実装していない |
| 先取り | `SAME` | Kids Quest `grade/gradeMax` + 保護者解放をcurrentがそのまま使用 |
| ほしのしれん | `SAME` | 6問×別日2回、合計12問中9 + 必須単元条件。Kids Quest sourceとcurrent一致 |
| `src/kids-quest-study` の位置付け | `SAME` | active authoritative migrated learning runtime |
| `src/study` の位置付け | `SAME` | legacy save compatibility / regression evidenceのみ。active routing禁止 |
| stale migration documentation | `IMPLEMENTATION_DRIFT` | `docs/KIDS_QUEST_STUDY_MIGRATION.md` が旧 `src/study` active / 段階接続中 / free ticket等を残す。実装変更対象ではなく後続文書整理対象 |

**このPhase 1.5監査で、指定された重点項目に `UNRESOLVED` は残さない。**

ただし、これはW-001の原本32ファイル保存作業が完了したことを意味しない。W-001は別PRで継続中であり、本監査は司令塔のexact-ZIP直接確認記録と、原本が委譲したKids Quest sourceの直接確認を根拠に再判定した。

---

## 2. Kids Questから何を移植するか

### BASELINE

原本はKids Quest最新mainを学習 source of truth とし、学習ロジックをManaEvo側で独自再実装しない。

境界は「学習」と「ManaEvoゲーム」を分ける思想である。

### CURRENT DESIGN

`README.md` / `design/00-README.md` は:

- 学習フロー
- 問題
- 単元
- 難易度
- SRS / 復習
- 授業
- 自由勉強
- しれん
- 学年進行 / 先取り
- 音声

をKids Quest正本として扱い、battle / capture / monster / evolutionはManaEvo側とする。

### RUNTIME

`src/App.jsx` はactive学習画面をすべて `src/kids-quest-study/**` からimportしている。

ManaEvoとの接点は `pendingGameRewards` → `grantLearningReward()` のbridgeであり、学習エンジンをManaEvo用に置換していない。

### TESTS

`tests/full-kidsquest-runtime.test.js` は:

- active AppがKids Quest学習screenを使う
- `src/study/engine.js` / `questions.js` をactive Appからimportしない

ことを回帰固定している。

### 判定: `SAME`

現行active architectureは原本の移植境界と一致する。

---

## 3. 5教科 / 問題数

### BASELINE

原本はKids Quest学習sourceを正本とし、core task 5を持つ。

委譲先Kids Quest SHA `ddfe594...` の `missions.js` は:

- 1日5task
- 国語 5問
- 算数 5問
- 通常教科 4問
- 道徳 2問

### CURRENT

`src/kids-quest-study/engine/missions.js` も同じ構造。

### TESTS

`tests/full-kidsquest-runtime.test.js` が5taskと各問題数を直接assertする。

### 履歴

PR #8 は、初期縦切りの「全科目合計5問」を誤った簡略化として5教科taskへ戻した。

これは「PR #8だから正しい」のではなく、今回exact baseline + 委譲先Kids Quest sourceとの一致を確認できたためSAMEと判定する。

### 判定: `SAME`

---

## 4. `わからない`

### BASELINE

原本が委譲するKids Quest sourceの `ActivityPlayer.jsx` に `handleDontKnow()` が存在する。

挙動:

1. 初回missとして記録
2. 正解を表示
3. 解説を表示 / 読み上げ
4. 補強問題 / SRSへ送る

### CURRENT

現行 `src/kids-quest-study/screens/ActivityPlayer.jsx` はこの学習runtimeを継承している。

### 判定: `SAME`

「わからない」を削除する根拠はない。

---

## 5. 自由勉強

### BASELINE

Kids Quest sourceの `buildFreeTask()` は自由勉強を独立taskとして持ち、ticketは付けない。

### CURRENT

`StudyHub` は「じゆうべんきょう / 好きな教科・チケットなし」と表示し、free task完了からticket rewardをmintしない。

### 履歴

初期ManaEvo縦切りには `自由学習1問正解=ticket+1` が存在したが、PR #8で撤回された。

今回の判定根拠はPR #8本文ではなく、原本が委譲するKids Quest sourceとの一致である。

### 判定: `SAME`

---

## 6. 追加チャレンジと追加ticketを分離して判定

ここは混同すると結論を誤るため、**学習taskの形** と **ManaEvoゲーム報酬** を分ける。

### 6.1 追加チャレンジの学習task

Kids Quest sourceには `buildExtraTask()` があり、3問taskである。current `src/kids-quest-study/engine/missions.js` も同じ。

#### 判定: `SAME`

3問のextra taskそのものはKids Quest学習runtime由来。

### 6.2 追加ticket方式

#### BASELINE

exact FINAL-CORRECTED:

- 追加問題 **1問ごと** `ticket +1`
- 日次上限なし

#### CURRENT

`GameContext.jsx`:

- extra taskは3問
- core完了後
- `accuracy >= 2/3`
- suspiciousでない

場合に、**task全体で `ticket +1`**。

つまり現在は:

- 1問正解: 0枚
- 2問正解: 1枚
- 3問正解: 1枚

であり、原本の「1問ごと+1」とは明確に異なる。

#### CHANGE EVIDENCE

PR #8 は「3問中2問で+1」を実装しているが、`USER-DECISION-EVIDENCE.md` はこの差を未回収事項として残している。

PR #8本文だけをユーザー承認として扱うことは禁止されているため、原本を置換する明示承認は確認できない。

#### 判定: `IMPLEMENTATION_DRIFT`

CURRENT canonicalizationでは、別の後続明示承認が発見されない限り、原本の「追加1問ごと+1 / 上限なし」を優先候補とする。

**このWorkerでは実装修正しない。**

---

## 7. ticket日次上限

### BASELINE

追加ticketは上限なし。

### CURRENT

`daily.extraIndex` は増えるが、extra challengeに `EXTRA_MAX` 等の上限はない。core完了後は繰り返しextra taskを開始できる。

`OKAWARI_MAX = 6` は「おかわり」taskの上限であり、追加ticket challengeの上限ではない。

### 判定: `SAME`

現行の「3問中2問」という付与粒度はdriftだが、回数上限なしという別軸はbaselineと一致する。

---

## 8. 基本ノルマ ticket +3

### BASELINE

基本ノルマall clearで `ticket +3`。

### CURRENT

全core task終了時に一度だけ:

- `ticketDelta: 3`

を `pendingGameRewards` にenqueueし、ゲーム側bridgeでticket grantへ変換する。

### TESTS

legacy互換側の `tests/kidsquest-flow.test.js` にもall clear `ticketDelta === 3` の回帰がある。active routingの根拠は `full-kidsquest-runtime.test.js` + current `GameContext.jsx` とする。

### 判定: `SAME`

---

## 9. ticket 7日保持 / FEFO

### BASELINE

- 7日保持
- FEFO

### LATER EXPLICIT DECISION

PR #5でも「獲得日を含む7日間保持、期限近い順」をユーザー確定仕様として再確認している。

これはbaselineを変更したのではなく、同じルールを後続で再確認したもの。

### CURRENT

`src/game/progression.js`:

- `TICKET_TTL_DAYS = 7`
- `expiresDay = earnedDay + 7`
- `expiresDay > today` の期間だけ有効
- grantを `expiresDay`, `earnedDay` 順にsort
- `consumeTicket()` は先頭の有効lotを消費

### TESTS

`tests/game.test.js`:

- day+6は有効
- day+7開始時に失効
- nearest-expiry lotを先に消費

### 判定: `SAME`

---

## 10. `わ`の学習報酬

この項目は「baselineからの変更」と「currentが承認後仕様を実装できているか」を分けて読む必要がある。

### 10.1 BASELINE

exact FINAL-CORRECTED:

- core taskごと → `ほしのわ +1`
- core all clear → `ぎんのわ +1`
- 追加4問中3正解 → `きんのわ +1`

### 10.2 LATER EXPLICIT USER DECISION — PR #5

PR #5「今回ユーザーが確定した仕様」:

- daily完了 → `ほしのわ +3`
- 追加学習3正解ごと → `ほしのわ +1`
- 単元MASTER → `ぎんのわ +1`
- むずかしいMASTER → `きんのわ +1`

これは原本と異なるが、明示承認証拠があるため、**意図された報酬体系の変更部分は `CONFIRMED_CHANGE`**。

したがって、後続実装でbaselineのring economyへ機械的に巻き戻してはいけない。

### 10.3 CURRENT RUNTIME

現行は:

- daily core all clear → `ほしのわ +3` ✅
- unit MASTER → `ぎんのわ +1` ✅
- hard MASTER → `きんのわ +1` ✅
- 追加3正解ごと → `ほしのわ +1` ❌ **実装なし**

extra taskのcurrent rewardはticketだけで、`captureItemDelta` は空。

### 10.4 最終判定: `IMPLEMENTATION_DRIFT`

理由:

1. baseline→PR #5の報酬方針変更は明示承認済み
2. currentはその後続承認を一部だけ実装
3. 特に「追加学習3正解ごとstar+1」が欠落

よって「わの学習報酬」という現行実装全体は `IMPLEMENTATION_DRIFT`。

**修正時はbaselineへ戻すのではなく、PR #5の承認済み体系へ揃える。**

---

## 11. 先取り

### BASELINE

Kids Quest sourceを正本とするため、学年進行 / 先取りもKids Quest方式を引き継ぐ。

Kids Quest sourceには:

- `grade`
- `gradeMax`
- 必須単元台帳
- 保護者による上限解放
- 子ども画面からの任意上げを防ぐ制御

がある。

### CURRENT

現行 `src/kids-quest-study` に同機構があり、`StudyHub`から変更できず、保護者画面に先取り解放を置く。

### TESTS

`tests/full-kidsquest-runtime.test.js` は子ども画面でのgrade変更不可、parent controlを検証する。

### 判定: `SAME`

---

## 12. ほしのしれん

### BASELINE

Kids Quest学習sourceを正本とする。

source constants:

- 1 round = 6問
- 2 round
- 別日実施
- 合計12問中9正解
- 必須単元条件も満たす

### CURRENT

current `GameContext.jsx` / `ChapterTestScreen` が同じ方式。

### TESTS

`tests/full-kidsquest-runtime.test.js` はstar trial state / grade advancementをactive learning runtimeの一部として固定する。

### 判定: `SAME`

---

## 13. `src/kids-quest-study` と `src/study` の位置付け

### 13.1 `src/kids-quest-study`

- Kids Quest学習source snapshot
- `SOURCE_COMMIT.txt` でcommit固定
- active `App.jsx` が直接利用
- 現行の authoritative migrated learning runtime

**判定: `SAME`**

### 13.2 `src/study`

現在も:

- `engine.js`
- `questions.js`
- `kidsQuestMission.js`
- `srs.js`
- `difficulty.js`

が残る。

しかし `README.md` / tests / active imports は、これを:

- 旧セーブ互換
- 過去回帰テスト
- compatibility補助

としてのみ残し、**画面のactive execution pathへ戻さない** と固定している。

**判定: `SAME`**

存在自体は二重正本を意味しない。active authorityは `src/kids-quest-study` のみ。

### 13.3 stale documentation

`docs/KIDS_QUEST_STUDY_MIGRATION.md` には古い記述が残る。

例:

- `src/study` が実行runtimeであるかのような表
- 「段階接続中」
- 旧 `基本学習5問`
- 旧 `自由学習1問正解=ticket+1`

これは現在のactive architectureと矛盾する。

**判定: `IMPLEMENTATION_DRIFT`（documentation drift）**

このWorkerの成果物範囲外なので、今回その文書は変更しない。

---

## 14. PR #8 / #9 の扱い

### PR #8

有用な履歴事実:

- 全科目合計5問の簡略版を撤回
- 5教科taskを復元
- `わからない` を復元
- free ticketを撤回
- extra 3問中2問ticket+1を導入

ただし、**最後のextra reward方式を含め、PR本文だけをユーザー承認証拠とはしない。**

原本と一致する部分は `SAME`、原本と不一致で別の明示承認がない部分は `IMPLEMENTATION_DRIFT` とした。

### PR #9

有用な履歴事実:

- copied-but-not-routedだったKids Quest runtimeをactive Appへ接続
- source commit `ddfe594...` を固定
- 旧 `src/study` をactive routingから排除

これはexact baselineの「Kids Quest学習sourceをそのまま使う」という要求と一致するため、active routingは `SAME` と判定できる。

---

## 15. Current canonicalizationへ渡す具体的アクション

### A. 追加ticket

**要canonical修正候補**

- current: extra 3問中2問 → ticket+1
- baseline: extra **1問ごと** → ticket+1、上限なし
- later explicit approval: 未確認

したがって司令塔は、別の明示承認証拠が出ない限りbaseline方式をCURRENT候補とする。

### B. `わ`報酬

**baselineへ戻さない。PR #5の後続明示承認を優先する。**

CURRENT候補:

- daily complete → star +3
- additional learning 3 correctごと → star +1
- unit MASTER → silver +1
- hard MASTER → gold +1

current runtimeの不足は「additional learning 3 correctごと → star +1」。

### C. 学習runtime

維持:

- `src/kids-quest-study` = active source
- `src/study` = legacy / regression only
- Kids Quest学習ロジックをManaEvo側で再発明しない

### D. stale docs

後続canonicalizationで `docs/KIDS_QUEST_STUDY_MIGRATION.md` を整理する。

今回のWorkerでは監査成果物だけ変更する。

---

## 16. Scope verification

このPRでPhase 1.5 Worker 2が変更してよい成果物:

- `design/rebuild/audit/learning-ticket-audit.md`

変更禁止:

- `src/**`
- `tests/**`
- current design本体
- game/data master

本監査は実装修正を行わず、司令塔が `design/current/*` を作るための差分判定だけを提供する。
