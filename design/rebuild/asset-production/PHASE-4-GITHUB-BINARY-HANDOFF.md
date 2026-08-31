# ManaEvo Phase 4 — GitHub-native Binary Handoff

Status: **CURRENT TRANSPORT REFERENCE / HISTORICAL W-303..W-320 HANDOFF**

Purpose: remove unnecessary manual ZIP download/re-upload from monster-art operations and preserve exact binary identity from ART READY generation through repository ingestion/release.

The original protocol was created for W-303..W-320 attribute production. The 238-species roster is now fully FORMAL; future use is primarily targeted maintenance/replacement. Transport rules remain valid, while FORMAL replacement/release semantics are defined in `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`.

## 0. Post-closeout invariant

As of 2026-08-31:

- active scope: `m001-m238`;
- `m239` excluded;
- current state: FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0.

GitHub transport only proves that the intended bytes reached a branch intact. It does **not** prove visual QA, candidate registration, FORMAL approval, main merge, deployment or live production revision.

Keep those gates separate.

## 1. User interaction rule

The user should not be required to manually download, save, re-attach or shuttle ZIP files between chats/Works when exact bytes can be safely handed off through GitHub.

Historical normal flow:

`art owner generates/QA's binaries` → `art owner publishes ART READY binaries to GitHub` → `ingestion Work fetches the same GitHub branch` → `candidate-ingestion.mjs ingests them`

Post-closeout maintenance flow:

`CURRENT identity/SHA read` → `replacement visual + binary QA` → `GitHub exact-byte handoff` → `reviewed FORMAL replacement flow` → `main` → `production` → `live revision verify`

A ZIP remains valid when deliberately used as a user-supplied authoritative package, but it must include a manifest and the receiver must independently validate the actual entries before mutation.

## 2. Staging location

Historical W-303..W-320 attribute Work Items use their owning attribute-production branch.

Preferred direct-binary staging path:

`design/rebuild/asset-production/art-ready/W-30X/mNNN.webp`

where `W-30X` is the owning Work Item and `mNNN` must be a species owned by that Work Item according to `PHASE-4-ATTRIBUTE-QUEUE.json`.

When connector payload limits prevent a single binary blob from being transmitted safely, use the chunked transport fallback in section 3.2 instead of requiring user ZIP transfer.

Do not stage another attribute's species. Do not stage m239.

For post-closeout maintenance that is not tied to a historical W-30X branch, use a clearly named maintenance/release branch and explicit target scope. Do not create a fake W-30X ownership merely to reuse this protocol.

## 3. Publishing ART READY binaries

After real-image generation/repair, visual QA, candidate-safe/final WebP export and local SHA-256 are complete, publish the exact raw WebP bytes either directly or through deterministic chunked transport before reporting GitHub binary handoff complete.

Preferred path when a normal checkout has authenticated push:

- write the exact WebP files to the staging directory;
- commit;
- push the intended branch;
- fresh-fetch that branch and recompute raw SHA-256 from the staged files.

If shell `git push` is unavailable but authenticated GitHub object operations are available, GitHub may be used as the transport layer:

1. base64-encode each already-generated local WebP without altering it;
2. create Git blobs with `encoding=base64`;
3. create a tree based on the current branch tree, adding the staging paths;
4. create one commit whose parent is the current branch HEAD;
5. fast-forward the branch ref to that commit;
6. verify branch HEAD and staged paths through GitHub;
7. refetch/reconstruct the raw bytes and recompute SHA-256.

This GitHub-object fallback is transport only. It must not simulate candidate ingestion, archive semantics, provenance, FORMAL promotion or FORMAL replacement semantics.

### 3.1 Binary hash validation — do not compare different hash domains

ART READY raw SHA-256 and Git blob object ID are different values and must never be compared directly.

Use these checks separately:

- `ART READY checksum` = SHA-256 of the raw WebP file bytes.
- `Git blob SHA` = Git object ID for the raw WebP bytes. In the current SHA-1 repository this is the value produced by `git hash-object <file>` and by GitHub `create_blob` when `encoding=base64` receives the exact file bytes.

For GitHub-object transport, validate each file in this order:

1. compute local raw-file SHA-256 and byte count and retain them for asset provenance;
2. compute local Git blob ID with `git hash-object <file>`;
3. base64-encode exact raw bytes with no text conversion/newline corruption/UTF-8 round trip;
4. call GitHub `create_blob` with `encoding=base64`;
5. compare returned Git blob SHA only with local `git hash-object` result;
6. do not compare Git blob SHA with raw-file SHA-256;
7. after tree/commit/ref publication, refetch/checkout normally and recompute raw SHA-256; it must equal the original raw SHA-256.

If returned Git blob SHA differs from `git hash-object <file>`, treat it as an encoding/byte-preservation problem for that file and diagnose before attaching the blob to a tree.

Use a deterministic base64 path that reads file bytes directly, for example Python `base64.b64encode(open(path, "rb").read()).decode("ascii")`, rather than passing binary through text shell variables.

### 3.2 Connector payload-limit fallback — chunked GitHub transport

If direct `create_blob(encoding=base64)` fails hash validation because a connector/request path truncates or drops part of a long payload, do not keep retrying the same large payload and do not ask the user to shuttle ZIP files manually.

For each species `mNNN`:

1. read exact raw WebP bytes;
2. compute/retain raw byte length and SHA-256;
3. base64-encode the complete raw file with no line wrapping;
4. split the ASCII base64 string into ordered chunks of at most **32768 characters** each;
5. publish chunks under `design/rebuild/asset-production/art-ready-transport/W-30X/mNNN/part-0001.b64`, `part-0002.b64`, ...;
6. publish `manifest.json` containing at minimum:
   - `speciesId`;
   - `encoding: "base64-chunks"`;
   - `chunkCharsMax: 32768`;
   - ordered `parts`;
   - `rawBytes`;
   - `rawSha256`;
   - `originalFilename: "mNNN.webp"`;
7. refetch/checkout, concatenate listed parts in manifest order with no inserted whitespace/newlines, base64-decode to a temporary `mNNN.webp`, and verify:
   - decoded byte length == `rawBytes`;
   - decoded SHA-256 == `rawSha256`;
   - RIFF/WEBP signature valid;
8. only after successful reconstruction may the species be counted as GitHub binary handoff complete.

Chunk files are transport artifacts, not candidate assets. Do not feed `.b64` parts directly to `candidate-ingestion.mjs` or reinterpret chunk transport as provenance/FORMAL semantics.

After successful ingestion/replacement and repository validation, remove temporary direct/chunk staging from the final branch tree unless a current reviewed process intentionally retains it.

For a Work Item, direct WebP and chunked transport may coexist per species, but each species must have exactly one verified source path chosen for the next gate. Prefer direct WebP when valid; otherwise use verified chunk reconstruction.

A connector payload-limit failure is a transport limitation, not an image-generation failure.

## 4. ART READY gate

Historical W-303..W-320 ART READY required:

- real candidate image generated;
- visual QA passed or explicitly dispositioned;
- candidate-safe WebP prepared;
- file size below the candidate-ingestion limit;
- local SHA-256 recorded;
- actual WebP bytes recoverable from the attribute branch via direct or verified chunk transport;
- staged/reconstructed checksum verified;
- review ledger/result updated.

Post-closeout ART READY/FORMAL replacement handoff adds a strict final-image contract:

- exact **512×512** decoded dimensions;
- RIFF/WEBP;
- actual alpha/transparency;
- safe full silhouette and no accidental edge crop;
- no baked checkerboard/background plate/scenery/frame;
- no rectangular collage/cut-out structure;
- no unrelated extra character/detached artifact;
- canonical species/family identity visually confirmed;
- per-species raw bytes/SHA recorded;
- when a package is used, manifest bytes/SHA/dimensions match actual binary.

A local-only ZIP/package is optional convenience output, not the normal GitHub handoff contract. If images exist only inside a chat/runtime and are not recoverable by the next worker, report `ART READY LOCAL / GITHUB HANDOFF BLOCKED`, not a normal complete handoff.

## 5. ZIP package contract when ZIP is intentionally used

If ZIP is the explicit authoritative input, include `manifest.json` **inside the ZIP**.

Minimum per-species fields:

- `speciesId`;
- raw `bytes`;
- raw-file `sha256`;
- `width`;
- `height`;
- format (`WEBP`);
- repair/regeneration/normalization policy/source label.

Multi-species packages must also declare exact scope/count.

Receiving sequence:

1. reopen ZIP;
2. verify expected entries/scope;
3. read actual raw bytes;
4. verify RIFF/WEBP;
5. decode actual final image and verify exact 512×512;
6. verify actual alpha;
7. recompute bytes and raw SHA-256;
8. compare with manifest;
9. perform visual QA/identity checks;
10. only then mutate GitHub.

A manifest is expected metadata, not proof. The first failed gate stops registration.

The final closeout caught a 1024×1024 `m160.webp` this way; registration had to stop before repository mutation.

## 6. Binary ingestion Work — historical candidate path

Historical ingestion flow:

1. fetch owning attribute-production branch;
2. confirm exact scope from `PHASE-4-ATTRIBUTE-QUEUE.json`;
3. use verified direct WebP or reconstruct temporary WebP from verified chunk transport;
4. verify WebP / dimensions/current policy / size / checksum / species ownership;
5. run existing W-302 `candidate-ingestion.mjs` using the raw WebP as `--source`;
6. for candidate replacements, preserve required archive and old/new provenance semantics;
7. validate repository target binaries/checksums;
8. update ledger/provenance from actual results;
9. remove temporary staging;
10. commit/publish branch and update PR.

Do not replace the candidate-ingestion script with manual Git-object construction.

### Post-closeout FORMAL replacement note

All active species are currently FORMAL, and `candidate-ingestion.mjs` intentionally refuses FORMAL replacement. Do not bypass that guard.

For future FORMAL binary replacement use `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`: preserve old binary/history, append provenance, attach explicit approval evidence, synchronize revisions, test/build, merge, deploy and live-verify.

## 7. Idempotency

Exact-byte handoff may contain species whose supplied binary already matches CURRENT.

Before any write:

- compare each supplied raw SHA-256 to CURRENT;
- record exact matches as `ALREADY_MATCHES`;
- do not rewrite those binaries;
- do not append duplicate history/provenance;
- write only actual replacements.

Final PR #128 followed this rule: `m161`, `m162`, `m220`, `m221`, `m229` already matched intended FORMAL bytes; only `m160` and `m235` required actual replacement writes.

## 8. Push/authentication split

Shell GitHub authentication failure is not a reason to make the user shuttle files manually.

If local checkout/script execution can create a correct commit but shell push is unavailable, an authenticated GitHub connector may publish the already-created result only when it preserves the exact resulting tree. Otherwise record `EXECUTED / PUBLISH BLOCKED` and preserve a deterministic commit/bundle for a later authenticated publisher.

For ART READY binary handoff itself, authenticated GitHub blob/tree/commit/ref operations or chunked text transport are allowed because they only make already-generated source bytes reachable by the next gate.

## 9. Separation of gates

Keep these states separate:

- image generated/repaired;
- visual QA;
- ART READY binary/package;
- GitHub binary handoff;
- candidate ingestion or FORMAL replacement registration;
- cross-attribute/family QA where applicable;
- FORMAL approval;
- main merge;
- production deployment;
- live revision verification.

Staging/reconstructing a WebP does not make it repository CANDIDATE or FORMAL.

`FORMAL` also does not mean `LIVE VERIFIED`.

## 10. FORMAL/full-release closeout gate

For a full active-roster art release, do not report completion until all are proven:

1. active scope `m001-m238`, m239 excluded;
2. chosen binaries passed visual + actual-binary QA;
3. FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0;
4. `public/monster-asset-revisions.json` has 238 FORMAL revisions;
5. current tests pass;
6. production build passes;
7. intended commit is in main;
8. production deployment completed;
9. live `monster-asset-revisions.json` serves expected states/revisions.

The project previously reached 198 FORMAL / 4 CANDIDATE / 36 PLACEHOLDER while art was being treated as nearly finished. That state was **not** a complete official art release. The remaining 40 were later explicitly formalized.

Never bulk-promote placeholders simply to satisfy counts; first prove the selected binary is the approved image.

## 11. Cleanup

Temporary ART READY staging paths should not remain in the final production branch after successful ingestion/replacement unless a reviewed process explicitly retains them.

Delete direct staging and chunk transport after target binaries, history/provenance, checksums and validation pass.

## 12. Related documents

- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
- `design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md`
- `design/rebuild/HANDOFF-TEMPLATE.md`
