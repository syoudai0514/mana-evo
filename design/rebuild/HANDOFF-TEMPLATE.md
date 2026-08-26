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

## Required execution capabilities
このWork Itemを**Acceptanceまで完了するために本当に必要な能力**を先に列挙する。

- GitHub read/write:
- code/script execution:
- build/test:
- image generation/editing:
- binary file handling:
- browser/device/manual verification:
- deployment/external service:
- other:

着手時に利用可能能力を確認する。Acceptanceに必須の能力がない場合は、長時間の代替作業へ進む前に `BLOCKED CAPABILITY` として司令塔へ返す。

設計資料、prompt、generation packet、mock、レビュー文書は、それ自体が明示的Deliverableでない限り、必須の実画像・実装・実機確認・デプロイ結果の代替にはならない。

## Canonical constraints
- 現行ソースを正本と決めつけない。
- 原本との差異は、承認根拠なしに仕様化しない。
- 指定scope外を勝手に再設計しない。
- UI変更では旧UIへ新UIを足すだけの実装を禁止する。不要要素を削除・分離する。
- 仕様不明は `BLOCKED DECISION` として列挙し、推測実装しない。
- 現在Work ItemのAcceptanceを満たしていないのに、次Work Itemまで進めない。
- PR作成、CI PASS、設計資料完成だけでWork Item完了と扱わない。

## Scope
### Do
- 

### Do not
- 

## Acceptance
- 

### Required tangible evidence
Acceptanceを満たしたことを示す、実在する成果物・確認証拠を列挙する。

- source/runtime artifact:
- generated image/binary artifact:
- screenshot/manual/device evidence:
- deployment/release evidence:
- user visual approval required: yes / no
- other:

## Required tests
- 

## Deliverables
- commit(s)
- test result
- changed files
- unresolved decisions
- Acceptanceに必要な実成果物
- `WORKER-REPORT`（下記形式）

## WORKER-REPORT

### Completed
- 

### Acceptance status
- Met: YES / NO / PARTIAL
- Missing gate/evidence:

### Capabilities
- Available and used:
- Required but unavailable:

### Evidence
- tests:
- build:
- screenshots/manual verification:
- actual images/binaries:
- deployment/runtime verification:
- user review/approval:

### Changed
- 

### Artifacts actually produced
- 

### Canonical differences found
- 

### BLOCKED CAPABILITY
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
- Acceptanceに必須の実行能力が現在のWorkerにない
