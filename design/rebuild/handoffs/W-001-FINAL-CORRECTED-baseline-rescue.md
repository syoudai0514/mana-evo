# W-001 Worker Handoff / Report

## Work item
- ID: W-001
- Title: FINAL-CORRECTED原本救出・baseline化
- Branch: `rebuild/w-001-final-corrected-baseline`
- Base: `rebuild/canonical-governance`
- Goal: `mana-evo-terra-FINAL-CORRECTED(3).zip` を変更前BASELINEとして欠落なく保全し、完全性を後から検証可能にする。

## Read first
1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/rebuild/WORK-QUEUE.md`
4. `design/rebuild/HANDOFF-TEMPLATE.md`

## Canonical constraints
- 現行ソースを正本と決めつけない。
- 原本をCURRENT正本として機械的に復元しない。
- 原本ファイルは勝手に修正しない。
- 238/239等の仕様判断をW-001で行わない。
- `src`を変更しない。
- 他Workerの担当領域を変更しない。

## Scope
### Do
- 指定ZIPの完全展開
- `00-START-HERE.md` から全構成確認
- 設計書/scripts/data等の全把握
- `design/baseline/FINAL-CORRECTED/` への原本保存
- 原本ファイル一覧・SHA等のmanifest作成
- 現行`design/`に存在しない原本ファイル一覧作成
- baseline README作成
- branch/commit/push/PR
- 本handoff保存

### Do not
- `src`変更
- 現行仕様の巻き戻し
- 原本内容の修正
- 仕様判断
- mainへの直接merge

## Acceptance
- 原本が欠落なく保存されている。
- 原本source payloadが改変されていない。
- manifestでファイル数・SHAを検証できる。
- 現行`design/`との差分入口が作られている。
- baselineがCURRENT正本ではないことが明示されている。
- PRが作成されている。

## Required tests
- Archive inventory count verification
- SHA/hash verification of every preserved source file
- Source payload byte-preservation check where possible
- Current `design/` path comparison
- Confirm no `src/**` changed

## WORKER-REPORT

### Completed
- 再建governance 4文書を`rebuild/canonical-governance`から確認した。
- W-001専用branch `rebuild/w-001-final-corrected-baseline` を作成した。
- `design/baseline/FINAL-CORRECTED/README.md` を追加し、BASELINEであってCURRENT正本ではないこと、原本無改変ルールを明記した。
- 原本の実体が取得できない状態でmanifestや欠落判定を捏造しない方針を記録した。
- `src`は変更していない。

### Evidence
- tests: 原本ZIP未取得のためarchive/hashテストは未実施。
- build: 実装変更なしのため未実施。
- screenshots/manual verification: 対象外。
- repository search: `FINAL-CORRECTED` / `00-START-HERE` の原本コピーはrepository内で確認できず。
- active chat file workspace: 指定ZIPのretrievable file sourceなし。

### Changed
- `design/baseline/FINAL-CORRECTED/README.md`
- `design/rebuild/handoffs/W-001-FINAL-CORRECTED-baseline-rescue.md`

### Canonical differences found
- なし。原本source payload未取得のため比較未実施。

### BLOCKED DECISION
- 仕様判断のBLOCKEDはなし。
- **BLOCKED INPUT:** `mana-evo-terra-FINAL-CORRECTED(3).zip` の実体がこのworkerから取得できない。原本ファイル0件のため、完全展開・source manifest・SHA・現行designにない原本ファイル一覧は未作成。

### Suggested next work item
- W-002へ進めない。
- exact archive `mana-evo-terra-FINAL-CORRECTED(3).zip` がretrievableになった時点で、同じW-001 branch/PRを継続し、原本全件import → manifest/hash → current design path comparison → completeness verificationを完了する。
