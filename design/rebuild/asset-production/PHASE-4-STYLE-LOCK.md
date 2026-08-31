# ManaEvo Phase 4 Monster Art — Global Style Lock

Status: **APPROVED — GLOBAL RENDERING LANGUAGE / POST-CLOSEOUT MAINTENANCE CONTRACT**

Work Item: `W-301`

Approval:
- Commander review completed against `W-301-STYLE-CALIBRATION-REVIEW.md`.
- User authorized Phase 4 continuation on 2026-08-26.
- The 238-species art closeout completed on 2026-08-31; the visual language in this file remains the maintenance baseline.
- This approval locks rendering/review rules only. It does **not** by itself approve an individual replacement asset as FORMAL.

Scope:
- Active monsters: `m001-m238`
- Active families: 83
- CURRENT types: 18
- `m239` remains excluded historical reference only.

Reference order for every art decision:
1. CURRENT species/family identity and descriptions.
2. Existing CURRENT FORMAL/candidate asset, when present.
3. 0822 historical visual reference.
4. This global rendering style lock.

If any lower-priority reference conflicts with CURRENT identity, CURRENT wins.

## 1. Global rendering principle

ManaEvo monsters must look like they belong to one game through shared rendering finish, crop discipline, light coherence and readability — **not** by sharing one anatomy/template.

Allowed body plans include, where CURRENT supports them: quadruped, biped, serpent, bird, insect, jelly/soft body, plant/tree, machine, rock/mineral, humanoid-like and other family-specific structures.

Do not create a house template for ears, horns, eyes, wings, limbs, torso, muzzle or final-stage body plan.

**Do not animalize a non-animal CURRENT concept merely to make it feel more like a monster.** Plant/tree, machine, mineral and other unusual organisms should gain creature readability through concept-compatible structure, posture, face/signature features and rendering — not by automatically becoming a mammal/dragon/quadruped.

The final m235/F080 lesson is canonical for this rule: `ユグドラシア` is the world tree itself. The correct direction is a monsterized world-tree organism, not an animal decorated with tree parts.

## 2. Silhouette and detail hierarchy

Build each design in this order:
1. large silhouette mass;
2. family signature feature;
3. secondary details.

Stage 1 uses the fewest secondary detail clusters. Middle stages visibly develop one family feature. Final stages may be richer, but ornament must remain subordinate to silhouette and role.

Micro-detail that disappears at game size must never be required to identify the species.

The final release silhouette must read as **one intended creature**. A scenery mass, rectangular cut-out, unrelated companion or detached foreign fragment must not be counted as part of the creature merely because it shares the same transparent canvas.

## 3. Proportion

Use the CURRENT primary range of roughly 2-4 heads tall where anatomy permits, but do not force non-humanoid families into a fixed head-count formula.

Youth/maturity may be shown through compactness, relative head size, body mass, posture, unfinished/completed signature features, stance or material development.

Evolution must not universally mean "smaller head + more armor + more spikes".

## 4. Face and eye language

There is no universal ManaEvo eye shape.

Round, almond, narrow, closed, mechanical/visor-like, glowing or partly obscured eyes are permitted when consistent with CURRENT motif/personality.

Large sparkling eyes are not the default for every Stage 1. Final forms may be calm, stern, noble, mysterious or fierce; a friendly smile is not mandatory.

Expression follows the CURRENT personality arc, not a mascot template.

Non-animal entities do not require an animal muzzle/ears/paws. A readable focal face/core/eye structure may be integrated into the canonical material/body plan instead.

## 5. Material and lighting

Use coherent soft upper/front key lighting across the roster while preserving material-specific response.

Examples of material distinction:
- leaf/bark: matte/organic;
- fur: soft;
- water: translucent/soft;
- chitin: satin/hard;
- stone: rough/mineral;
- metal: reflective/hard;
- flame/electric/light: emissive accents.

Avoid one glossy-plastic finish across all monsters. Rim light/glow is optional and never a mandatory finishing filter.

## 6. Outline and edge treatment

Prioritize a clean outer silhouette.

Do not apply a heavy universal black cartoon outline to every monster. Interior edges may be softer; darker local-color separation is allowed where needed for small-size readability.

Effects must not blur, hide or replace the defining silhouette.

Do not preserve a foreign fragment merely because removing it is difficult. If a fragment cannot be safely distinguished from legitimate thin anatomy/VFX, escalate to visual review rather than guessing.

## 7. Final per-ID background, canvas, crop and baked content contract

For **release/FORMAL per-ID art** the current contract is stricter than the early Phase 4 draft guidance:

- exact **512×512** canvas;
- RIFF/WEBP final binary;
- **true transparent background** with actual alpha;
- full intended creature visible;
- defining/signature features remain inside safe crop;
- no accidental edge crop/contact from normalization;
- no baked checkerboard;
- no white/colored rectangular background plate;
- no scenery, landscape, diorama, floor, frame, text, name, number, badge, UI or type label baked into the asset;
- no unrelated second character/companion;
- no unrelated detached artifact;
- no rectangular cut-and-paste/collage boundary.

Early Phase 4 notes that allowed clean white where required were production-stage flexibility, **not the final closeout contract**. The completed roster uses per-ID transparent WebP runtime art; future FORMAL replacements must preserve that unless an explicit new product decision changes the contract.

For newly generated/normalized output, prefer RGB `(0,0,0)` wherever alpha is 0 and verify the decoded final WebP. Hidden RGB is a hygiene requirement, not a substitute for actual visual QA.

Do not trust a preview or source canvas for dimensions/alpha. Decode the final exported WebP and verify the actual binary before registration.

## 8. Elemental VFX

Type must remain understandable from body/material/motif, not only aura color.

Stage guidance:
- Stage 1: none or one small localized effect when needed;
- Middle: developed effect may support the signature feature;
- Final: effect may be dramatic but face, body silhouette and family signature remain readable without it.

Do not make full-body aura, particle halo, floating shards, lightning, flames, leaves, bubbles or sparkles default decorations for an attribute.

VFX must not create a false second creature, rectangular plate, or detached fragment that reads as unrelated content.

## 9. Evolution continuity

Every multi-stage family must answer:
1. Which two or more identity signals survive from first to final stage?
2. Which signature feature visibly develops at the middle stage?
3. Which completed body/role silhouette makes the final stage stronger without relying on decoration count?

Fails:
- recolor-only evolution;
- VFX-only evolution;
- unrelated final form that loses family identity unless CURRENT explicitly requires the break.

## 10. Child-safe intensity

Target ages remain 5-8, but the roster must not become uniformly cute.

Dark/scary/cool designs may use posture, mass, negative space, restrained spikes, narrowed eyes, unusual material, asymmetry, shadow or controlled glow.

Do not use gore, realistic injury, exposed realistic anatomy, body horror or threatening realistic human facial treatment.

Ghost/dark/poison and other intense families may remain mysterious or cool rather than being forced into cheerful mascot faces.

## 11. Attribute anti-duplication rule

Each attribute owner W-303..W-320 must review **all families of that attribute side-by-side before generation** and maintain an anti-duplication matrix covering:
- motif;
- base anatomy/body plan;
- signature feature;
- dominant palette/color distribution;
- silhouette category;
- material language;
- posture/motion language;
- elemental VFX language;
- personality/expression;
- final-stage visual role.

Unrelated families of the same type must not be recolors, aura swaps or minor horn/wing/ear variants of one base design.

Post-closeout targeted maintenance should still compare the edited family with nearby same-type families when a redesign changes silhouette materially, to avoid accidentally collapsing differentiation.

## 12. Historical-reference disposition

For every family, resolve CURRENT first and record one of:

### KEEP
Existing CURRENT asset already satisfies identity, family continuity, silhouette distinction, originality, child readability, technical crop/background and small-size readability.

In post-closeout maintenance, KEEP means **do not create a replacement binary** merely to satisfy a heuristic.

### REFINE / NORMALIZE / REPAIR
Useful prior identity exists and controlled non-identity-breaking change is needed for silhouette separation, stage growth, face treatment, detail/VFX reduction, material clarification, crop, dimension/export correction, detached-fragment cleanup or originality distance.

Do not call a semantic reconstruction a repair.

### REGENERATE
Required when the CURRENT per-ID asset cannot be safely repaired without retaining a CURRENT conflict, duplicate template, broken family continuity, unreadable design, unsafe age treatment, existing-IP resemblance, inseparable scenery/background, collage structure, or wrong species identity.

Regeneration must still use compatible historical cues where useful. It is not permission to invent new lore or change CURRENT identity.

## 13. Representative calibration anchors

The approved global language was checked across distinct family directions:
- F001 / grass: broadening rooted defensive plant/tree mass;
- F002 / fire: child-beast lineage with localized flame tail/mane development;
- F003 / water: rounded/flowing contained depth and calm final presence;
- F008 / bug: segmented/chitin/aerial bee-stinger lineage with queen-level final presence.

These families may share rendering finish and light behavior. They must not share one base anatomy.

The final F080/m235 closeout adds a non-animal maintenance anchor:
- F080 / grass / `ユグドラシア`: world tree itself as one monsterized organism; no foreground companion, animal reinterpretation, scenery plate or collage.

## 14. FORMAL approval remains separate

A visual/style PASS does not promote an asset.

Historical W-303..W-320 production generated/reviewed candidate art. FORMAL promotion required separate explicit approval evidence.

As of the 2026-08-31 closeout all active `m001-m238` assets are FORMAL, but future **replacement binaries still require explicit approval and release handling**. Do not treat existing species FORMAL status as blanket approval for any new binary.

## 15. Attribute purity and type-readability gate

Attribute-first production means **one Work Item produces and reviews only the CURRENT species owned by that one attribute**.

For historical W-303..W-320:
- derive the exact species/family set from `PHASE-4-ATTRIBUTE-QUEUE.json`;
- do not include another attribute's generated candidates in the owning Work Item's production/review board;
- do not use unrelated cross-attribute candidates as if they were alternatives for the current Work Item;
- cross-attribute comparisons belong to W-321 or to a separately labelled reference-only panel and must never be counted as this attribute's candidate output.

Every candidate/replacement must pass **both** sides of the attribute-first goal:
1. **type readability** — at small game size, the primary visual read must still be the assigned CURRENT type;
2. **within-type differentiation** — unrelated families of that type must remain clearly different in anatomy, silhouette, material, motif, motion and role.

Diversity is not permission to drift into another type. When a CURRENT motif naturally overlaps another type, the assigned type must remain dominant through body/material/signature-feature treatment rather than through aura or color alone. Examples include fire+volcano reading as FIRE rather than ROCK, fire+bird reading as FIRE rather than FLYING, or fire+lamp reading as FIRE rather than LIGHT/ELECTRIC.

Before an attribute batch is accepted, review the complete owner scope side-by-side and confirm:
- every displayed production candidate belongs to the owner attribute;
- every species reads as the owner attribute without depending only on labels;
- no unrelated family pair collapses into the same template;
- family diversity does not weaken attribute identity.

If a candidate visually reads primarily as another type, mark that species/family `REGENERATE`; do not accept it merely because its metadata type is correct.

## 16. Visual QA and mechanical QA are independent gates

Final closeout established a permanent rule: **both must pass**.

Visual QA checks:

- canonical species identity;
- one intended creature;
- coherent silhouette;
- family continuity;
- no scenery/collage/foreign companion;
- no unrelated detached fragments;
- small-size readability.

Mechanical QA checks:

- actual final file is WEBP;
- exact 512×512;
- actual alpha/transparency;
- byte count and raw SHA-256;
- safe crop/edge behavior;
- package manifest consistency when a package is used.

A technically transparent collage is a FAIL. A visually good 1024×1024 image is also a FAIL for the current runtime contract.

## 17. Approved closeout exceptions

The global audit previously flagged `m042`, `m057`, `m136`, `m202`, `m213` for normalization heuristics, and they were explicitly accepted as approved exceptions before final FORMAL closeout.

Future heuristic scans may flag them again. Do not automatically alter those assets without a new actual visual defect or explicit design decision.

## 18. Related current operations

For post-closeout maintenance and release mechanics, use:

- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/MONSTER-ART-TIPS-AND-PITFALLS.md`
- `design/rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md`
- `design/rebuild/asset-production/W-302-OPERATOR-GUIDE.md`
