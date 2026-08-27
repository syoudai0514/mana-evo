# W-304 Fire Attribute Production

Status: **ART READY / ATTRIBUTE-PURITY RE-QA PASS / INGESTION PENDING**  
Work Item: `W-304`  
Attribute: `fire`  
Branch: `rebuild/w-304-fire-attribute-production`  
Canonical governance: `884078badb3909f13021f2f729e2459aba13e73b`  
Canonical sync merge: `7d59b2f9793a77a27154b5263edd6e98fa744e9d`

## Scope

`PHASE-4-ATTRIBUTE-QUEUE.json` mechanically resolves W-304 to exactly:

- F002: m004 → m005 → m006
- F019: m055 → m056 → m057
- F020: m058 → m059 → m060
- F072: m211 → m212 → m213

Total: 4 families / 12 species. `m239` remains excluded. No non-fire species is counted or displayed as W-304 candidate output.

## Latest common-rule application

The W-304 branch was merged with `rebuild/canonical-governance` HEAD `884078badb3909f13021f2f729e2459aba13e73b` before this re-QA. The new `Attribute purity and type-readability gate` in `PHASE-4-STYLE-LOCK.md` is therefore authoritative for this review.

The complete 12-species fire owner scope was re-reviewed side-by-side. The gate was applied independently from metadata labels: each candidate must visually read FIRE at small game size from body/material/signature structure, while the four fire families must remain distinct in anatomy, silhouette, material, motion and role.

### Re-QA result

| Family | Result | Fire-primary rationale | Action |
|---|---|---|---|
| F002 | **PASS** | flame mane/tail are integrated into the child-beast body language; warm fur/charcoal distribution and developed mane keep FIRE dominant | keep existing generated candidate set |
| F019 | **PASS** | glowing magma fissures and molten mass are structural material, not an added aura; the read remains FIRE rather than ROCK | keep existing generated candidate set |
| F020 | **REGENERATE → PASS** | previous candidate read first as lamp/mechanical construct and depended too much on a small flame; new version makes combustion chamber, melted wax, charred wick and red-hot material the body itself | regenerate m058-m060 only |
| F072 | **PASS** | flame is integrated into feather edges/plumage and rebirth silhouette; FIRE remains primary rather than generic FLYING | keep existing generated candidate set |

No other family was regenerated under this rule update.

## Attribute anti-duplication matrix

| Family | Body plan | Signature feature | Palette/material | Silhouette / motion | Final role |
|---|---|---|---|---|---|
| F002 | grounded mobile child-beast | localized flame tail → protective mane | orange/red fur + charcoal + cream; fur/flame | compact beast → broad mane guardian | calm protector |
| F019 | non-avian volcanic mass | basalt shell + magma fissures + dorsal volcanic mass | black basalt + orange-red magma | round molten core → heavy volcanic mass | seismic volcanic guardian |
| F020 | wax-combustion beacon construct | protected internal flame chamber + charred wick + molten wax | amber/orange red-hot wax + charred brown/black + limited ivory | low wick body → vertical combustion lantern → tripod lighthouse mass | stable fire beacon |
| F072 | avian rebirth line | burning feather tips → broad flame-feather wings/tail | gold/yellow flame + charcoal ash + cream | fledgling → stronger bird → broad-wing final | rebirth sky guardian |

The four families are separated by anatomy, silhouette, material, motion and fire-expression location rather than recolor or aura swaps.

## F020 regeneration rule response

The earlier F020 concept was not discarded because of naming or lore. It failed only the new visual gate. The replacement preserves CURRENT `ろうそくと灯台` identity but changes how FIRE is perceived:

- m058: low semi-molten wax body centered on a large protected combustion core;
- m059: taller body with a developed amber combustion chamber and charred wick/chimney structure;
- m060: stable tripod beacon/lighthouse body with a large internal furnace as the dominant mass/read.

Animal ears, horns, wings, tail, muzzle and generic mascot anatomy are not used. Fire is expressed through combustion, soot, charring, melting, translucent heated wax and internal incandescence rather than a detached aura.

## Re-QA acceptance state

- owner scope exactly once: **PASS — 12/12**
- only fire candidates in W-304 review set: **PASS**
- attribute purity / type readability: **PASS — 12/12 after F020 regeneration**
- family differentiation inside fire: **PASS**
- family continuity: **PASS**
- stage progression: **PASS**
- small-size readability: **PASS**
- crop/background/text compliance: **PASS**
- originality / no specific-IP reference: **PASS**
- m239 exclusion: **PASS**

## Candidate ingestion state

This re-QA update does not claim repository candidate ingestion that has not been materialized on the branch. W-302 ingestion semantics remain the required next step for all 12 WebP candidates, including archive/provenance preservation for existing m004-m006 candidates.

- real candidate images in W-304 working set: **12 / 12**
- candidates regenerated because of the new purity gate: **3 / 12 (m058-m060 only)**
- attribute-purity re-QA: **12 / 12 PASS**
- repository candidate ingestion: **0 / 12 at this checkpoint**
- FORMAL promotion: **0**
- W-321/W-322: **NOT STARTED**
- main merge: **NOT PERFORMED**
