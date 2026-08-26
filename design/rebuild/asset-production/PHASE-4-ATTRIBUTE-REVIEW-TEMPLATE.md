# Phase 4 Attribute Review Template

Status: **CANDIDATE REVIEW ONLY — NO FORMAL PROMOTION**

Use one copy per attribute owner W-303..W-320. Membership must come from `PHASE-4-ATTRIBUTE-QUEUE.json`; do not invent contiguous No ranges.

## Preconditions

- CURRENT identity is `design/current/**`.
- Active scope is exactly `m001-m238`; `m239` is rejected.
- Historical 0822 materials are **REFERENCE ONLY**.
- Review the complete attribute side-by-side before accepting/regenerating any family.
- A family must remain whole under one attribute owner.
- The production/review board for this Work Item contains **only species owned by this attribute**. Cross-attribute candidates are not alternatives for this Work Item and must not be counted as its output.
- Cross-attribute comparison is reserved for W-321 or a separately labelled reference-only panel.

## Attribute anti-duplication matrix

| familyNo | speciesIds | CURRENT motif/familyConcept pointer | existing CURRENT candidate | 0822 historical reference | base anatomy/body plan | signature feature | dominant palette | silhouette category | elemental VFX language | personality/expression | final-stage visual role | disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F___ | m___ | queue pointer | path / none | board/contact note |  |  |  |  |  |  |  | KEEP / REFINE / REGENERATE / BLOCKED |

### Attribute-level differentiation gate

Before generation/review is complete, compare every unrelated family pair and confirm:

- [ ] No defining silhouette/template is duplicated.
- [ ] Palette is not just one attribute color formula repeated across families.
- [ ] Horns, wings, ears, tails, crests, armor, limbs, and face proportions are not mechanically cloned.
- [ ] Elemental aura/VFX is not the only differentiator.
- [ ] Personality/pose language differs where CURRENT family concepts differ.
- [ ] Final forms have distinct presence/role rather than the same “bigger cute mascot” escalation.

### Attribute purity / type-readability gate

Before accepting the attribute batch, review the entire owner scope side-by-side and confirm:

- [ ] Every displayed production candidate belongs to this Work Item's exact attribute ownership set from `PHASE-4-ATTRIBUTE-QUEUE.json`.
- [ ] No other attribute's generated candidate is mixed into this Work Item's production/review board.
- [ ] Every candidate's **primary visual read** is the assigned CURRENT type at small game size without relying on a type label.
- [ ] Type identity comes from body/material/motif/signature feature, not only color or aura.
- [ ] Family-level diversity does not make a candidate read primarily as another type.
- [ ] Any candidate that reads primarily as another type is marked `REGENERATE`, even when metadata type is correct.

When a motif naturally overlaps another type, record the collision risk explicitly. Example: volcano/stone can drift toward rock, bird anatomy toward flying, lamp/light toward electric/fairy/light-like reads. The assigned CURRENT type must remain visually dominant.

## Family continuity review

For each family, review all stages together.

| check | result | notes |
|---|---|---|
| at least two continuity signals remain (face / color / signature body feature) | PASS / FAIL | |
| stage progression is visible | PASS / FAIL | |
| low stage is approachable/readable without forcing uniform cuteness | PASS / FAIL | |
| middle stage visibly develops the first form | PASS / FAIL / N/A | |
| final stage has sufficient presence where applicable | PASS / FAIL / N/A | |
| type impression is readable at small size | PASS / FAIL | |
| primary visual read is the assigned CURRENT type, not a neighboring type | PASS / FAIL | |
| no text baked into image | PASS / FAIL | |
| full body/crop/background rules pass | PASS / FAIL | |
| candidate is original and does not imitate a specific existing-IP character | PASS / FAIL | |
| target WebP is below 1 MB | PASS / FAIL | |

## Historical design disposition

Record one of:

- **KEEP** — historical/current candidate visual identity remains compatible; preserve it.
- **REFINE** — preserve useful silhouette/palette/evolution identity but correct CURRENT/readability/differentiation/technical issues.
- **REGENERATE** — prior proposal is incompatible, too duplicative, technically unusable, visually reads as the wrong type, or originality/readability fails.
- **BLOCKED** — CURRENT ambiguity or cross-owner conflict requires commander review.

Do not infer CURRENT names, IDs, stages, types, family membership, or approval state from the 0822 boards.

## Per-species candidate result

| speciesId | familyNo | stage | candidate checksum | review status | disposition | notes | provenance recorded |
|---|---:|---:|---|---|---|---|---|
| m___ |  |  | sha256 | PASS / REGENERATE / BLOCKED | KEEP / REFINE / REGENERATE / BLOCKED |  | yes/no |

## Completion gate

- [ ] Every family in this attribute queue is reviewed exactly once.
- [ ] No family outside this attribute was edited.
- [ ] Every species in the attribute queue is represented exactly once.
- [ ] Production/review board contains only the owning attribute's candidates.
- [ ] Every accepted candidate passes assigned-type readability at small size.
- [ ] Old/new candidate checksum/provenance is preserved for replacements.
- [ ] No `FORMAL` manifest promotion was performed.
- [ ] `m239` remains excluded.
