# ManaEvo Monster Art Maintenance Runbook

Status: **CURRENT OPERATIONAL RUNBOOK**

Use this document after the 238-species closeout when one or more FORMAL images need maintenance. The normal case is a small, explicitly scoped replacement — not a new global production wave.

## 0. Golden rule

Never start by editing an image.

Start by proving **which species it is, what CURRENT says it is, which bytes are live, and which gate you are trying to complete**.

Active scope is `m001`–`m238`. `m239` is excluded historical reference and must not enter runtime/FORMAL scope.

## 1. Freeze the current baseline

Before any mutation, record:

- repository: `syoudai0514/mana-evo`;
- branch/ref being treated as CURRENT;
- exact HEAD SHA;
- target species IDs;
- current manifest state for each target;
- current `formalAsset` and `formalSha256` when FORMAL;
- current `public/monsters/mNNN.webp` raw SHA-256 and byte count when available;
- current species/family metadata;
- existing provenance/history;
- requested change and reason.

Do not reuse a SHA copied from an old chat, ZIP or previous worker without refetching CURRENT.

### Required source reads

At minimum inspect:

- `design/current/monster-asset-manifest.json`;
- CURRENT monster metadata/descriptions for the species/family;
- `public/monsters/mNNN.webp` identity/checksum;
- `design/rebuild/asset-production/candidate-provenance/mNNN.json` when present;
- relevant `candidate-history/mNNN/` entries;
- `PHASE-4-STYLE-LOCK.md`.

If metadata and old artwork disagree, metadata/CURRENT identity wins until an explicit product decision says otherwise.

## 2. Classify the work before doing it

Choose one disposition per species.

### KEEP

No actual defect requiring a binary change. Stop; do not create a no-op replacement.

### NORMALIZE

Only canvas/scale/placement/format cleanup is required and the creature identity/semantic artwork can remain unchanged.

Examples:

- exact dimension correction;
- safe uniform scale adjustment within transparent canvas;
- hidden-RGB cleanup;
- non-semantic export correction.

### REPAIR

A local artifact can be removed without inventing missing anatomy or redesigning the species.

Examples:

- unrelated detached fragment;
- clearly separable background plate;
- accidental crop/canvas issue that does not require semantic reconstruction.

### REGENERATE

The existing pixels cannot be safely repaired without semantic deletion/reconstruction, or the visual identity is wrong.

Examples:

- background/scenery is inseparable from the creature;
- collage/cut-out structure prevents a valid independent silhouette;
- wrong species/body-plan interpretation;
- family continuity is fundamentally broken.

If unsure whether repair is semantically safe, stop and classify it for visual review instead of repeatedly erasing/reconstructing pixels.

## 3. Produce the replacement

### Required output contract

Every new release candidate must be checked for:

- exact `512×512` dimensions;
- RIFF/WEBP;
- actual alpha/transparency;
- full intended creature silhouette inside safe canvas margin;
- no accidental edge contact/crop;
- no baked checkerboard;
- no white/colored rectangular background plate;
- no scenery/frame/text/UI/type label;
- no unrelated second creature;
- no unrelated detached artifact;
- no rectangular collage boundary;
- correct CURRENT species/family identity;
- correct evolution-family continuity when applicable.

For newly generated or normalized assets, normalize RGB to `(0,0,0)` wherever alpha is `0` before the final lossless WebP export when the encoder permits exact preservation. Verify the final decoded WebP rather than trusting the pre-export canvas.

### Visual QA comes before “technical PASS”

Mechanical checks cannot decide species identity or whether a cut-out still looks like scenery. Review the actual decoded image at normal game size and enlarged size.

Ask:

- Does this read as one creature without relying on a label?
- Is the defining silhouette complete?
- Does it match the canonical motif/body plan?
- Are background/scenery elements mistakenly fused into the asset?
- Are there rectangular seams or foreign components?
- For an evolution family, does it still belong to the same lineage?

Do not promote a technically transparent image that fails these questions.

## 4. Package/handoff contract

GitHub-native binary handoff is preferred. See `PHASE-4-GITHUB-BINARY-HANDOFF.md`.

If ZIP is deliberately used, the ZIP must include `manifest.json` and the receiving worker must treat the manifest as expected metadata to verify — not as proof.

Recommended multi-species shape:

```json
{
  "schema": "ManaEvo.art-ready.bundle.v1",
  "scope": ["mNNN"],
  "species": {
    "mNNN": {
      "speciesId": "mNNN",
      "bytes": 123456,
      "sha256": "...",
      "width": 512,
      "height": 512,
      "format": "WEBP",
      "repairPolicy": "..."
    }
  }
}
```

Before repository mutation, reopen the ZIP, decode every WebP and verify:

- actual entry count/scope;
- `512×512`;
- RIFF/WEBP;
- actual alpha;
- raw bytes == manifest bytes;
- raw SHA-256 == manifest SHA-256.

First failure stops the registration. Report the **first unsatisfied gate** precisely.

## 5. Register without losing history

### CANDIDATE path

For non-FORMAL candidate work, use the repository ingestion tooling rather than manually simulating candidate semantics:

```bash
node scripts/monster-art/candidate-ingestion.mjs \
  --species mNNN \
  --source /path/to/mNNN.webp \
  --source-label "reason/source"
```

Execute only when intended:

```bash
node scripts/monster-art/candidate-ingestion.mjs \
  --species mNNN \
  --source /path/to/mNNN.webp \
  --source-label "reason/source" \
  --execute
```

`candidate-ingestion.mjs` intentionally refuses to replace a species already marked FORMAL. Do not bypass that guard merely to make a replacement appear successful.

### Existing FORMAL replacement path

A FORMAL replacement is a release change, not ordinary W-302 candidate ingestion. Follow a reviewed replacement flow that preserves the same invariants demonstrated by the final closeout:

1. fresh-read current FORMAL SHA/state;
2. verify replacement binary contract;
3. archive/preserve the previous FORMAL binary where repository history policy requires it;
4. append old/new provenance rather than overwrite it;
5. install the replacement at `public/monsters/mNNN.webp`;
6. update the manifest to the new FORMAL SHA only with explicit approval evidence;
7. synchronize review/runtime revision data;
8. prove only intended species changed.

Do not invent a one-off script or direct JSON mutation that skips history/provenance/approval unless that exact procedure is reviewed as the new canonical tooling.

## 6. Idempotency check

Before writing a target binary, compare the supplied raw SHA-256 to CURRENT.

If it is already byte-identical to the intended current FORMAL binary:

- do not replace it again;
- do not append duplicate provenance/history;
- count it as `ALREADY_MATCHES` / idempotent PASS;
- continue validating the remaining scope.

This rule prevented duplicate ingestion for five of the final seven closeout species.

## 7. FORMAL approval

FORMAL is a separate gate from generation, packaging and candidate registration.

When using the formal promotion tooling for an eligible non-FORMAL candidate, evidence must explicitly identify the species and current approval. Historical/current examples follow this shape:

```json
{
  "speciesId": "mNNN",
  "approved": true,
  "approvalType": "CURRENT_FORMAL",
  "approvedBy": "explicit approver identity",
  "approvedAt": "ISO-8601 timestamp",
  "source": "explicit approval evidence"
}
```

Then dry-run and execute according to `W-302-OPERATOR-GUIDE.md`.

For an already-FORMAL binary replacement, do not assume a promotion command designed for CANDIDATE automatically models replacement semantics. Preserve the current FORMAL state and attach new approval evidence through the reviewed replacement flow.

## 8. Registry and revision synchronization

After all intended species are approved:

- recount manifest states;
- verify active scope remains exactly 238 species;
- verify `m239` is excluded;
- regenerate/synchronize `public/monster-asset-revisions.json` using the repository's current release tooling/process;
- verify every FORMAL revision equals the intended raw WebP SHA-256;
- verify no unexpected species revision changed.

For a full-roster release the hard gate is:

- FORMAL `238`;
- CANDIDATE `0`;
- PLACEHOLDER `0`.

For a targeted maintenance release, counts may remain 238/0/0 throughout; therefore also compare target SHAs and unexpected changed IDs, not counts alone.

## 9. Tests and build

Use the repository's current required test/build commands. Baseline development commands are:

```bash
npm install
npm test
npm run build
```

The final 2026-08-31 closeout evidence was 290/290 tests PASS plus Vite production build PASS, but future test counts may legitimately change as the suite grows. **Do not hard-code 290 as a permanent expected count.** Require zero failing current tests instead.

If a wrapper build fails only because an external cloud/config pre-step is unavailable, distinguish that environment failure from the actual Vite build result. Do not silently treat one as the other; report both.

## 10. PR/main release gate

Before merge, the PR/report should include:

- exact target species scope;
- base/head SHAs;
- old → new raw SHA for each actual replacement;
- idempotent/already-matching species separately;
- manifest state before/after;
- archive/provenance evidence;
- unexpected species changes count/list;
- test result;
- production build result;
- explicit statement that `m239` is excluded.

Merge to `main` only after the intended repository state is proven.

## 11. Production verification

Do not stop at “Vercel deployed”. Verify the live application and live asset revision data.

Check:

1. `https://mana-evo.vercel.app/` returns successfully;
2. `https://mana-evo.vercel.app/monster-asset-revisions.json` returns successfully;
3. target species state is `FORMAL`;
4. target revision matches the expected new SHA-256;
5. for full-roster closeout, 238 species are FORMAL;
6. optionally fetch the target live image and visually inspect it when the maintenance reason was visual.

A production deployment serving an old commit/revision is not a completed release.

## 12. Stop conditions

Stop immediately and report the first unsatisfied gate when any of these occurs:

- species identity cannot be determined from CURRENT;
- supplied/reference binary is stale or does not match its claimed SHA;
- image is not exact 512×512;
- WebP/alpha validation fails;
- visual QA identifies wrong identity, scenery/collage or unrelated artifact;
- repair requires ambiguous semantic reconstruction;
- manifest package metadata does not match actual bytes;
- replacement would overwrite history/provenance without an approved path;
- required FORMAL approval evidence is absent;
- unexpected species changes are detected;
- tests/build fail for a relevant source reason;
- production serves a different revision from the intended release.

Do not continue through later gates to create a misleading “mostly done” report.

## 13. Special lessons from the final closeout

- **m160**: a bundle can contain the right-looking art at the wrong resolution. Validate dimensions from the actual binary before any registry write.
- **m220/m221**: disconnected foreign fragments may be safely repairable when clearly separable; preserve body/VFX/thin edges.
- **m229**: when a rectangular background plate cannot be separated safely without damaging character/VFX, stop repair and regenerate.
- **m235**: canonical identity can overturn the obvious visual interpretation. It is F080 `ユグドラシア`, the world tree itself; do not animalize it or treat a foreground companion as the species.
- **40-state omission**: finished images are not enough. Always verify final FORMAL/CANDIDATE/PLACEHOLDER state and live revision output.
- **stale references**: reference ZIPs are convenience only; CURRENT GitHub SHA and canonical metadata win.

## 14. Related documents

- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`
- `docs/monster-production-status.md`
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
- `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`
- `design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md`
- `design/rebuild/HANDOFF-TEMPLATE.md`
