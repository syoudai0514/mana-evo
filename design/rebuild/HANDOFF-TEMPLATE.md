# ManaEvo Worker Handoff Template

別チャットへ **Worker作業** を渡すときは、この形式を使う。

> これはWorker用handoffであり、司令塔 / Reviewer交代用のプロジェクト記憶資料ではない。司令塔交代時は `REBUILD-START-HERE.md` の「司令塔 / Reviewer の復元プロトコル」を必ず実行する。

## Work item
- ID:
- Title:
- Branch:
- Base:
- Goal:

## Read first
1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/00-START-HERE.md`
4. 現在PhaseのWork Item計画文書
5. このwork itemに指定されたbaseline/current資料

`design/rebuild/WORK-QUEUE.md` はWork Item番号体系・履歴の索引であり、現在進捗のライブ正本として扱わない。

## Canonical constraints
- 現行ソースを正本と決めつけない。
- 原本との差異は、承認根拠なしに仕様化しない。
- 指定scope外を勝手に再設計しない。
- UI変更では旧UIへ新UIを足すだけの実装を禁止する。不要要素を削除・分離する。
- 仕様不明は `BLOCKED DECISION` として列挙し、推測実装しない。
- 現在Work ItemのAcceptanceを満たしていないのに、次Work Itemまで進めない。

## Scope
### Do
- 

### Do not
- 

## Acceptance
- 

## Required tests
- 

## Deliverables
- commit(s)
- test result
- changed files
- unresolved decisions
- `WORKER-REPORT`（下記形式）

## WORKER-REPORT

### Completed
- 

### Evidence
- tests:
- build:
- screenshots/manual verification:

### Changed
- 

### Canonical differences found
- 

### BLOCKED DECISION
- 

### Suggested next work item
- 

## Stop / branch criteria
以下になったら無理に続行せず、報告して新チャットへ分岐する。
- scopeが別の大領域へ広がった
- 仕様判断が3件以上必要
- 変更が概ね10ファイル超
- 正本優先順位が判断不能
- 大規模な設計変更が必要
