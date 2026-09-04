# ManaEvo Monster Art Maintenance Runbook

Status: **CURRENT PROCEDURE AFTER PR #133 REVIEW; FAST LANE USE REQUIRES MAIN RULESET**

Use this for targeted replacement of existing FORMAL Monster Art. Do not rerun the 238-species closeout for ordinary cosmetic iteration.

## 1. Start from CURRENT

Fresh-read:

- current `main` HEAD;
- target manifest FORMAL SHA;
- target/current family metadata;
- every family member's current FORMAL SHA and image;
- target provenance/history;
- current style lock.

Do not use an old chat SHA or ZIP as CURRENT.

## 2. Generate and select before repository mutation

From a short request, generate 2–3 options without GitHub mutation. For a family set, review the set together.

The selected option/set becomes the visual approval event. Then finalize exact 512×512 transparent WebP and perform visual QA.

## 3. ART READY ZIP contract

ZIP transport is allowed and convenient across ChatGPT/worker sessions. The ZIP is only a container; its metadata is revalidated.

Use bundle schema `ManaEvo.formal-art-replacement.v2` with:

- unique transactionId;
- baseHeadSha;
- intent REPLACE;
- exact 1–3 target scope;
- expectedCurrentSha256 per target;
- new SHA/bytes per target;
- all CURRENT family member SHAs under familyReferences;
- user-selection approval evidence;
- visual QA PASS.

Never manually edit these values from memory; derive them from CURRENT and actual bytes.

## 4. Dry-run

After ZIP extraction:

```bash
npm run replace:monster-art -- --bundle-dir /path/to/unzipped-bundle
```

Dry-run fails on:

- stale base HEAD;
- stale target or family-reference SHA;
- wrong/new ID;
- unrelated family in multi-target bundle;
- unexpected extra WebP;
- bytes/SHA mismatch;
- bad WebP/decode/dimension/alpha;
- visible edge contact or margin under 4 px;
- current manifest/revision mismatch;
- provenance latest SHA mismatch;
- ambiguous or accidental no-op.

Warnings for tight margins/rectangular-background suspicion must be visually reviewed before execute.

## 5. Execute

```bash
npm run replace:monster-art -- --bundle-dir /path/to/unzipped-bundle --execute
```

Execution:

- validates the same base HEAD again;
- verifies/reuses old history only if its actual SHA is correct;
- archives old FORMAL binary when needed;
- replaces only target binary/binaries;
- appends transaction-bound provenance including previous approval evidence;
- updates target FORMAL SHA/approval;
- regenerates revisions;
- verifies whole FORMAL repository consistency;
- writes `change-plans/<transactionId>.json` for PR CI;
- rolls back snapshotted files on handled post-write failure.

A repeat of the exact transaction is `ALREADY_APPLIED` only when the same transactionId/new SHA exists in provenance. A coincidental byte-identical bundle is a failure.

## 6. PR gate

Create one scoped PR from the same base. Do not mix unrelated code/content into an art replacement PR.

CI runs:

```bash
npm run verify:monster-art-scope
npm test
npm run build
npm run verify:release
npm run test:monster-art-webkit
npm run test:e2e
```

The scope verifier compares PR merge-base to HEAD and requires:

- selected binary changes exactly present;
- manifest/provenance/revision species exactly match target scope;
- history only for planned targets;
- no unrelated changed file;
- base old SHA and HEAD new SHA match the transaction plan.

Therefore both “selected image omitted” and “other monster silently mixed in” fail CI.

## 7. Merge and production

Before merge, confirm current PR CI is green against current main. Do not rely on an old green run if main moved.

After merge:

1. fresh-read main HEAD;
2. confirm intended target SHA/plan are present;
3. confirm Vercel production uses intended main commit;
4. check live revision endpoint target SHA;
5. visually inspect target in the app.

Only then report LIVE VERIFIED.

## 8. Production rollback

If a live visual defect is discovered:

- use provenance/history to identify previous FORMAL SHA and exact binary;
- create a new transaction bound to CURRENT;
- restore through the same PR/CI/main/deploy/live flow;
- do not leave Vercel permanently rolled back to a commit that disagrees with GitHub main.

## 9. 3-stage family replacement

For 2–3 targets from one evolution family:

- one transactionId;
- one bundle;
- familyVisualQa PASS;
- familyReferences cover the entire CURRENT family;
- one change plan and one PR.

Do not execute three unrelated scripts/PRs for a family redesign.

## 10. Main protection prerequisite

Normal FAST LANE production operation begins only after GitHub main is physically protected by the documented one-person Ruleset:

PR required + `test-and-build` required + 0 human approvals + no force-push + no deletion.

Until this real repository setting exists, do not describe FAST LANE as fully operationally enabled.

## 11. New monsters

New IDs/families are not FORMAL replacements. Use `docs/MONSTER-ROSTER-EXPANSION-LANE.md`.

Related:

- `docs/MONSTER-ART-FAST-LANE.md`
- `docs/MONSTER-ROSTER-EXPANSION-LANE.md`
- `docs/REPOSITORY-RELEASE-GUARD.md`
- `design/review/MONSTER-ART-MAINTENANCE-LANES-V1.md`
