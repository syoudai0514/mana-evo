# Monster Art Maintenance Lanes V1 — Design Review

Status: **REVIEW REQUEST**  
Date: 2026-08-31  
Repository: `syoudai0514/mana-evo`

## 0. Review request

Please review this change independently before merge.

The purpose is to ensure future visual iteration does **not** repeat the 2026-08-31 multi-hour final-closeout workflow.

Target user experience:

```text
「m162をもっとかっこよく」
→ CURRENT/family auto-read
→ A/B/C
→ user selects B
→ ART READY ZIP
→ automated validation/replacement
→ PR/CI/main/Vercel/live verify
```

Also supported:

```text
「この3段進化を全部統一感ある感じに」
→ family sets A/B/C
→ user selects one set
→ 3 species handled as one replacement transaction
```

Future roster growth is treated separately so “add monsters beyond 238” does not get confused with FORMAL image replacement.

## 1. Current production baseline

This PR starts from the completed baseline:

- active species: `m001`–`m238`;
- `m239` excluded/reserved historical reference;
- FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0;
- existing artwork remains unchanged by this PR.

This PR must not change any production monster binary, current FORMAL SHA, or active roster.

## 2. Implemented — existing FORMAL replacement

New tool:

- `scripts/monster-art/formal-replacement.mjs`
- npm command: `npm run replace:monster-art`

Input is an **unzipped ART READY bundle**. ZIP remains an accepted cross-chat/cross-worker transport format.

Supported scope:

- one existing FORMAL species; or
- 2–3 existing FORMAL species belonging to the same CURRENT evolution family.

Unknown/new IDs are rejected and redirected conceptually to the roster-expansion lane.

## 3. Bundle contract

Schema: `ManaEvo.formal-art-replacement.v1`

Required:

- exact `scope` of 1–3 species;
- exact matching `.webp` filenames — extra WebPs fail;
- per-species bytes/SHA declaration;
- per-species `visualQa=PASS`;
- explicit user-selection approval evidence;
- `familyVisualQa=PASS` when scope > 1.

The manifest is not trusted as binary proof. The tool recomputes bytes/SHA and decodes incoming WebPs independently.

## 4. Pre-write fail-closed checks

Dry-run performs no mutation and checks:

1. canonical manifest asset count matches canonical speciesCount;
2. declared manifest counts are internally consistent;
3. every current FORMAL binary matches its `formalSha256`;
4. current revision manifest matches every current FORMAL SHA;
5. bundle file set exactly matches scope;
6. each target already exists and is FORMAL;
7. multi-target scope is one CURRENT family;
8. incoming RIFF/WEBP bytes/SHA match bundle declarations;
9. Playwright WebKit decodes actual incoming bytes;
10. decoded size is exactly 512×512;
11. actual transparency exists;
12. visible pixels exist;
13. visible bbox does not touch canvas edges;
14. current target provenance exists before mutation.

Semantic visual checks — correct species identity, cute/cool direction, background/scenery/collage, extra creature, family continuity — remain explicit visual QA instead of pretending heuristics can prove them.

## 5. Execute behavior

For each actually changed target:

- archive previous FORMAL bytes in history if not already archived;
- replace `public/monsters/mNNN.webp`;
- append provenance with old/new SHA and `formalReplacement: true`;
- keep state FORMAL;
- update current `formalSha256` and approval evidence;
- regenerate `public/monster-asset-revisions.json`;
- verify final complete FORMAL repository consistency;
- compare before/after binary map and require actual changed species = planned changed species.

Byte-identical entries become `ALREADY_MATCHES` and do not create duplicate history/provenance/revision churn.

The old candidate-ingestion path still refuses FORMAL assets; this PR does not weaken that guard.

## 6. 3-species transaction / rollback

A family bundle is intentionally not executed as three unrelated best-effort operations.

Before mutation, the tool snapshots every potentially touched file:

- target WebPs;
- target provenance;
- candidate-history target path;
- canonical monster asset manifest;
- revision manifest.

If a post-write step fails, all snapshotted files are restored.

Unit tests include a simulated revision-generation failure after writes and verify all three target binaries and the manifest return to their original bytes.

Limitation: filesystem snapshot/restore cannot guarantee atomicity across an OS/process hard crash. Operational protection remains branch/PR based; no local execution is considered released until CI/main/live verification.

## 7. Tests added

`tests/monster-art-formal-replacement.test.js` covers:

- 1–3 scope contract;
- single-species dry-run does not mutate;
- 3-stage same-family replacement;
- history/provenance/FORMAL/revision update;
- unrelated-family multi-bundle rejection;
- extra file rejection;
- SHA mismatch rejection;
- decoded 1024×1024 rejection;
- no-alpha rejection;
- edge-contact rejection;
- byte-identical idempotency;
- rollback after simulated post-write failure;
- unknown/new ID rejection.

## 8. Implemented — future roster expansion planning

New dry-run-only planner:

- `scripts/monster-art/roster-expansion-plan.mjs`
- npm command: `npm run plan:monster-roster -- --family-size 1|2|3`

It does not change production. It reads CURRENT manifest + description shards and allocates:

- append-only species IDs after all active/reserved IDs;
- next family number;
- resulting species/family counts.

Current expected result for a new 3-stage family:

```text
m239 remains reserved
next family = F084
next species = m240 / m241 / m242
238 + 3 = 241 active species after a future completed expansion
```

Planner tests verify m239 is skipped, additional reserved IDs are skipped, family size >3 is rejected, and stale canonical speciesCount fails closed.

## 9. Why roster expansion is not fully automated in this PR

Current game/runtime infrastructure deliberately contains 238-specific guards. Known examples:

- `scripts/generate-runtime-master.mjs` expects 238 growth rows;
- `scripts/finalize-monster-runtime.mjs` owns fixed 238 active IDs and fixed description shards;
- candidate ingestion/index and visual audit have current 238 guards;
- Phase-4 attribute queue is a 238/83 historical production contract;
- many tests assert the current roster.

Removing all of those now, without an actual product request for new content, would broaden this maintenance PR and risk the completed baseline.

The proposed future expansion uses two PRs:

1. **Roster Capacity PR** — make scope extensible while proving existing m001–m238 behavior/identity unchanged.
2. **New Family Content PR** — add the selected new family/master/art/runtime/world data as one declared scope.

See `docs/MONSTER-ROSTER-EXPANSION-LANE.md`.

## 10. Expected expansion user experience

When expansion is actually requested:

```text
User: 水タイプを3段進化で増やしたい
Assistant: existing familiesを読んで family concept A/B/C
User: B
Assistant: stage1/2/3 family art set A/B/C
User: 2番
Assistant/worker: metadata/art bundle → capacity/content PRs → CI → deploy/live verify
```

The user chooses product/visual direction. ID allocation, master edits, art bookkeeping and release validation remain worker/system responsibilities.

## 11. PR omission / regression policy

This design assumes scoped art PRs declare expected species before mutation.

Required invariant:

```text
missing expected species change = FAIL
unexpected species change = FAIL
```

A green generic test suite is not enough if the selected image was accidentally omitted from the PR.

For future expansion, existing species semantic changes must be zero unless separately declared.

## 12. Main protection note

`docs/REPOSITORY-RELEASE-GUARD.md` defines the desired one-person policy:

- PR required;
- `test-and-build` required;
- force push off;
- branch deletion off;
- required approving reviews = 0.

The connected GitHub tool available during implementation can read repository rulesets but cannot create/update them. Therefore this PR does **not** claim the physical GitHub Ruleset has been applied. That remains a repository-setting action, not silently simulated in code.

## 13. Non-goals

This PR does not:

- replace any of the 238 current images;
- change a current FORMAL SHA;
- add m239 or any new species;
- increase current roster size;
- change battle/evolution/world balance;
- make semantic visual judgment fully automatic;
- bypass PR/CI/main/live verification.

## 14. Review focus

Please specifically review:

1. Is 1 species / same-family up-to-3 scope the right FAST LANE boundary?
2. Is the bundle exact-scope validation sufficient to prevent cross-chat ZIP mistakes?
3. Is WebKit actual-binary QA sufficient for dimension/alpha/edge checks?
4. Does FORMAL→FORMAL replacement preserve history/provenance correctly?
5. Can idempotent input create duplicate history or revision churn?
6. Can a 3-species failure leave a partially updated family?
7. Is before/after whole-FORMAL SHA verification safe and appropriately strict?
8. Is rejecting unknown IDs from FAST LANE correct?
9. Is keeping m239 reserved and proposing m240+ the safest default?
10. Is two-PR roster expansion (capacity then content) safer than pre-refactoring the whole app now?
11. Are there other current hard-coded 238 assumptions that should be explicitly listed before first expansion?
12. Could PR scope/merge behavior still allow selected art to be omitted or unrelated art to be changed silently?

## 15. Acceptance for this PR

This PR is acceptable only if:

- current 238 production art/master state is unchanged;
- all current tests plus new tests pass;
- production build and current iPhone WebKit E2E remain green;
- replacement tool tests demonstrate fail-closed/idempotent/rollback behavior;
- expansion planner is dry-run only;
- documentation clearly separates replacement from expansion;
- no claim is made that roster >238 is already production-ready.
