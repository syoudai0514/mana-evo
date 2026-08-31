# ManaEvo Monster Art — Tips and Pitfalls

Status: **CURRENT PRACTICAL GUIDANCE**

This document captures the failure patterns that cost the most time during the 238-species art closeout. Use it together with `MONSTER-ART-MAINTENANCE-RUNBOOK.md`.

## 1. Read metadata before looking too hard at the picture

A visual reference is persuasive even when it is wrong or ambiguous. Before repair/regeneration, write down the canonical facts:

- species ID;
- family;
- stage;
- type;
- motif/concept;
- evolution relationship;
- CURRENT binary SHA.

This prevents the generator/reviewer from inventing a plausible but incorrect creature.

### The m235 example

The old image made a small foreground creature visually salient, but canonical metadata said:

- `m235`;
- F080;
- `ユグドラシア`;
- grass;
- `世界樹`;
- stage 1 of 1.

The world tree was the species. Treating the small foreground creature as m235 produced attractive but incorrect animal designs. Metadata first would have avoided multiple retries.

## 2. “CURRENT first” means fresh bytes, not a remembered SHA

Old chat messages, screenshots and ZIPs are evidence, not CURRENT.

For each maintenance attempt:

1. resolve current branch/HEAD;
2. fetch the current per-ID asset/state;
3. compute/verify the raw SHA from that exact source;
4. then compare references.

Do not continue because a filename says “current-reference”. References can become stale within the same closeout.

## 3. Validate dimensions at packaging time and again at ingestion time

The final N1A handoff exposed a simple but expensive failure: `m160.webp` was 1024×1024 in the ZIP even though the target contract was 512×512.

Protect both sides:

- producer: decode final exported WebP and assert exact 512×512;
- consumer: independently decode actual ZIP/GitHub bytes and assert exact 512×512 before mutation.

Do not infer dimensions from source canvas, preview, manifest or prior QA.

## 4. A transparent image can still be a bad asset

Alpha checks do not detect:

- rectangular collage boundaries;
- scenery baked into the visible silhouette;
- wrong creature identity;
- detached foreign fragments;
- a small companion being mistaken for the species;
- an incomplete silhouette caused by cut-and-paste repair.

The failed m235 intermediate candidate had real transparency but still looked like a rectangular cut-out of the old tree/scenery. Visual QA must inspect the decoded final WebP.

## 5. Hidden RGB is worth cleaning, but it is not the main visual gate

Fully transparent pixels can retain non-zero RGB values. These values are invisible at alpha=0 but can cause tooling/compositing noise or make binary comparisons less deterministic.

For newly generated/normalized art:

- set RGB to zero where alpha=0 before final export;
- use an encoder path that preserves exact transparent RGB when possible;
- decode the final WebP and verify again.

Do not confuse hidden-RGB cleanliness with visual correctness. A zero-hidden-RGB collage is still a collage.

## 6. Don’t “repair” when the operation requires guessing

A safe repair removes something whose separation is unambiguous. Examples: a detached fragment far from the creature or a clearly connected flat background region that does not overlap silhouette/VFX.

Stop and regenerate when deciding what to delete requires semantic guessing, such as:

- tree versus creature cannot be separated from the same pixels;
- scenery overlaps anatomy/VFX;
- background color is also a major creature color;
- erasing the plate would require reconstructing body parts.

Repeatedly trying more aggressive masks usually costs more time than an early `NEEDS_GENERATION` decision.

## 7. Detached-component analysis is useful, but review intent

Connected-components/bounding-box analysis is good for detecting unrelated fragments like the final `m220`/`m221` issue. But effects, whiskers, lightning, leaves, wings or thin lines may legitimately be disconnected because of antialiasing or transparency.

Use geometry to locate suspects, then confirm visually before deletion.

## 8. Rectangles are a strong warning sign

Common failure signatures:

- visible vertical/horizontal seams;
- abrupt rectangular alpha boundaries;
- uniform color plate touching large canvas regions;
- a background slice that looks pasted behind a creature;
- separately transformed rectangles from a previous composite.

If the subject cannot be explained as one coherent silhouette without those rectangles, reject it rather than polishing the collage.

## 9. Don’t animalize non-animal concepts

ManaEvo allows plant/tree, machine, rock/mineral, insect, serpent, jelly/soft-body and other nonstandard anatomy. The global style language is not a requirement to turn every concept into a mammal/dragon mascot.

For unusual concepts:

- preserve the canonical body plan;
- add creature readability through face/pose/structure only as compatible with the concept;
- do not solve “monster feel” by attaching ears, paws, horns or quadruped anatomy automatically.

The accepted m235 rule is a useful archetype: **monsterized world tree, not animal decorated as a tree**.

## 10. Evolution continuity beats generic “more spikes” progression

For multi-stage families, compare the whole family side-by-side. Preserve at least two identity signals across stages and make the development of the family signature feature understandable.

Avoid:

- recolor-only evolution;
- aura-only evolution;
- final-stage anatomy unrelated to earlier stages;
- universal “smaller head + more armor + more spikes” growth.

## 11. Separate “style consistency” from “same anatomy”

Shared game identity should come from rendering finish, crop discipline, lighting coherence and readability — not from one body template.

When multiple same-type families look too similar, change meaningful structure/motif/material/posture rather than only hue or VFX.

## 12. Package manifest = contract to verify, not truth to trust

If a ZIP is used, put `manifest.json` inside it. At minimum record:

- scope;
- speciesId;
- byte length;
- raw SHA-256;
- 512×512 dimensions;
- WEBP format;
- repair/regeneration policy.

On receipt, recompute everything from the entries. The consumer should be able to reject an incorrect package before touching GitHub.

This is exactly how a wrong-dimension m160 should be caught.

## 13. Raw SHA-256 and Git blob SHA are different domains

Do not compare them directly.

- Raw SHA-256: asset provenance/runtime revision checksum.
- Git blob SHA: Git object identity.

During GitHub transport, validate the Git blob against `git hash-object` and later refetch the staged bytes to recompute raw SHA-256.

See `PHASE-4-GITHUB-BINARY-HANDOFF.md`.

## 14. Make registration idempotent

When a bundle contains multiple species, some may already match CURRENT.

Before mutation:

- compare each raw SHA independently;
- mark byte-identical targets `ALREADY_MATCHES`;
- write only real replacements;
- do not create duplicate archive/provenance events for unchanged bytes.

PR #128 did this for `m161`, `m162`, `m220`, `m221`, `m229`; only `m160` and `m235` required actual replacement writes in that final handoff.

## 15. Never collapse the gate names

Use precise status language:

- `GENERATED` — an image exists;
- `VISUAL PASS` — image identity/layout reviewed;
- `ART READY` — final binary/package validated;
- `REGISTERED` — repository candidate/replacement state written;
- `FORMAL` — explicit approval recorded;
- `MAIN` — merged to main;
- `DEPLOYED` — hosting deployment completed;
- `LIVE VERIFIED` — production is proven to serve expected revision.

A lot of confusion comes from using “done” for several of these at once.

## 16. FORMAL counts are a release gate, not bookkeeping

The closeout briefly reached a state where the art looked largely finished but the registry still had roughly 40 non-FORMAL species: 198 FORMAL / 4 CANDIDATE / 36 PLACEHOLDER.

For a whole-roster official release, the count check is mandatory:

- FORMAL 238;
- CANDIDATE 0;
- PLACEHOLDER 0;
- m239 excluded.

Do not blindly bulk-promote placeholders, though. First prove that each final chosen binary is the approved one. Promotion is an approval act, not a way to make counts look clean.

## 17. Deployment and asset approval are independent

Vercel can successfully deploy a build whose manifest is incomplete. Conversely, GitHub can contain a correct FORMAL manifest while production still serves an older deployment.

Therefore verify both:

- repository state/commit;
- live `monster-asset-revisions.json` after deployment.

## 18. Verify production by revision, not by “page loads” alone

The homepage returning 200 proves reachability, not that the newest art is live.

For a target species, compare:

- expected new raw SHA;
- main `public/monster-asset-revisions.json` revision;
- production `monster-asset-revisions.json` revision.

For visual fixes, fetch/view the live image as a final sanity check when practical.

## 19. Preserve previous FORMAL bytes for real replacements

For an existing FORMAL asset, a replacement should leave an auditable chain:

- previous raw SHA;
- archive/history location;
- new raw SHA/bytes;
- source label/reason;
- new approval evidence;
- runtime revision update.

Do not overwrite the image and then reconstruct history from memory.

## 20. Treat heuristic flags as leads, not automatic defects

The final audit had approved exceptions `m042`, `m057`, `m136`, `m202`, `m213`. If a future geometry/normalization heuristic flags them again, do not reopen them automatically.

A heuristic should trigger visual review. Actual defect evidence or an explicit product decision should trigger a replacement.

## 21. Stop early on the first failed gate

Good failure report:

> first unsatisfied gate: binary dimension validation — m160 actual 1024×1024; registration not started; no GitHub mutation.

Bad failure behavior:

- partially registering later species anyway;
- continuing FORMAL promotion with a bad package;
- creating a PR and calling the task “mostly complete”;
- repairing a semantic image problem with increasingly destructive masks.

Fail-closed behavior saves recovery time.

## 22. Prefer small targeted maintenance after closeout

The 238-species global production phase is finished. From now on:

- fix an image when gameplay/visual review finds a concrete problem;
- scope the exact species/family;
- preserve provenance;
- release it through the full gate chain.

Do not rerun a global regeneration wave only to chase theoretical perfection.

## Quick checklist

Before saying a future art fix is complete, confirm:

- CURRENT identity and fresh SHA read;
- exact species scope;
- actual decoded final WebP = 512×512;
- actual alpha and safe crop;
- visual identity/collage/scenery/fragment QA passed;
- package manifest matches bytes when ZIP is used;
- replacement is idempotent and old history preserved;
- explicit FORMAL approval is recorded where required;
- revision data synchronized;
- unexpected species changes = 0;
- current tests/build pass;
- main contains the intended change;
- production live revision matches expected SHA.
