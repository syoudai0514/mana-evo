# ManaEvo Monster Art — Final Handoff 2026-08-31

Status: **CLOSED / PRODUCTION**

This is the final handoff for the 238-species per-ID monster-art closeout. It records the state that must be recovered before any future art maintenance work starts. It is an operational handoff, not a replacement for `design/current/monster-asset-manifest.json`.

## 1. Final release state

- Active scope: `m001`–`m238` = **238 species**.
- Excluded historical reference: `m239`.
- Runtime asset state: **FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0**.
- Final closeout PR: **#128 — FINAL CLOSEOUT: last 7 registration and 238 FORMAL**.
- Main merge commit: `bc78609097fc1f486d26d6703f127fdaf235188d`.
- Final closeout tests: **290/290 PASS**.
- Vite production build: **PASS**.
- Production: `https://mana-evo.vercel.app/`.
- Production revision endpoint: `https://mana-evo.vercel.app/monster-asset-revisions.json`.
- 2026-08-31 final verification: production returned HTTP 200 and the revision endpoint exposed `m001`–`m238` as FORMAL.

The authoritative current state is the repository manifest and production revision output, not this snapshot. If they ever disagree, investigate before changing art.

## 2. Canonical sources and precedence

Before editing any species, recover identity from CURRENT sources first.

1. Explicit current product-owner decision.
2. CURRENT species/family metadata and descriptions.
3. `design/current/monster-asset-manifest.json` and current per-ID binary.
4. Current provenance/history for that species.
5. Historical/reference art only after the above.
6. Global style rules in `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`.

Never infer identity from a visually prominent object in an old image when CURRENT metadata says otherwise.

## 3. Final per-ID release contract

A release-ready monster image is expected to satisfy all of the following unless an explicit reviewed exception exists:

- exactly `512×512` pixels;
- RIFF/WEBP binary;
- actual alpha/transparency, not a baked checkerboard or white plate;
- one intended species / one independent creature image;
- full intended silhouette inside the canvas with safe margin and no accidental edge crop;
- no scenery, rectangular background plate, frame, text, badge, UI or type label baked into the image;
- no unrelated extra character or detached artifact;
- no rectangular cut-and-paste / collage boundary;
- visual identity matches CURRENT species/family metadata;
- evolution-family continuity is preserved when applicable;
- raw byte length and SHA-256 recorded for handoff/registration;
- for newly generated or normalized outputs, fully transparent pixels should have RGB normalized to zero so hidden-RGB contamination is not carried forward.

Mechanical transparency alone is not sufficient. A technically transparent image can still fail visual QA because it is a collage, contains scenery, has the wrong creature identity or has detached fragments.

## 4. Final 7 closeout species

| Species | Final disposition | Current FORMAL SHA-256 |
|---|---|---|
| `m160` | scale/dimension normalization; final exact 512×512 replacement | `8e209040b40af68324d54e8511d43efb0f996af0f553989153c17160b88819c9` |
| `m161` | completed normalized candidate retained | `7fc318aa263c7ccb07fc4262d0d961abc66f6b5f70f4030dddb4fc33e814da4b` |
| `m162` | completed normalized candidate retained | `8349198cdec027846821fc70695b1a46cab28edf68c69c9801c80cc0a04c94e0` |
| `m220` | detached right-side fragment cleanup | `6eb0e4992962f9621ff693beebfc73ed6493b075cd5c1b6f1600a5809fd1e8ee` |
| `m221` | detached right-side fragment cleanup | `dd4fe5c364b5688e84ad5329c514c0c339003fe48a186085d834d576d9398610` |
| `m229` | background-plate regeneration | `5af990a01171f779018d46c17739b607109e08cd8bef12b35248134d7d94fafa` |
| `m235` | fresh F080 world-tree monster regeneration | `df07f6d99ab1ed33c4f7cb0fcc668b0254443c10405fb769f03682b87e728991` |

The final registration bundle used by PR #128 was `ManaEvo-FINAL-CLOSEOUT-last7-registration-ready(1).zip`, 1,342,297 bytes, SHA-256 `0911fb5320d175e9c35e40468c9262d54b715f4cf4fe2ef246f8f79ce5686904`.

## 5. m235 identity — permanent caution

`m235` is the most important identity trap discovered during closeout.

Authoritative identity:

- family: `F080`;
- name: `ユグドラシア`;
- type: `くさ`;
- concept: `世界樹`;
- stage: `1 of 1`;
- no evolution.

**m235 is the world tree itself.**

An old CURRENT image contained a large tree/forest-like structure and a separate small foreground character. The small character must not be interpreted as m235. Several visually attractive animalized attempts (deer/fox/wolf/quadruped direction) were therefore wrong even though they looked game-ready.

A later transparency-based attempt also failed because it preserved rectangular collage/scenery boundaries and detached fragments. The accepted direction is a **single monsterized world-tree organism**: recognizably a creature, but still fundamentally the world tree rather than an animal carrying tree decorations.

Future m235 maintenance must start from CURRENT metadata, not from the old foreground character or a generic “forest guardian” archetype.

## 6. Approved audit exceptions

The global closeout audit previously flagged the following normalization heuristically, but they were explicitly accepted as exceptions and later FORMALized:

- `m042`
- `m057`
- `m136`
- `m202`
- `m213`

Do not automatically rewrite these assets simply because the same heuristic flags them again. A new actual visual defect or explicit product decision is required.

## 7. State model and release gates

Keep these gates separate and name the current gate explicitly in every handoff/report:

`GENERATED/REPAIRED` → `VISUAL QA` → `ART READY PACKAGE` → `CANDIDATE/REPLACEMENT REGISTRATION` → `FORMAL APPROVAL` → `MAIN` → `PRODUCTION DEPLOY` → `LIVE REVISION VERIFY`

Key rules:

- File existence does not imply FORMAL.
- `CANDIDATE` is not official runtime approval.
- `PLACEHOLDER` is not an approved species image.
- FORMAL requires explicit approval evidence.
- A successful Vercel deploy does not repair an incomplete manifest state.
- A successful GitHub merge does not prove production is serving the new revision.
- “ART READY” must not be reported as “released”.
- “PR merged” must not be reported as “production verified”.

### The release-completion rule learned from the 40-species omission

At one point, the repository had **FORMAL 198 / CANDIDATE 4 / PLACEHOLDER 36** even though the art effort was being treated as nearly released. The remaining 40 species were later explicitly promoted and the final state became 238/0/0.

Therefore a full-art release is not complete until all of these are proven:

1. intended active species scope = 238 and `m239` is excluded;
2. chosen binaries are QA-approved;
3. manifest counts = **FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0**;
4. `public/monster-asset-revisions.json` contains 238 FORMAL entries matching the manifest;
5. tests and production build pass;
6. main contains the intended commit;
7. production is deployed;
8. the live revision endpoint shows the intended FORMAL states/revisions.

Do not stop at step 5 or 6.

## 8. Replacement/idempotency rules

When a supplied image already byte-matches the current FORMAL image, do not create a duplicate ingestion/provenance/history event simply to show activity.

For a real FORMAL replacement:

- verify current species identity and current FORMAL SHA first;
- preserve/archive the previous binary when the repository replacement policy requires it;
- append old/new provenance rather than overwriting history;
- record the new raw SHA-256 and byte count;
- update FORMAL approval evidence only after the replacement is actually approved;
- regenerate/synchronize runtime revision data;
- verify no unexpected species changed.

PR #128 followed this distinction: five of the final seven already matched existing FORMAL bytes and were not redundantly re-ingested; `m160` and `m235` were actual replacements with history/provenance preservation.

## 9. Handoff package contract

If ZIP is used as an intentional handoff artifact, include `manifest.json` inside the ZIP. Do not rely on the filename or chat description.

Minimum per-species manifest fields:

- `speciesId`;
- raw `bytes`;
- raw-file `sha256`;
- `width` / `height`;
- format (`WEBP`);
- repair/regeneration/normalization policy or source label.

For a multi-species package also record the exact scope and expected count.

After receiving a package, reopen it and validate the **actual binaries** against the manifest before any GitHub mutation. A manifest claim is not proof by itself.

## 10. SHA domains

Never compare unlike hashes:

- raw-file SHA-256 = checksum of the WebP bytes used for asset provenance/revisions;
- Git blob SHA = Git object ID for those bytes.

They are both useful but are not expected to be equal. See `PHASE-4-GITHUB-BINARY-HANDOFF.md` for the transport protocol.

## 11. Where to continue from here

For future maintenance:

- current status: `docs/monster-production-status.md`;
- maintenance procedure: `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`;
- practical pitfalls: `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`;
- style/visual contract: `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`;
- GitHub binary handoff: `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`;
- candidate/formal tooling reference: `design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md`;
- worker handoff format: `design/rebuild/HANDOFF-TEMPLATE.md`;
- authoritative state: `design/current/monster-asset-manifest.json`;
- runtime revision output: `public/monster-asset-revisions.json`;
- per-species provenance/history: `design/rebuild/asset-production/candidate-provenance/` and `candidate-history/`.

## 12. Closeout conclusion

The large-scale 238-species art production phase is closed. Future work should be **targeted maintenance only**: change a FORMAL image when an actual in-game/visual defect is found or a deliberate product decision requests a redesign. Do not reopen global regeneration merely to chase heuristic perfection.
