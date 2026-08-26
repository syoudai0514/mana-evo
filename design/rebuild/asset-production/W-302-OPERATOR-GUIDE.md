# W-302 Monster Art Ingestion / Queue Operator Guide

Status: **Phase 4 tooling/reference preparation only — no FORMAL approval**

## Canonical invariants

- Active IDs: `m001-m238` only.
- Active species: 238.
- Active families: 83.
- CURRENT types: 18.
- `m239` is historical/excluded and must be rejected.
- Each family belongs to exactly one type owner and is never split.
- `design/current/monster-asset-manifest.json` remains FORMAL=0 in W-302.
- 0822 boards are reference-only and never override CURRENT names/IDs/types/families/counts.

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

## GitHub-native ART READY handoff

For W-303..W-320, do not require the user to manually download/re-upload ZIP files between chats or Works.

Use `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md` as the transport/handoff protocol.

Required flow:
- the attribute art owner publishes the actual ART READY WebP binaries to its own attribute-production branch under `design/rebuild/asset-production/art-ready/W-30X/`;
- the ingestion Work fetches that branch through normal Git checkout;
- the WebPs from that staging path become `--source` inputs to the existing `candidate-ingestion.mjs`;
- after successful ingestion/validation, the temporary staging files are removed from the final branch tree.

If shell `git push` is unavailable to the art owner but authenticated GitHub blob/tree/commit/ref operations are available, those operations may be used only to transport already-generated ART READY binaries to the staging path. They must not emulate candidate ingestion, archive/provenance semantics, or FORMAL promotion.

A local-only ZIP is optional convenience output and is not the normal handoff contract.

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
- requires file size **strictly below 1,000,000 bytes**;
- verifies RIFF/WEBP signature;
- refuses to replace a manifest state already marked FORMAL;
- archives the previous repository candidate by SHA-256 before replacement when one exists;
- appends old/new checksum and source provenance under `design/rebuild/asset-production/candidate-provenance/`;
- never promotes manifest state to FORMAL.

## Separate FORMAL promotion command

`promote-formal.mjs` exists for a later explicit approval step. **Do not execute it in W-302.**

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

## 0822 historical reference

Use:

- `design/rebuild/asset-reference/0822/HISTORICAL-REFERENCE-INDEX.md`
- `design/rebuild/asset-reference/0822/REFERENCE-MANIFEST.json`
- `design/rebuild/asset-reference/0822/CONTACT-SHEET-INDEX.md`
- `contact-01.webp` .. `contact-04.webp`

The source archive SHA-256 is:

`a32a2f22a4b93b97ac66911f32fbaf16edd4bf05d55c57104d205612c6096c5c`

## Validation

```bash
node --check scripts/monster-art/attribute-queue.mjs
node --check scripts/monster-art/candidate-ingestion.mjs
node --check scripts/monster-art/promote-formal.mjs
node --check tests/monster-art-ingestion.test.js
node --test tests/monster-art-ingestion.test.js
```

When a full checkout/dependency install is available, also run repository `npm test` / production build as appropriate. W-302 itself changes no gameplay/runtime source.
