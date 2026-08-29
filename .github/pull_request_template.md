## Summary

<!-- What changed and why? -->

## Canonical impact declaration

<!--
Required when this PR touches protected runtime/art paths.
CI reads these exact markers.

Use one of:
Canonical-Impact: changed
Canonical-Impact: none

If `changed`, list owning domains from `design/current/canonical-sync-map.json` and update:
1) the owning `design/current/**` contract(s), and
2) `design/rebuild/DECISION-LOG.md`.

If `none`, explain why the code/art change does not change the product contract.
-->

Canonical-Impact: 
Canonical-Domains: 
Canonical-Reason: 

## Acceptance / evidence

- Tests:
- Build:
- iPhone/WebKit/manual evidence:
- Runtime/deployment evidence:
- User approval evidence, if required:

## Boundaries

- [ ] I did not treat CI PASS alone as product approval.
- [ ] I checked the owning CURRENT contract(s) before implementation.
- [ ] If product behavior changed, CURRENT + Decision Log changed in this same PR.
- [ ] If product behavior did not change, `Canonical-Impact: none` has a concrete reason.
