# W-302 Handoff — Phase 4 Monster Art Ingestion

## What W-302 establishes

W-302 converts Phase 4 art work into a GitHub-only, attribute-owned workflow without changing gameplay/runtime behavior or performing any FORMAL promotion.

### Canonical scope

- active: `m001-m238`
- 238 species
- 83 families
- 18 CURRENT types
- excluded historical reference: `m239`

### Attribute ownership

Use `PHASE-4-ATTRIBUTE-QUEUE.json` as the only membership source for W-303..W-320. Each family is assigned exactly once to exactly one attribute owner and remains whole.

### Historical reference

The user-supplied 0822 archive was verified at SHA-256:

`a32a2f22a4b93b97ac66911f32fbaf16edd4bf05d55c57104d205612c6096c5c`

It contains 34 PNG boards. W-302 disposition:

- KEEP: 34/34 as reference evidence
- REFINE: GitHub contact sheets + checksum manifest + index
- REGENERATE: 0 at W-302 level

Per-family KEEP / REFINE / REGENERATE remains the responsibility of W-303..W-320 after CURRENT-first comparison.

### Candidate safety

- candidate ingestion is keyed by `mNNN`;
- WebP must be `< 1 MB`;
- old candidate checksum/provenance is preserved before replacement;
- `m239`/unknown IDs are rejected;
- FORMAL mutation is a separate command guarded by explicit approval evidence and `--execute`;
- W-302 does not run FORMAL promotion.

## Next worker sequence

1. Read CURRENT description for the family.
2. Read the W-302 attribute queue membership.
3. Review every family in the owned attribute side-by-side.
4. Check CURRENT candidate paths when present.
5. Check 0822 contact sheets/reference manifest.
6. Fill the anti-duplication matrix before generation/replacement.
7. Ingest reviewed candidate WebP with provenance preservation.
8. Record PASS / REGENERATE / BLOCKED and KEEP / REFINE / REGENERATE.
9. Do not mark FORMAL without a later explicit approval event.
