# Monster Art Maintenance Lanes V1 — Independent Review Target

Status: **REQUEST CHANGES FIXES IMPLEMENTED / RE-REVIEW REQUIRED**  
Date: 2026-08-31  
Repository: `syoudai0514/mana-evo`  
PR: #133

## 0. Goal

Make ordinary art iteration lightweight:

```text
short request
→ CURRENT/family auto-read
→ A/B/C
→ user selects
→ ART READY ZIP
→ bound/validated replacement
→ exact-scope PR CI
→ main/deploy/live verify
```

Also support one evolution family as a single 2–3-species transaction, while keeping future roster expansion separate.

Current 238 production images/FORMAL state remain unchanged by this PR.

## 1. Review feedback addressed

The first review returned REQUEST CHANGES with three code blockers and one operational blocker.

### BLOCKER 1 — stale ART READY bundles

Fixed with bundle schema `ManaEvo.formal-art-replacement.v2`.

Required binding fields:

- unique `transactionId`;
- `baseHeadSha`;
- target `expectedCurrentSha256`;
- selected new `sha256`;
- `familyReferences` containing the expected CURRENT SHA of every member of the target CURRENT family.

Dry-run and execute both compare current HEAD to `baseHeadSha`. Targets and family references are compared to the bound expected SHA. Mismatch is `STALE_BUNDLE`.

This prevents an old cross-chat ZIP from overwriting newer FORMAL art.

### BLOCKER 2 — initial no-op vs retry

Fixed. Byte equality alone is no longer idempotency proof.

```text
current == expectedCurrent && new == expectedCurrent
→ FAIL: unexpected byte-identical replacement

current == new + same transactionId/new SHA recorded in provenance
→ ALREADY_APPLIED

current == new without transaction record
→ FAIL: ambiguous no-op

current == expectedCurrent and new differs
→ CHANGE

anything else
→ STALE_BUNDLE
```

This makes omitted/wrong selected art fail while preserving exact transaction retry safety.

### BLOCKER 3 — PR-level scope safety

Fixed with:

- generated `design/rebuild/asset-production/change-plans/<transactionId>.json`;
- `scripts/monster-art/verify-pr-scope.mjs`;
- CI step `npm run verify:monster-art-scope`.

The verifier compares PR merge-base to HEAD, not just pre/post script memory.

It requires:

- exactly one transaction plan for an art release PR;
- plan baseHeadSha == PR merge-base;
- changed monster binary IDs == expectedSpecies;
- changed manifest species == expectedSpecies;
- changed provenance IDs == expectedSpecies;
- changed revision species == expectedSpecies;
- history changes only for expected species / planned old SHA;
- base binary/manifest/revision == planned old SHA;
- HEAD binary/manifest/revision == planned new SHA;
- all changed files are in allowedChangedFiles;
- missing expected = FAIL;
- unexpected = FAIL.

If any release-state Monster Art file changes without a plan, CI fails.

This catches both “another monster was already changed before script execution” and “another change was committed after execute”.

### OPERATION BLOCKER 4 — actual main Ruleset

Not falsely claimed as fixed. The connected GitHub tool exposes Ruleset reads only, not create/update.

FAST LANE status is therefore explicitly:

**IMPLEMENTED FOR REVIEW / NOT OPERATIONALLY ENABLED UNTIL MAIN RULESET IS APPLIED**.

Required repository setting before production use:

- PR required;
- `test-and-build` required;
- approving reviews = 0;
- force-push disabled;
- branch deletion disabled.

PR #133 may be code-reviewed independently; operational activation is a repository-admin setting after/before merge as chosen, but must exist before FAST LANE is called safe for normal production use.

## 2. Strong recommendations also addressed

### P2 — existing history archive SHA

If `candidate-history/<id>/<oldSHA>.webp` already exists, the tool now hashes it and requires the bytes to equal `<oldSHA>`. Corrupt/mislabeled history fails before provenance is updated.

### P2 — provenance CURRENT consistency

Before replacement, the latest asset SHA recoverable from target provenance must equal CURRENT FORMAL SHA. Replacement events retain:

- transactionId;
- baseHeadSha;
- previous SHA/archive;
- previous approval evidence;
- new SHA;
- new approval evidence.

### P2 — transparent margin/background suspicion

Actual WebKit inspection now reports:

- bounding-box margins;
- `minMarginPx`;
- outer-4px solid-alpha ratio;
- bounding-box side occupancy;
- rectangular-background suspicion.

Hard minimum margin: 4 px. Recommended margin: 12 px warning. Rectangular suspicion is surfaced as a review warning rather than pretending the heuristic can safely reject every creature shape.

### P2 — actual WebKit integration test

Added `integration/monster-art-webkit.test.js` with real valid WebP fixtures:

- 512 transparent image with safe margin;
- fully opaque 512 image;
- transparent image whose visible pixels contact an edge.

CI installs WebKit and runs `npm run test:monster-art-webkit`. The Monster Art Visual Audit workflow installs both Chromium and WebKit and also runs the fixture test.

## 3. 1–3 species semantics

Existing FORMAL replacement only.

- scope 1: one target; familyReferences still bind the complete CURRENT family used as visual context;
- scope 2–3: all targets must belong to one CURRENT family;
- a family redesign uses one transactionId, one bundle, one change plan, one PR;
- unknown/new IDs fail and use roster expansion instead.

Handled post-write failures restore snapshotted binaries/provenance/history/manifest/revision/change-plan files.

## 4. Bundle example

```json
{
  "schema": "ManaEvo.formal-art-replacement.v2",
  "transactionId": "art-m162-20260831-001",
  "baseHeadSha": "<git sha>",
  "intent": "REPLACE",
  "scope": ["m162"],
  "familyReferences": {
    "m160": { "expectedCurrentSha256": "..." },
    "m161": { "expectedCurrentSha256": "..." },
    "m162": { "expectedCurrentSha256": "..." }
  },
  "species": {
    "m162": {
      "file": "m162.webp",
      "expectedCurrentSha256": "<old>",
      "sha256": "<new>",
      "bytes": 123456,
      "visualQa": "PASS"
    }
  },
  "approval": {
    "approved": true,
    "approvedBy": "repository owner via ChatGPT selection",
    "approvedAt": "...",
    "source": "selected option B"
  }
}
```

## 5. Change-plan example

Execute generates:

```json
{
  "schema": "ManaEvo.monster-art-change-plan.v1",
  "transactionId": "art-m162-20260831-001",
  "baseHeadSha": "<PR base>",
  "intent": "REPLACE",
  "expectedSpecies": ["m162"],
  "species": {
    "m162": {
      "oldSha256": "...",
      "expectedCurrentSha256": "...",
      "newSha256": "..."
    }
  },
  "allowedChangedFiles": ["..."]
}
```

PR CI treats this as executable scope evidence, not a prose report.

## 6. CI changes

General CI:

- checkout fetch-depth 0;
- exact-scope Monster Art PR verification on pull_request;
- normal tests/build/release readiness;
- install WebKit;
- real Monster Art WebKit fixture integration;
- iPhone WebKit E2E.

Monster Art Visual Audit:

- remains validation-only (`contents: read`);
- no branch mutation/auto-commit;
- fetch-depth 0;
- exact-scope verifier on PR;
- installs Chromium + WebKit;
- real WebKit replacement QA fixture test;
- uploads audit evidence only as Actions artifact.

## 7. Tests added/updated

Unit coverage now includes:

- v2 transaction/base/current binding;
- stale base HEAD rejection;
- stale target SHA rejection;
- initial byte-identical replacement rejection;
- exact same transaction retry = ALREADY_APPLIED;
- 3-stage family replacement;
- previous approval evidence retention;
- unrelated-family rejection;
- extra WebP/SHA mismatch rejection;
- size/alpha/edge/<4px margin rejection;
- corrupt existing history rejection;
- provenance CURRENT mismatch rejection;
- post-write rollback;
- unknown/new ID rejection;
- PR exact-scope pass;
- unrelated binary in branch rejection;
- release-state change without plan rejection.

Real WebKit integration uses actual decoded WebP fixtures rather than a mocked inspector.

## 8. Roster expansion lane

Unchanged in principle from first review and still intentionally only a planner in PR #133.

- m239 remains reserved/excluded unless explicitly re-decided;
- next default 3-stage family: m240/m241/m242, F084;
- no current image/master/runtime roster change;
- actual expansion remains two PRs:
  1. Roster Capacity;
  2. New Family Content.

This PR does not pretend >238 is production-ready.

## 9. Non-goals / current production safety

PR #133 must not change:

- any current `public/monsters/mNNN.webp`;
- current monster asset manifest state/SHA;
- current revision values;
- runtime/gameplay/balance;
- active roster size;
- m239 status;
- production deployment.

Expected current roster semantic/image changes: **0**.

## 10. Re-review focus

Please specifically verify:

1. stale ZIP cannot overwrite a newer target/family state;
2. initial no-op cannot masquerade as idempotency;
3. exact same transaction can safely be retried;
4. generated change plan is sufficient evidence for PR scope;
5. `git diff base...HEAD` guard catches pre-existing and post-execute unrelated art changes;
6. corrupt history/provenance mismatch fail closed;
7. 4px hard margin + warning heuristics are appropriately conservative;
8. actual WebKit integration really runs in CI;
9. audit CI remains validation-only;
10. main Ruleset is still accurately represented as an external operational prerequisite, not falsely marked complete.
