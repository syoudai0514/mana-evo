# Monster Art Visual Audit

Status: detection-only baseline. This directory does not approve, normalize, repair, regenerate, promote, merge, or deploy monster artwork.

## Goal

Keep the active ManaEvo monster artwork visually consistent in production UI while preserving good existing artwork and making future per-species replacement safe.

The active identity scope remains `m001`-`m238`; `m239` is excluded.

## Automated triage

Run:

```bash
npm run audit:monster-art
```

The audit decodes the actual WebP in WebKit and records:

- image dimensions
- alpha-visible bounding box
- visible width / height ratios
- alpha-weighted center offset
- visible / opaque edge ratios
- opaque canvas corners
- nearly fully opaque canvas detection

Triage labels:

- `PASS_METRICS`: no automatic presentation defect detected; still requires family/stage visual review.
- `NORMALIZE_REVIEW`: likely excess transparent padding, small presentation, or centering drift.
- `REPAIR_REVIEW`: likely baked rectangular background / unsafe transparency; inspect before any edit.
- `CROP_RISK_REVIEW`: visible extent is very close to the canvas edge; inspect before scaling.
- `MISSING`: no `public/monsters/mNNN.webp` in the checked-out branch.

The target visible-height guidance is roughly 70-85%, not a hard production rule. Wings, tails, long horizontal bodies, energy effects, and family silhouette must be reviewed visually.

## Initial main baseline

Audit source: PR #106 CI artifact, run `33215521387`, head `be24da9693b48079bb2004a0fe2f2c238c43ee40`.

Main currently contains 184 production candidate WebPs. The remaining 54 correspond exactly to the four Work Items that were excluded when the 184-species rollout was merged: W-306, W-309, W-313, W-319.

Initial automated counts:

| disposition | count |
|---|---:|
| PASS_METRICS | 43 |
| NORMALIZE_REVIEW | 15 |
| REPAIR_REVIEW | 79 |
| CROP_RISK_REVIEW | 47 |
| MISSING | 54 |
| TOTAL | 238 |

These numbers are triage counts, not final visual acceptance counts.

## Confirmed examples from device QA

The automated result agrees with the reported iPhone presentation defects:

- `m034`-`m036`: fully opaque 512x512 canvas -> `REPAIR_REVIEW`.
- `m040`-`m042`: fully opaque 512x512 canvas -> `REPAIR_REVIEW`; device QA also shows the character itself is much too small inside that baked background.
- `m119`-`m124`: fully opaque 512x512 canvas -> `REPAIR_REVIEW`.
- `m154`: transparent canvas, visible height 62.5% -> `NORMALIZE_REVIEW`.
- `m155`: transparent canvas, visible height 75.0% -> `PASS_METRICS`.
- `m156`: transparent canvas, visible height 81.6% -> `PASS_METRICS`.
- `m157`-`m159`: fully opaque 512x512 canvas -> `REPAIR_REVIEW`.
- `m160`-`m162`: fully opaque 1024x1024 canvas -> `REPAIR_REVIEW`; device QA also shows extreme under-sizing of the foreground monster.
- `m163`: transparent canvas, visible height 85.6% -> `PASS_METRICS`.
- `m164`-`m165`: transparent but near canvas limits -> `CROP_RISK_REVIEW`; do not blindly enlarge.

## Required repair workflow

1. Reconstruct the exact GitHub candidate source and species provenance.
2. Freeze assets that pass both metrics and family/stage visual review.
3. For `NORMALIZE_REVIEW`, prefer lossless-content presentation normalization: transparent canvas, safe recentering, and scale adjustment without redesign.
4. For `REPAIR_REVIEW`, remove only background pixels when the character can be separated safely; preserve legitimate semitransparent glow, wings, energy, smoke, etc.
5. If safe extraction cannot preserve the character or the original artwork is intrinsically inadequate, remake only that species.
6. Re-run the full audit and family/stage review after every replacement set.
7. Use candidate ingestion so the previous candidate is archived by SHA-256 and provenance is appended.
8. Keep FORMAL promotion, main merge, and production deployment as separate gates.

## Replacement contract

The stable replacement key is always `speciesId` (`mNNN`), never display name or thumbnail order.

Candidate replacement continues through `scripts/monster-art/candidate-ingestion.mjs`, which archives the previous candidate by content hash and appends provenance before placing the new WebP at `public/monsters/mNNN.webp`.

A future candidate binary replacement therefore does not require UI component edits or a new asset path: keep the stable `mNNN.webp` path and replace only through the ingestion/provenance path.
