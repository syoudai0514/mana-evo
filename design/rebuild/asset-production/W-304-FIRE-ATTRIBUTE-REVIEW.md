# W-304 Fire Attribute Production

Status: **ART READY / INGESTION BLOCKED**  
Work Item: `W-304`  
Attribute: `fire`  
Branch: `rebuild/w-304-fire-attribute-production`  
Base: `rebuild/canonical-governance` @ `b2f4face6ff1b332449df7c4ebbcc45b7211b186`

## Scope

`PHASE-4-ATTRIBUTE-QUEUE.json` mechanically resolves W-304 to exactly:

- F002: m004 → m005 → m006
- F019: m055 → m056 → m057
- F020: m058 → m059 → m060
- F072: m211 → m212 → m213

Total: 4 families / 12 species. `m239` remains excluded. No other attribute scope was entered.

## Reference discipline

CURRENT identity and descriptions were used first. F002 existing CURRENT candidates were treated as REFINE input. 0822 material remained historical reference only. W-303 user-approved real images were used only as a quality anchor for rendering quality, detail density, lighting, material finish, small-size readability and full-body crop/presentation; no W-303 character anatomy, face, eye, ear, horn, limb or silhouette was copied.

## Attribute anti-duplication matrix

| Family | Body plan | Signature feature | Palette/material | Silhouette / motion | Final role |
|---|---|---|---|---|---|
| F002 | grounded mobile child-beast | localized flame tail → protective mane | orange/red fur + charcoal + cream; fur/flame | compact beast → broad mane guardian | calm protector |
| F019 | non-avian volcanic mass | basalt shell + magma fissures + dorsal volcanic mass | black basalt + orange-red magma | round core → heavy volcanic mass | seismic volcanic guardian |
| F020 | wax/lantern construct | protected central flame chamber + hood | ivory wax + amber glass/light | wick body → vertical lantern → tripod lighthouse | stable cave beacon |
| F072 | avian rebirth line | burning feather tips → broad wings/tail | gold/yellow + charcoal ash + cream | fledgling → broad sky silhouette | rebirth sky guardian |

The four families are separated by anatomy, silhouette, material, motion and VFX location rather than recolor/aura swaps.

## Generation disposition

- F002: **REFINE** — child-beast lineage retained; fire localized to signature features; final reads as protection rather than anger.
- F019: **REGENERATE** — rebuilt from magma/volcano CURRENT identity. One prior generation attempt hit third-party-similarity screening; that attempt was discarded and the body plan/prompt direction was materially changed before regeneration.
- F020: **REGENERATE** — built directly from candle/lighthouse identity as a wax/glass light-bearing construct rather than animal anatomy.
- F072: **REGENERATE** — avian rebirth lineage; gold/charcoal/cream distribution separates it from F002.

## Art-ready QA

All 12 final local exports:
- actual 512×512 WebP candidate-safe images;
- transparent background;
- full body;
- no baked name / number / attribute label / UI / frame / scenery;
- strictly below 1,000,000 bytes;
- family continuity PASS;
- stage progression PASS;
- same-fire anti-duplication PASS;
- small-size readability PASS;
- originality review PASS with no specific existing IP/franchise/character references.

Per-species bytes and SHA-256 are recorded in `W-304-FIRE-REVIEW-LEDGER.json`.

## Candidate ingestion gate

W-302 `candidate-ingestion.mjs` semantics were executed and validated locally for all 12 candidate-safe exports. For m004-m006, the existing repository candidates were reconstructed byte-for-byte from GitHub base64 reads and their SHA-256 values were verified before local archive/replacement rehearsal. m239 fail-closed behavior also passed.

However, this runtime has no direct local-binary → GitHub repository upload bridge. Therefore the generated WebP files and corresponding ingestion provenance cannot be faithfully placed into the W-304 branch from this environment. No repository ingestion is simulated or fabricated.

Current gate:
- real image generation: **12 / 12**
- visual QA: **12 / 12 PASS**
- candidate-safe export: **12 / 12**
- local W-302 ingestion rehearsal: **12 / 12 PASS**
- repository candidate ingestion: **0 / 12 — BLOCKED CAPABILITY**
- FORMAL promotion: **0**
- W-321/W-322: **NOT STARTED**
- main merge: **NOT PERFORMED**
