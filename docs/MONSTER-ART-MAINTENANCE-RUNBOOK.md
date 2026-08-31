# ManaEvo Monster Art Maintenance Runbook

Status: **CURRENT OPERATIONAL RUNBOOK**

Use this document after the 238-species closeout. The normal case is targeted maintenance of 1 existing FORMAL species or one 2–3 stage evolution family, not another global closeout.

## 0. Choose the correct lane first

### Existing FORMAL art, 1 species

Use `docs/MONSTER-ART-FAST-LANE.md` and `scripts/monster-art/formal-replacement.mjs`.

### Existing FORMAL art, 2–3 species in one evolution family

Use the same FAST LANE as one transaction. Require individual `visualQa=PASS` plus `familyVisualQa=PASS`.

### New species / roster larger than CURRENT

Do **not** use FORMAL replacement tooling. Use `docs/MONSTER-ROSTER-EXPANSION-LANE.md`. Unknown IDs are deliberately rejected by FAST LANE.

### Global audit / migration

Only use closeout-style procedures when there is an explicit roster-wide reason. A cosmetic request must never silently become a 238-species re-audit.

## 1. Freeze CURRENT before visual work

Before mutation fresh-read:

- `main` HEAD;
- exact target species IDs;
- `design/current/monster-asset-manifest.json`;
- current `formalAsset` / `formalSha256`;
- current species/family/stage/type/motif metadata;
- current target and family images;
- `candidate-provenance/mNNN.json` and history;
- global style lock.

Do not reuse a SHA copied from an old chat/ZIP without refetching CURRENT.

Current baseline remains `m001`–`m238`; `m239` is excluded/reserved historical reference. Roster expansion follows a separate append-only process.

## 2. Classify the requested work

### KEEP

No binary change needed. Do not create a no-op replacement.

### NORMALIZE

Only non-semantic export/canvas/scale/placement cleanup.

### REPAIR

A clearly separable local artifact can be removed without inventing anatomy or redesigning identity.

### REGENERATE / REDESIGN

Pixels cannot be safely repaired or the user explicitly wants a visual redesign such as “more cute” / “more final-stage cool”. Generate options first; no repository write while the user is still choosing.

## 3. ChatGPT-first visual selection

A short request is sufficient. The worker should automatically read CURRENT and family references, then present 2–3 options.

For a family rewrite, prefer 2–3 coherent **family sets** so stage continuity can be judged together.

No GitHub mutation occurs until the user selects the intended option/set.

The selected option is explicit visual approval, but technical QA still cannot be skipped.

## 4. Release-ready image contract

Every selected image must pass:

- exact 512×512 decoded size;
- RIFF/WEBP;
- actual transparency;
- visible creature content;
- safe transparent canvas margin / no accidental edge contact;
- no baked checkerboard, scenery, frame, text, badge, UI or background plate;
- no unrelated extra creature or detached artifact;
- no collage boundary;
- correct CURRENT identity;
- family continuity when applicable.

Mechanical QA cannot decide “cute enough”, species identity, or family continuity. Those remain actual-image visual checks.

## 5. ZIP / bundle handoff

ZIP is allowed and useful when moving selected art between ChatGPT sessions/workers. Treat ZIP as a transport envelope, not as proof.

After extraction, normal FORMAL replacement bundle is:

```text
manifest.json
mNNN.webp
```

or a same-family 2–3 species set.

The manifest must use `ManaEvo.formal-art-replacement.v1`, list exact `scope`, declared bytes/SHA, `visualQa=PASS`, explicit user-selection approval evidence, and `familyVisualQa=PASS` for multi-species bundles.

The receiver recomputes actual bytes/SHA and decodes the actual WebP again.

## 6. Existing FORMAL replacement — canonical command

Install dependencies/WebKit once in the execution environment:

```bash
npm install
npx playwright install webkit
```

Dry-run:

```bash
npm run replace:monster-art -- --bundle-dir /path/to/unzipped-bundle
```

Dry-run performs no repository mutation. It verifies current FORMAL/revision integrity, exact bundle scope, same-family rule, actual incoming bytes/SHA, decoded size, actual transparency, visible pixels, edge contact and provenance existence.

After reviewing the exact dry-run scope:

```bash
npm run replace:monster-art -- --bundle-dir /path/to/unzipped-bundle --execute
```

Do not manually edit manifest/provenance/revision for a normal existing-FORMAL replacement when this tool can model the change.

## 7. What execute does

For each actually changed target only:

1. preserve previous FORMAL binary in history if needed;
2. install the selected WebP;
3. append old → new provenance with `formalReplacement: true`;
4. retain state FORMAL and update `formalSha256` / approval evidence;
5. regenerate `public/monster-asset-revisions.json`;
6. verify all FORMAL binaries still match the canonical manifest;
7. verify revisions match the final binary SHA;
8. verify the actual changed species set equals the planned changed species set.

If incoming bytes already equal CURRENT, report `ALREADY_MATCHES`. Do not append duplicate history/provenance or churn revisions.

## 8. 2–3 species transaction behavior

A family set is one release transaction, not three best-effort replacements.

Before mutation the replacement tool snapshots every file it may modify. If revision generation or a post-write consistency check fails, it restores target WebPs, provenance, newly created history artifacts, manifest and revision manifest.

This handles ordinary runtime errors. A hard process/machine crash is still protected operationally by branch/PR workflow; no branch content is considered released until CI/main/live verification completes.

## 9. Registry/revision expectations

For current targeted maintenance, the roster normally remains:

- FORMAL 238;
- CANDIDATE 0;
- PLACEHOLDER 0;
- m239 excluded.

Counts alone are not sufficient because a FORMAL→FORMAL replacement keeps 238/0/0 unchanged. Always verify target old/new SHA and unexpected changed species.

If the roster is intentionally expanded in the future, use CURRENT canonical scope/counts from the expansion lane rather than permanently hard-coding 238 as a universal product limit.

## 10. PR / merge guard

Before merge record and prove:

- exact expected species scope;
- base/head SHAs;
- old → new raw SHA for actual changes;
- `ALREADY_MATCHES` targets separately;
- archive/provenance evidence;
- manifest/revision consistency;
- missing expected change = 0;
- unexpected species change = 0;
- current CI/build result;
- PR evaluated against current `main`, not only an old green merge snapshot.

After merge fresh-read `main` and verify the intended target changes are actually present. This catches PR omission/merge mistakes before calling the release complete.

Repository policy target remains PR required + `test-and-build` required + no force-push/deletion, with **0 required human approvals** for one-person development. See `docs/REPOSITORY-RELEASE-GUARD.md`.

## 11. Production verification

Do not stop at “Vercel deployed”. Verify:

1. production app responds;
2. live `monster-asset-revisions.json` responds;
3. target state is FORMAL;
4. target live revision matches expected new SHA;
5. live target image is visually the selected image when the change was visual;
6. deployed commit corresponds to intended `main`.

Completion state:

```text
SELECTED
→ ART READY
→ FORMAL REPLACED
→ PR CI PASS
→ MAIN
→ DEPLOYED
→ LIVE REVISION MATCH
→ LIVE VISUAL VERIFIED
```

## 12. Production rollback

If a newly released image is wrong in production:

1. identify the immediately previous FORMAL SHA from provenance/history;
2. create a new scoped branch;
3. build a replacement bundle containing that exact previous binary with explicit rollback approval evidence;
4. run the same dry-run / execute replacement path;
5. PR + CI;
6. merge to `main`;
7. deploy production;
8. verify live SHA and image match the restored bytes.

Do not leave Vercel rolled back to a commit different from GitHub `main` for an extended period. Repository and production authority must converge through a normal release.

## 13. New roster expansion

When children/user want more monsters, do not manually pick “239” or just add WebPs.

First dry-run the next family allocation:

```bash
npm run plan:monster-roster -- --family-size 3
```

With the current baseline this keeps m239 reserved and proposes m240–m242 / family 84.

Then follow the two-PR capacity + content approach in `docs/MONSTER-ROSTER-EXPANSION-LANE.md`. Expansion must update identity/master/runtime/gameplay/save/art/revision expectations together while proving existing species semantic changes are zero unless explicitly requested.

## 14. Stop conditions

Stop and report the first unsatisfied gate if:

- CURRENT identity is ambiguous;
- bundle scope/actual files/SHA disagree;
- target is not existing FORMAL for FAST LANE;
- multi-species targets are not one family;
- actual decoded image is not 512×512 or lacks transparency;
- visual QA fails identity/family/background/artifact review;
- current FORMAL manifest/revision baseline is already inconsistent;
- provenance required for replacement is missing;
- unexpected species changes appear;
- CI/build fails for a relevant source reason;
- production serves a different revision/commit from intended release.

Do not continue through later gates to create a misleading “mostly done” result.

## 15. Lessons retained from final closeout

- **m160**: always decode actual final binary; a correct-looking handoff can still be 1024×1024.
- **m220/m221**: remove only clearly separable foreign fragments; preserve body/VFX/thin edges.
- **m229**: inseparable background plate means stop repair and regenerate.
- **m235**: CURRENT identity wins over visual guess; it is the world tree itself.
- **40-state omission**: ART READY is not FORMAL, and FORMAL is not LIVE VERIFIED.
- **stale references**: CURRENT GitHub SHA/metadata wins over old ZIP/chat claims.

## 16. Related documents

- `docs/MONSTER-ART-FAST-LANE.md`
- `docs/MONSTER-ROSTER-EXPANSION-LANE.md`
- `docs/REPOSITORY-RELEASE-GUARD.md`
- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
- `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`
