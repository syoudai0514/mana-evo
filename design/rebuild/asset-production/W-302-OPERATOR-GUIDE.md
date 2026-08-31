# W-302 Monster Art Ingestion / Queue Operator Guide

Status: **HISTORICAL PHASE-4 CANDIDATE TOOLING + CURRENT REFERENCE**

W-302 originally prepared the Phase 4 candidate-ingestion/queue tooling before any FORMAL promotion. The original tool semantics remain important, but the repository itself has moved on: as of the 2026-08-31 final closeout, active runtime art is **FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0** and `m239` remains excluded.

For future FORMAL image replacement/maintenance, start with:

- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`

Do not interpret old W-302 statements such as “FORMAL=0” as current repository state.

## Canonical invariants

Permanent invariants:

- Active IDs: `m001-m238` only.
- Active species: 238.
- Active families: 83.
- CURRENT types: 18.
- `m239` is historical/excluded and must be rejected.
- Each family belongs to exactly one type owner and is never split.
- 0822 boards are reference-only and never override CURRENT names/IDs/types/families/counts.

Historical W-302-only invariant:

- During W-302 itself, `design/current/monster-asset-manifest.json` intentionally remained FORMAL=0 because W-302 was tooling/reference preparation, not approval.

Current post-closeout state:

- `design/current/monster-asset-manifest.json`: FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0.
- FORMAL approval remains explicit; current counts do not weaken the separation between candidate ingestion and approval.

## Regenerate/check the attribute queue and review ledger

```bash
node scripts/monster-art/attribute-queue.mjs
node scripts/monster-art/attribute-queue.mjs --check
```

The generator reads only:

- `design/current/monsters/descriptions-001-080.json`
- `design/current/monsters/descriptions-081-160.json`
- `design/current/monsters/descriptions-161-238.json`
- `design/current/monster-asset-manifest.json`

Outputs:

- `design/rebuild/asset-production/PHASE-4-ATTRIBUTE-QUEUE.json`
- `design/rebuild/asset-production/PHASE-4-REVIEW-LEDGER.json`

A mixed-type family fails closed with `BLOCKED`-style error semantics instead of being split.

> Post-closeout note: queue/ledger generation is no longer a signal that a global production wave should restart. Use it only when a current maintenance/review task actually requires it.

## GitHub-native ART READY handoff

For W-303..W-320 historical attribute production, and for future binary maintenance where applicable, do not require the user to manually download/re-upload ZIP files between chats or Works when authenticated GitHub handoff can preserve exact bytes.

Use `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md` as the transport/handoff protocol.

Historical attribute flow:

- the attribute art owner publishes the actual ART READY WebP binaries to its own attribute-production branch under `design/rebuild/asset-production/art-ready/W-30X/`;
- the ingestion Work fetches that branch through normal Git checkout;
- the WebPs from that staging path become `--source` inputs to `candidate-ingestion.mjs`;
- after successful ingestion/validation, the temporary staging files are removed from the final branch tree.

If shell `git push` is unavailable but authenticated GitHub blob/tree/commit/ref operations are available, those operations may be used only to transport already-generated ART READY binaries. They must not emulate candidate ingestion, archive/provenance semantics, FORMAL approval, or FORMAL replacement semantics.

A local-only ZIP is optional convenience output and is not the normal handoff contract. If ZIP is intentionally used, it must include a verifiable manifest as described in the maintenance runbook.

## Candidate ingestion

Dry-run first:

```bash
node scripts/monster-art/candidate-ingestion.mjs \
  --species mNNN \
  --source /path/to/candidate.webp \
  --source-label "W-30X review candidate"
```

Execute only after candidate review is intended:

```bash
node scripts/monster-art/candidate-ingestion.mjs \
  --species mNNN \
  --source /path/to/candidate.webp \
  --source-label "W-30X approved-for-candidate-review" \
  --execute
```

Guards:

- rejects `m239` and unknown IDs;
- accepts WebP only;
- requires file size strictly below 1,000,000 bytes;
- verifies RIFF/WEBP signature;
- refuses to replace a manifest state already marked FORMAL;
- archives the previous repository candidate by SHA-256 before replacement when one exists;
- appends old/new checksum and source provenance under `design/rebuild/asset-production/candidate-provenance/`;
- never promotes manifest state to FORMAL.

### Important post-closeout meaning of the FORMAL guard

Because all 238 active species are currently FORMAL, future artwork fixes are normally **FORMAL replacements**, not ordinary W-302 candidate ingestion. Do not bypass the script's FORMAL refusal just to force a write.

Use `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`: fresh-read the current FORMAL SHA, validate the replacement, preserve/archive old bytes and provenance, obtain explicit approval evidence, synchronize revisions, and prove no unexpected species changed.

If the project later introduces a dedicated FORMAL-replacement script, that reviewed tool should become the preferred implementation. Until then, do not pretend `candidate-ingestion.mjs` models FORMAL replacement semantics.

## Separate FORMAL promotion command

`promote-formal.mjs` was designed for the later explicit approval of an eligible non-FORMAL candidate. It is separate from W-302 ingestion and is not a general “make any image official” command.

Dry-run requires explicit evidence:

```bash
node scripts/monster-art/promote-formal.mjs \
  --species mNNN \
  --approval-evidence /path/to/current-formal-approval.json
```

Required evidence shape:

```json
{
  "speciesId": "mNNN",
  "approved": true,
  "approvalType": "CURRENT_FORMAL",
  "approvedBy": "explicit approver identity",
  "approvedAt": "2026-08-25T00:00:00Z",
  "source": "explicit approval evidence path or URL"
}
```

Actual manifest mutation additionally requires `--execute`. Missing/mismatched evidence fails closed.

For an already-FORMAL binary replacement, preserve FORMAL replacement/history semantics rather than demoting/re-promoting merely to reuse this command.

## Candidate/FORMAL idempotency

Before any write, compare the incoming raw SHA-256 to CURRENT.

If the supplied bytes already match the current intended asset:

- do not rewrite the binary;
- do not append duplicate provenance/history;
- record `ALREADY_MATCHES` / idempotent PASS;
- continue only with targets that actually differ.

This distinction was used in final PR #128: five of the final seven supplied assets already matched their FORMAL bytes; only `m160` and `m235` were actual replacement writes.

## Actual-binary validation before ingestion

Never trust a filename, manifest or prior chat report in place of decoding the actual supplied bytes.

For current release handoff, verify at minimum:

- expected species/scope;
- RIFF/WEBP;
- exact `512×512` dimensions;
- actual alpha;
- raw byte length and SHA-256 against the package manifest if present;
- visual identity/crop/background/collage/artifact rules from `PHASE-4-STYLE-LOCK.md` and the maintenance runbook.

The final closeout caught a supplied `m160.webp` at 1024×1024. Registration correctly stopped at the first failed dimension gate.

## 0822 historical reference

Use:

- `design/rebuild/asset-reference/0822/HISTORICAL-REFERENCE-INDEX.md`
- `design/rebuild/asset-reference/0822/REFERENCE-MANIFEST.json`
- `design/rebuild/asset-reference/0822/CONTACT-SHEET-INDEX.md`
- `contact-01.webp` .. `contact-04.webp`

The source archive SHA-256 is:

`a32a2f22a4b93b97ac66911f32fbaf16edd4bf05d55c57104d205612c6096c5c`

Historical references never override fresh CURRENT metadata or current binary identity.

## Validation

Historical W-302 tooling checks:

```bash
node --check scripts/monster-art/attribute-queue.mjs
node --check scripts/monster-art/candidate-ingestion.mjs
node --check scripts/monster-art/promote-formal.mjs
node --check tests/monster-art-ingestion.test.js
node --test tests/monster-art-ingestion.test.js
```

For any real repository/release change, also run the current repository test suite and production build as required by the current project contract.

Do not permanently hard-code the 2026-08-31 `290/290` test count; it is historical release evidence and the suite may grow.

## Release completion is later than FORMAL

Even after a target is FORMAL, a production release is not complete until the intended state is:

1. committed/merged to the correct main branch;
2. production-deployed;
3. verified live through the production revision endpoint and, when relevant, visual image fetch.

For full-roster art release, additionally verify FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0 and `m239` excluded.
