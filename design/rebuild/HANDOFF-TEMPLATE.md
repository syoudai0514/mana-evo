# ManaEvo Worker Handoff Template

別チャットへWorker作業を渡すときは、この形式を使う。

> **重要 — これはWorker用であり、司令塔交代用ではない。**
>
> 司令塔 / Reviewer を別チャットへ引き継ぐ場合、このテンプレートだけでは再建全体の文脈が不足する。必ず `REBUILD-START-HERE.md` と `design/rebuild/COMMANDER-HANDOFF.md` を読み、再建目的・正本順位・W-101以降の決定・現在Phase/gate・ユーザー発言の分類ルールまで復元してから作戦を立てること。

## Work item
- ID:
- Title:
- Branch:
- Base:
- Goal:

## Read first
1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/rebuild/WORK-QUEUE.md`
4. このwork itemに指定されたbaseline/current資料

## Canonical constraints
- 現行ソースを正本と決めつけない。
- 原本との差異は、承認根拠なしに仕様化しない。
- 指定scope外を勝手に再設計しない。
- UI変更では旧UIへ新UIを足すだけの実装を禁止する。不要要素を削除・分離する。
- 仕様不明は `BLOCKED DECISION` として列挙し、推測実装しない。
- ユーザーの質問・懸念・提案を、Workerが勝手に新仕様へ昇格させない。

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
