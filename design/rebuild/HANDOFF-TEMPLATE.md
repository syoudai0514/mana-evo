# ManaEvo Worker Handoff Template

別チャットへ **Worker作業** を渡すときは、この形式を使う。

> これはWorker用handoffであり、司令塔 / Reviewer交代用のプロジェクト記憶資料ではない。司令塔交代時は `REBUILD-START-HERE.md` の「司令塔 / Reviewer の復元プロトコル」を必ず実行する。

## Work item
- ID:
- Title:
- Repository:
- Branch:
- Base branch:
- Base HEAD SHA:
- Worker start HEAD SHA:
- Goal:

## Read first
1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/00-START-HERE.md`
4. 現在PhaseのWork Item計画文書
5. このwork itemに指定されたbaseline/current資料

`design/rebuild/WORK-QUEUE.md` はWork Item番号体系・履歴の索引であり、現在進捗のライブ正本として扱わない。

Monster Art / binary / release作業の場合は、追加で以下を読む。

- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
- `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`

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
- 古いhandoff/ZIP/chat記録のSHA・binaryをCURRENTとして再利用せず、着手時にfresh refetchする。
- 「生成済み」「ART READY」「登録済み」「FORMAL」「main」「Production」「live verified」を同義にしない。

## Scope
### Do
- 

### Do not
- 

## Current-state snapshot
作業開始時点の事実を固定する。後から推測で埋めない。

- canonical branch/ref:
- canonical HEAD SHA:
- target IDs/files:
- current state/counts:
- current raw SHA-256 / bytes (binary task):
- current runtime/deployment revision (release task):
- excluded IDs / explicit non-scope:
- related PRs/commits:

## Acceptance
- 

### Gate model
このWork Itemの本当の完了点と、前後のgateを明記する。

- Previous gate already proven:
- This work item's required gate:
- Next gate that is **not** included:
- First unsatisfied gate at start:

例: Monster Artでは `GENERATED → VISUAL QA → ART READY → REGISTERED → FORMAL → MAIN → DEPLOYED → LIVE VERIFIED` を分離する。

### Required tangible evidence
Acceptanceを満たしたことを示す、実在する成果物・確認証拠を列挙する。

- source/runtime artifact:
- generated image/binary artifact:
- artifact path / package name:
- artifact raw bytes:
- artifact raw SHA-256:
- dimensions/format/actual-alpha verification:
- manifest/checksum verification:
- screenshot/manual/device evidence:
- deployment/release evidence:
- exact production URL / revision endpoint:
- user visual approval required: yes / no
- other:

### Binary / Monster Art evidence (when applicable)
- speciesId(s):
- canonical identity/family/stage/type checked: YES / NO
- source/ref SHA checked fresh: YES / NO
- expected scope count:
- actual package/binary count:
- RIFF/WEBP:
- exact 512×512:
- actual alpha:
- safe crop / edge contact:
- scenery/background plate/collage check:
- detached/extra-character check:
- hidden RGB policy/check:
- bytes + SHA manifest一致:
- previous FORMAL/candidate archived when replacement required:
- provenance/history appended:
- idempotent already-matching items:
- unexpected species changes:
- manifest state before → after:
- FORMAL approval evidence:

## Required tests
- 

## Release verification (when applicable)
- repository target commit:
- merged to main: YES / NO / N/A
- current test result:
- production build result:
- deploy target/provider:
- deployment result:
- production HTTP/reachability:
- live revision/state checked:
- expected live SHA/revision:
- actual live SHA/revision:

> `deploy succeeded` だけでは `live verified` ではない。Productionが期待revisionを配信していることを別途確認する。

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
- Required gate:
- First unsatisfied gate:
- Missing gate/evidence:

### Capabilities
- Available and used:
- Required but unavailable:

### Baseline / final refs
- start ref/HEAD:
- final worker HEAD:
- target PR:
- main merge commit (if included):

### Evidence
- tests:
- build:
- screenshots/manual verification:
- actual images/binaries:
- raw bytes/SHA-256:
- manifest/checksum validation:
- repository refetch verification:
- deployment/runtime verification:
- live revision verification:
- user review/approval:

### Changed
- 

### Artifacts actually produced
- 

### Idempotent / unchanged targets
- 

### Unexpected changes
- count:
- IDs/files:

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
- binary/manifest/SHA/寸法等の最初の必須gateがFAILした
- actual visual reviewでidentity・scenery・collage・artifact問題が見つかった
- unexpected scope/species changeが検出された
- Productionが意図したmain/revisionを配信していない

FAIL後に後続gateを進めて「ほぼ完了」と報告しない。**first unsatisfied gateでfail closed**する。
