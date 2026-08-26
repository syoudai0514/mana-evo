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

Before repository candidate ingestion, ART READY source binaries are staged on that branch under:

`design/rebuild/asset-production/art-ready/W-30X/mNNN.webp`

where `W-30X` is the owning Work Item and `mNNN` must be a species owned by that Work Item according to `PHASE-4-ATTRIBUTE-QUEUE.json`.

Do not stage another attribute's species. Do not stage m239.

## 3. Publishing ART READY binaries

After real-image generation, visual QA, candidate-safe WebP export and local SHA-256 are complete, the art owner must publish the actual per-ID WebP binaries to its attribute branch before reporting ART READY.

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

## 4. ART READY gate

For W-303..W-320, `ART READY` requires all of the following for the complete attribute scope:
- real candidate image generated;
- visual QA passed or explicitly dispositioned;
- candidate-safe WebP prepared;
- file size below 1,000,000 bytes;
- local SHA-256 recorded;
- actual WebP binary published to the attribute branch staging path;
- staging checksum verified against the locally recorded checksum;
- review ledger/result updated.

A local-only ZIP/package is optional convenience output, not the handoff contract and not required for the user to transfer.

If images exist only inside a chat/runtime and are not reachable from GitHub, status is `ART READY LOCAL / GITHUB HANDOFF BLOCKED`, not the normal `ART READY` handoff state.

## 5. Binary ingestion Work

The ingestion Work does not ask the user for ZIP re-attachment.

For a requested Work Item:
1. fetch the owning attribute-production branch from GitHub;
2. confirm the exact scope from `PHASE-4-ATTRIBUTE-QUEUE.json`;
3. read source WebPs from `design/rebuild/asset-production/art-ready/W-30X/`;
4. verify WebP / size / checksum / species ownership;
5. run the existing W-302 `candidate-ingestion.mjs` from the real checkout;
6. for replacements, preserve required old candidate archive and old/new provenance semantics;
7. validate repository target binaries and checksums;
8. update ledger/provenance from actual ingestion results;
9. remove the temporary `art-ready/W-30X/` staging files after successful ingestion;
10. commit/publish the resulting attribute branch and update its PR.

Do not replace the script with manual Git-object construction.

## 6. Push/authentication split

Shell GitHub authentication failure is not a reason to make the user shuttle files manually.

If local checkout/script execution can create a correct commit but shell push is unavailable, an authenticated GitHub connector may publish the already-created result only when it can preserve the exact resulting tree. Otherwise record `INGESTION EXECUTED / PUBLISH BLOCKED` and preserve a deterministic commit/bundle for a later authenticated publisher.

For ART READY binary handoff itself, authenticated GitHub blob/tree/commit/ref operations are explicitly allowed because they only make already-generated source binaries reachable by the ingestion checkout.

## 7. Separation of gates

Keep these states separate:
- real image generation;
- ART READY GitHub handoff;
- candidate ingestion;
- cross-attribute QA;
- FORMAL promotion.

Staging a WebP under `art-ready/W-30X/` does not make it a repository CANDIDATE. Only W-302 candidate ingestion into the canonical candidate target/provenance flow does that.

FORMAL remains a later explicit approval gate.

## 8. Cleanup

Temporary ART READY staging paths should not remain in the final attribute PR tree after successful candidate ingestion. Delete the staging files in the ingestion completion commit after all target binaries, archive/provenance, checksums and validation pass.
