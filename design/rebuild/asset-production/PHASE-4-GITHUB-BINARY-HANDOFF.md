# ManaEvo Phase 4 — GitHub-native Binary Handoff

Status: **REQUIRED FOR W-303..W-320 ART READY HANDOFF**

Purpose: remove manual ZIP download/re-upload from Phase 4 operations. Once art is ART READY, the art owner must publish the actual WebP binaries to GitHub so the binary-ingestion Work can continue from comments/instructions only.

## 1. User interaction rule

The user must not be required to manually download, save, re-attach, or shuttle ZIP files between chats/Works.

Normal flow is:

art owner generates/QA's binaries -> art owner publishes ART READY binaries to GitHub -> ingestion Work fetches the same GitHub branch -> W-302 candidate-ingestion.mjs ingests them.

The user should only need to send a short comment such as "W-304 ART READY。ingestionを続けて".

## 2. Staging location

Each attribute Work Item W-303..W-320 uses its own existing attribute-production branch.

Preferred direct-binary staging path:

`design/rebuild/asset-production/art-ready/W-30X/mNNN.webp`

where `W-30X` is the owning Work Item and `mNNN` must be a species owned by that Work Item according to `PHASE-4-ATTRIBUTE-QUEUE.json`.

When connector payload limits prevent a single binary blob from being transmitted safely, use the chunked transport fallback defined in section 3.2 instead of requiring user ZIP transfer.

Do not stage another attribute's species. Do not stage m239.

## 3. Publishing ART READY binaries

After real-image generation, visual QA, candidate-safe WebP export and local SHA-256 are complete, the art owner must publish the actual per-ID WebP bytes, either directly or through the deterministic chunked transport fallback, to its attribute branch before reporting GitHub handoff complete.

Preferred path when a normal checkout has authenticated push:
- write the WebP files to the staging directory;
- commit;
- push the attribute branch.

If shell `git push` is unavailable but authenticated `@GitHub` object operations are available, use GitHub as the transport layer:
1. base64-encode each already-generated local WebP without altering it;
2. create Git blobs with `encoding=base64`;
3. create a tree based on the current attribute branch tree, adding the staging paths;
4. create one commit whose parent is the current attribute branch HEAD;
5. fast-forward the attribute branch ref to that commit;
6. verify the branch HEAD and staged paths through GitHub.

This GitHub-object fallback is transport only. It must not simulate W-302 candidate ingestion, archive semantics, provenance, or FORMAL promotion.

### 3.1 Binary hash validation — do not compare different hash domains

ART READY SHA-256 and Git blob object ID are different values and must never be compared directly.

Use these checks separately:

- `ART READY checksum` = SHA-256 of the raw WebP file bytes.
- `Git blob SHA` = Git object ID for the raw WebP bytes. In the current SHA-1 repository this is the value produced by `git hash-object <file>` and by GitHub `create_blob` when `encoding=base64` receives the exact file bytes.

For GitHub-object transport, validate each file in this order:
1. compute local raw-file SHA-256 and retain it for ART READY provenance;
2. compute local Git blob ID with `git hash-object <file>`;
3. base64-encode the exact raw bytes with no text conversion, newline insertion into the decoded payload, or UTF-8 round trip;
4. call GitHub `create_blob` with `encoding=base64`;
5. compare the returned Git blob SHA only with the local `git hash-object` result;
6. do not compare the returned Git blob SHA with the raw-file SHA-256;
7. after tree/commit/ref publication, checkout/fetch the branch normally and recompute SHA-256 from the staged WebP file; that staged SHA-256 must equal the original ART READY SHA-256.

If the returned Git blob SHA differs from `git hash-object <file>`, treat it as an encoding/byte-preservation problem for that file and diagnose before attaching the blob to a tree. Do not classify the whole attribute as blocked until the exact base64/raw-byte path has been checked.

A recommended deterministic base64 path is to read the file as bytes and encode directly (for example Python `base64.b64encode(open(path, "rb").read()).decode("ascii")`) rather than passing binary content through a text shell variable or text decoder.

### 3.2 Connector payload-limit fallback — chunked GitHub transport

If a direct `create_blob(encoding=base64)` attempt fails hash validation because the connector/request path truncates or drops part of a long payload, do not keep retrying the same large payload and do not ask the user to move ZIP files manually.

Use deterministic chunked text transport instead.

For each species `mNNN`:
1. read the exact raw WebP bytes locally;
2. compute and retain raw byte length and SHA-256;
3. base64-encode the complete raw file with no line wrapping;
4. split that ASCII base64 string into ordered chunks of **at most 32768 characters** each;
5. publish each chunk as a UTF-8 text file under:
   `design/rebuild/asset-production/art-ready-transport/W-30X/mNNN/part-0001.b64`, `part-0002.b64`, ...;
6. publish `design/rebuild/asset-production/art-ready-transport/W-30X/mNNN/manifest.json` containing at minimum:
   - `speciesId`
   - `encoding: "base64-chunks"`
   - `chunkCharsMax: 32768`
   - ordered `parts`
   - `rawBytes`
   - `rawSha256`
   - `originalFilename: "mNNN.webp"`;
7. after publication, refetch/checkout the branch, concatenate the listed parts in manifest order with **no inserted whitespace/newlines**, base64-decode them to a temporary `mNNN.webp`, and verify:
   - decoded byte length == `rawBytes`;
   - decoded SHA-256 == `rawSha256`;
   - RIFF/WEBP signature valid;
   - file size < 1,000,000 bytes;
8. only after successful reconstruction verification may the species be counted as GitHub handoff complete.

The chunk files are transport artifacts, not candidate assets. The Binary Ingestion Work must reconstruct temporary raw WebPs from the chunk transport before calling the unchanged W-302 `candidate-ingestion.mjs`.

The ingestion Work must not feed `.b64` parts directly to `candidate-ingestion.mjs` and must not reinterpret the chunk transport as candidate/provenance semantics.

After successful candidate ingestion and repository validation, remove both temporary direct staging under `art-ready/W-30X/` (if any) and chunked transport under `art-ready-transport/W-30X/` from the final attribute branch tree.

For a Work Item, direct WebP staging and chunked transport may coexist per species, but each species must have exactly one verified source path chosen for ingestion. Prefer direct WebP when valid; otherwise use verified chunk reconstruction.

A connector payload-limit failure is a transport limitation, not an image-generation failure. Status may be `ART READY / GITHUB HANDOFF COMPLETE` when all species are verifiably reconstructable from GitHub chunk transport even if no direct `mNNN.webp` staging path exists yet.

## 4. ART READY gate

For W-303..W-320, `ART READY` requires all of the following for the complete attribute scope:
- real candidate image generated;
- visual QA passed or explicitly dispositioned;
- candidate-safe WebP prepared;
- file size below 1,000,000 bytes;
- local SHA-256 recorded;
- actual WebP bytes made recoverable from the attribute branch, either as direct WebP staging or verified chunk transport;
- reconstructed/staged checksum verified against the locally recorded checksum;
- review ledger/result updated.

A local-only ZIP/package is optional convenience output, not the handoff contract and not required for the user to transfer.

If images exist only inside a chat/runtime and are not recoverable from GitHub, status is `ART READY LOCAL / GITHUB HANDOFF BLOCKED`, not the normal `ART READY` handoff state.

## 5. Binary ingestion Work

The ingestion Work does not ask the user for ZIP re-attachment.

For a requested Work Item:
1. fetch the owning attribute-production branch from GitHub;
2. confirm the exact scope from `PHASE-4-ATTRIBUTE-QUEUE.json`;
3. for each species, prefer a verified direct source WebP from `design/rebuild/asset-production/art-ready/W-30X/`; if absent, reconstruct a temporary WebP from the verified `art-ready-transport/W-30X/mNNN/manifest.json` + ordered chunk parts;
4. verify WebP / size / checksum / species ownership on the reconstructed or direct raw file;
5. run the existing W-302 `candidate-ingestion.mjs` from the real checkout using that raw WebP as `--source`;
6. for replacements, preserve required old candidate archive and old/new provenance semantics;
7. validate repository target binaries and checksums;
8. update ledger/provenance from actual ingestion results;
9. remove the temporary `art-ready/W-30X/` and/or `art-ready-transport/W-30X/` staging files after successful ingestion;
10. commit/publish the resulting attribute branch and update its PR.

Do not replace the script with manual Git-object construction.

## 6. Push/authentication split

Shell GitHub authentication failure is not a reason to make the user shuttle files manually.

If local checkout/script execution can create a correct commit but shell push is unavailable, an authenticated GitHub connector may publish the already-created result only when it can preserve the exact resulting tree. Otherwise record `INGESTION EXECUTED / PUBLISH BLOCKED` and preserve a deterministic commit/bundle for a later authenticated publisher.

For ART READY binary handoff itself, authenticated GitHub blob/tree/commit/ref operations or the chunked text transport fallback are explicitly allowed because they only make already-generated source bytes reachable by the ingestion checkout.

## 7. Separation of gates

Keep these states separate:
- real image generation;
- ART READY GitHub handoff;
- candidate ingestion;
- cross-attribute QA;
- FORMAL promotion.

Staging or reconstructing a WebP through `art-ready` / `art-ready-transport` does not make it a repository CANDIDATE. Only W-302 candidate ingestion into the canonical candidate target/provenance flow does that.

FORMAL remains a later explicit approval gate.

## 8. Cleanup

Temporary ART READY staging paths should not remain in the final attribute PR tree after successful candidate ingestion. Delete direct staging and chunked transport files in the ingestion completion commit after all target binaries, archive/provenance, checksums and validation pass.
