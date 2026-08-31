# ManaEvo Monster Art — FAST LANE

Status: **IMPLEMENTED FOR REVIEW / NOT OPERATIONALLY ENABLED UNTIL MAIN RULESET IS APPLIED**  
Date: 2026-08-31

## Purpose

Do not repeat the 238-species final-closeout process for ordinary visual iteration.

Normal target experience:

```text
User: m162を最終進化らしくもっとかっこよく
→ CURRENT + full family auto-read
→ A / B / C
User: B
→ selected art finalized to 512 transparent WebP
→ ART READY ZIP
→ dry-run replacement validation
→ transactional FORMAL replacement
→ exact-scope PR CI
→ main
→ Vercel
→ live SHA + visual verify
```

The user makes art/product decisions. ZIP transport is allowed, but SHA bookkeeping, history, manifest/revision edits, PR scope checks and release verification are system/worker work.

## 1. Supported replacement scope

FAST LANE is for existing FORMAL art only:

- one species; or
- two to three species from one CURRENT evolution family.

For a one-species change, all CURRENT family members are still recorded as visual references. This prevents a ZIP generated against old family art from being applied after another family member changed.

Unknown/new IDs use `docs/MONSTER-ROSTER-EXPANSION-LANE.md` instead.

## 2. Bundle v2 is bound to the CURRENT state

Schema: `ManaEvo.formal-art-replacement.v2`.

Every bundle must contain:

- unique `transactionId`;
- `baseHeadSha` — Git HEAD used when the option was generated/selected;
- `intent: REPLACE`;
- exact replacement `scope`;
- `familyReferences` with `expectedCurrentSha256` for every CURRENT member of the target family;
- for every target: `expectedCurrentSha256`, selected new `sha256`, bytes, filename and `visualQa=PASS`;
- explicit selection approval evidence.

Example:

```json
{
  "schema": "ManaEvo.formal-art-replacement.v2",
  "transactionId": "art-m162-20260831-001",
  "baseHeadSha": "<40-char git sha>",
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
      "expectedCurrentSha256": "<old sha>",
      "sha256": "<selected new sha>",
      "bytes": 123456,
      "visualQa": "PASS"
    }
  },
  "approval": {
    "approved": true,
    "approvedBy": "repository owner via ChatGPT selection",
    "approvedAt": "2026-08-31T00:00:00Z",
    "source": "selected option B"
  }
}
```

If HEAD, target SHA, or any family-reference SHA changed, stop with `STALE_BUNDLE`. Never silently rebase an old image choice onto newer art.

## 3. No-op and idempotency semantics

`ALREADY_MATCHES` is no longer accepted merely because bytes happen to equal CURRENT.

Rules:

```text
current == expectedCurrent && new == expectedCurrent
→ FAIL: replacement unexpectedly byte-identical

current == new AND same transactionId exists in provenance
→ ALREADY_APPLIED

current == new AND transactionId not recorded
→ FAIL: ambiguous no-op

current == expectedCurrent AND new != current
→ CHANGE

otherwise
→ STALE_BUNDLE
```

This distinguishes a missing/incorrect selected image from a safe retry of the exact same transaction.

## 4. Actual image QA

The tool rechecks the actual incoming WebP; manifest claims are not proof.

Hard gates:

- RIFF/WEBP;
- under current size limit;
- decoded by Playwright WebKit;
- exactly 512×512;
- actual transparency;
- visible pixels exist;
- no visible edge contact;
- minimum transparent margin >= 4 px;
- declared bytes and SHA match actual bytes.

It also reports warnings for:

- margin below recommended 12 px;
- solid alpha in the outer 4 px band;
- rectangular-background suspicion based on high occupancy on all four sides of the visible bounding box.

Semantic identity, cute/cool direction, extra-creature/background interpretation and family continuity remain explicit visual QA; heuristics do not replace visual review.

A real WebKit integration test with transparent, fully opaque and edge-contact WebP fixtures runs in CI.

## 5. Provenance and history

Before replacement:

- target CURRENT binary must match manifest FORMAL SHA;
- revision manifest must match CURRENT FORMAL SHA;
- latest provenance asset SHA must match CURRENT FORMAL SHA;
- an existing history file named by old SHA must itself hash to that old SHA, otherwise FAIL.

Replacement provenance records:

- transactionId;
- baseHeadSha;
- old/new SHA;
- archive path;
- previous approval evidence;
- new approval evidence;
- `formalReplacement: true`.

## 6. 2–3 species transaction

A family set is one transaction, not three best-effort replacements.

Touched binaries, provenance, history, manifest, revision and change-plan files are snapshotted. A handled post-write failure restores all snapshotted files.

A process/OS hard crash cannot be made filesystem-atomic by this script; PR scope CI and repository history remain the outer safety layer.

## 7. Machine-readable PR change plan

A successful execute writes:

`design/rebuild/asset-production/change-plans/<transactionId>.json`

It records:

- transactionId;
- baseHeadSha;
- expectedSpecies;
- old/expected/new SHA per species;
- family reference SHAs;
- exact allowed changed files.

This is not optional release documentation. It is input to PR CI.

## 8. PR exact-scope CI

`npm run verify:monster-art-scope` compares the PR merge-base to HEAD.

For an art transaction it requires:

- exactly one changed transaction plan;
- plan `baseHeadSha` equals PR merge-base;
- changed `public/monsters/*.webp` IDs exactly equal `expectedSpecies`;
- changed manifest asset entries exactly equal `expectedSpecies`;
- changed provenance IDs exactly equal `expectedSpecies`;
- changed revision entries exactly equal `expectedSpecies`;
- history additions only for expected species and named by planned old SHA;
- current binary/manifest/revision SHA equals planned new SHA;
- base binary/manifest/revision SHA equals planned old SHA;
- no changed file outside `allowedChangedFiles`;
- missing expected change = FAIL;
- unexpected change = FAIL.

If release-state art files change without any transaction plan, CI fails.

This closes the gap where another monster change was already present on the branch before the replacement script ran, or was mixed in after execution.

## 9. Release completion

```text
SELECTED
→ BUNDLE V2
→ DRY RUN
→ EXECUTE + CHANGE PLAN
→ PR EXACT-SCOPE CI
→ TEST/BUILD/WEBKIT E2E
→ MAIN
→ PRODUCTION DEPLOYED
→ LIVE REVISION MATCH
→ LIVE VISUAL VERIFY
```

A generated image, a successful local replacement, a merged PR and a live deployment are different states.

## 10. Main Ruleset is an operational prerequisite

FAST LANE must not be called **operationally enabled** until GitHub `main` has a real Ruleset/branch protection with:

- Pull Request required;
- required status check: `test-and-build`;
- required approving reviews: 0;
- force-push disabled;
- branch deletion disabled.

This is intentionally zero extra approval clicks for one-person development.

The connected GitHub tool used for PR #133 can read Rulesets but cannot create/update them, so the repository setting cannot be truthfully applied from this tool session. Until that setting exists, the code may be merged after review, but production FAST LANE use remains **NOT ENABLED**.

## 11. Roster expansion is separate

Existing FORMAL replacement never creates new IDs. Future additions beyond the current 238 use the separate Roster Expansion Lane, with `m239` remaining reserved unless explicitly re-decided.

Current planner default for a new three-stage family is `m240/m241/m242`, F084. Actual >238 runtime support is intentionally deferred to a Roster Capacity PR followed by a New Family Content PR.

## Principle

**Make the common art decision easy, and make stale/partial/unscoped release states fail closed.**
