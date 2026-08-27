# Production Candidate Art Rollout

Date: 2026-08-27

User decision: publish the rebuilt ManaEvo runtime to production now with the currently ingested real monster artwork, then increase the visible monster artwork progressively as subsequent Phase 4 work items complete.

Initial production artwork scope:
- W-303 grass: 16 species
- W-304 fire: 12 species
- W-305 water: 21 species
- Total: 49 species

Runtime policy for this rollout:
- The 49-species explicit candidate-art overlay is allowed in production.
- This does not constitute FORMAL promotion.
- `design/current/monster-asset-manifest.json` is not rewritten merely to expose candidate art.
- m239 remains excluded.
- Future completed candidate work items may be added incrementally after their binary handoff / candidate-ingestion validation succeeds.

This record supersedes the prior preview-only restriction for the 49-species overlay. It does not bypass Phase 4 asset QA, ingestion, provenance, or checksum requirements for future additions.
