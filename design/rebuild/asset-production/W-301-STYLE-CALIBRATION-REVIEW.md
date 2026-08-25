# W-301 Phase 4 Monster Art Style Calibration Review

Status: **COMMANDER / USER REVIEW READY — NOT AN APPROVED STYLE LOCK**  
Work Item: `W-301`  
Branch: `rebuild/w-301-monster-art-style-calibration`  
Base: `rebuild/canonical-governance` @ `efde04d5edd8cef26d30f36512ab33f818745e24`

## 1. Scope and authority

W-301 calibrates the **global rendering language** for Phase 4 monster art. It does not approve individual monster assets, define gameplay, alter the monster master, or lock shared anatomy.

Authority used in this review:

1. `REBUILD-START-HERE.md`
2. `design/current/00-START-HERE.md`
3. `design/current/09-MONSTER-MASTER-ART-SPEC.md`
4. `design/current/monster-asset-manifest.json`
5. the three CURRENT description shards for `m001` through `m238`
6. `design/rebuild/asset-audit/W-213-MONSTER-ASSET-AUDIT.md`
7. `design/rebuild/asset-production/W-217-MONSTER-ART-PRODUCTION-QUEUE.json`
8. `design/rebuild/asset-production/W-217-OPERATOR-GUIDE.md`
9. `design/rebuild/asset-reference/0822/HISTORICAL-REFERENCE-INDEX.md`
10. the user-supplied `0822まとめ.zip` historical visual pack reviewed directly for this work item

CURRENT identity remains authoritative. Active scope is exactly `m001-m238` / 83 families. `m239` remains excluded. No historical name, number, type combination, or former 239-species board is used to override CURRENT.

Current asset state is unchanged:

- `FORMAL`: 0
- `CANDIDATE`: 20 (`m001-m020`)
- `PLACEHOLDER`: 218 (`m021-m238`)

This review does **not** promote any CANDIDATE to FORMAL.

## 2. 0822 historical reference usage

The supplied archive contains 34 substantive PNG review/design boards (plus archive metadata entries). The boards were reviewed as a historical visual-language library, not as a master-data source.

Representative boards used closely during calibration include:

- `BB4DF4AF-4910-4130-BD0A-FC7579299D22.PNG` — an early global monster-design direction board showing the useful "friendly first stage -> clearer middle identity -> imposing final" principle, but also a strong warning case for repeatedly using similar quadruped/fox/dragon anatomy across unrelated attributes.
- `618B3955-155A-4716-AD5F-73AE33761DE8.PNG` — a later additional-design board with stronger material differentiation, silhouette growth, and final-stage presence; it also shows the risk that dense ornament and elemental effects can overwhelm small-size readability.
- `A25FB138-A160-45A6-BC46-B61B2B7CE4C6.PNG` — a high-detail evolution board useful for studying mass/detail escalation and differentiated materials; some final forms demonstrate why W-301 must preserve family identity instead of treating "more humanoid / more ornate" as the universal definition of evolution.
- `D088A472-7A34-4CE4-A1D2-4C6B95DA298D.PNG`, `5D7CC00C-D43F-4C44-AEC7-C5874F5E48D6.PNG`, and `8B2BE5E7-4E0C-4B43-9BBF-95877F5173DE.PNG` — broad type-combination boards used mainly as negative-reference evidence for repeated ear/horn/wing/quadruped formulas and for type identity expressed too heavily through recolor or aura.
- the late-number proposal/review boards in the pack — useful for final-stage presence, lighting, material richness, and dramatic silhouette reference, but not trusted for CURRENT numbering or identity because the historical boards belong to the former 239-species planning context.

### Historical-direction disposition

**KEEP**

- clear three-stage visual escalation;
- readable full-body presentation;
- strong local-color identity;
- material differentiation between foliage, fur, chitin, stone, metal, water, flame, etc.;
- a final stage that has obvious presence without needing text.

**REFINE**

- reduce repeated quadruped / pointed-ear / horn / wing templates across unrelated families;
- reduce micro-detail that disappears at game size;
- make elemental VFX support the monster rather than replace its silhouette;
- avoid making every Stage 1 use the same large sparkling friendly-eye treatment;
- preserve a family-specific body plan instead of making every final stage converge toward the same dragon, armored beast, or humanoid form.

**REGENERATE WHEN REQUIRED**

- when no CURRENT per-ID asset exists;
- when a historical proposal conflicts with CURRENT motif/family/stage/type identity;
- when silhouette/template duplication is too strong;
- when the family cannot be read as one evolution line;
- when effects/detail make face, type impression, or signature feature unreadable at small size;
- when a design is too close to a specific existing-IP character.

## 3. Representative family calibration

W-301 intentionally compares four different attributes and four different body-direction problems. The goal is **not** to make these four families share anatomy. The goal is to make them look as though they belong to the same game while retaining distinct family silhouettes.

| Family | CURRENT identity anchor | Existing state | W-301 judgment | Direction to preserve / correct |
| --- | --- | --- | --- | --- |
| F001 `m001-m003` grass | leaves + young tree; fearful/hiding -> leaf weapon -> immovable forest wall | CANDIDATE | **REFINE** | Preserve leaf/young-tree identity and the shy-to-protector arc. Final mass must read broad, rooted, and defensive rather than as another agile leafy quadruped. Stage growth should come from body mass + tree/leaf feature growth, not just extra leaf particles. |
| F002 `m004-m006` fire | child beast + flame mane; fear shrinks flame -> controlled warmth -> calm protector with huge flame mane | CANDIDATE | **REFINE** | Preserve the child-beast lineage and flame-tail/mane continuity. Fire should be localized to the signature feature, not a generic full-body aura. `m006` must read as controlled, powerful protection rather than simply "angrier fire monster." |
| F003 `m007-m009` water | droplet + deep sea; cherished droplet -> self-made water -> a quiet/deep body containing the sea | CANDIDATE | **REFINE** | Preserve droplet/deep-water identity and the quiet personality. Do not turn the line into a blue recolor of the fire/beast language. Growth should read through contained volume, flow, and calm depth rather than a larger splash effect alone. |
| F008 `m022-m024` bug | stinger + queen bee; proud small stinger -> swarm-flight defender -> queen protecting the whole nest | PLACEHOLDER | **REGENERATE** (later owned art batch) | No CURRENT per-ID asset exists to keep. Historical insect/chitin/wing references are useful, but CURRENT bee/stinger/queen identity controls. Stage 1 stays small/simple, Stage 2 gains purposeful aerial/defender structure, and Stage 3 gains queen-level presence through body mass/posture and developed bee anatomy rather than accessory overload or a giant swarm effect. |

### Cross-family comparison result

The four representative families are intentionally prevented from collapsing into one base creature:

- **grass / F001** — grounded, broadening, defensive plant/tree mass;
- **fire / F002** — mobile child-beast lineage with a localized flame signature that expands into a mane;
- **water / F003** — rounded/flowing and increasingly deep/contained, with calm rather than aggression as the final read;
- **bug / F008** — segmented/chitin/aerial structure with stinger/bee identity and a queen-level final presence.

They may share rendering finish, light behavior, crop, and detail discipline. They must not share one ear, eye, horn, limb, wing, or torso template.

## 4. Proposed global rendering language

These are the W-301 **review proposals**. They become an approved style lock only after commander/user approval is recorded. Until that approval exists, `PHASE-4-STYLE-LOCK.md` must not be created or represented as approved.

### 4.1 Detail density

- Build the read from **large silhouette mass -> signature feature -> secondary detail** in that order.
- Stage 1 uses the fewest secondary detail clusters; friendliness comes from youth/clarity, not from adding identical "cute" features.
- Middle stages add one visibly developed family feature and enough detail to read as transitional.
- Final stages may be substantially richer, but ornament is subordinate to the completed silhouette and role.
- Micro-texture that disappears at small in-game size is optional and must never be required to identify the species.

### 4.2 Head / body proportion

- Stay within the CURRENT primary range of roughly 2-4 heads tall where the family anatomy permits.
- Do **not** define one stage-by-stage body template. A serpent, jellyfish, tree, bird, quadruped, machine, and humanoid-like monster must be free to solve proportion differently.
- Stage 1 should read younger/less developed through compact mass, relative head size, posture, or unfinished signature feature.
- Final-stage maturity should come from stronger body mass, stance, and completed signature feature; simply shrinking the head or adding armor is not a universal evolution rule.

### 4.3 Face and eye treatment

- Face remains readable at game size, but there is **no shared eye shape**.
- Round, almond, narrow, closed, visor-like/mechanical, glowing, or partially obscured eyes are allowed when the CURRENT motif/personality supports them.
- Large sparkling eyes are not the default for every Stage 1.
- Final forms may be stern, calm, mysterious, noble, or fierce; "friendly smile" is not required.
- Expression must follow `personalityArcContext`, not a house mascot face.

### 4.4 Material and light

- Use coherent soft upper/front key lighting so the roster belongs to one game, while allowing material-specific response.
- Preserve clear local color even when emissive effects are present.
- Material should differentiate the family: matte leaf/bark, soft fur, translucent/soft water, satin/hard chitin, rough stone, reflective metal, emissive flame, etc.
- Avoid one glossy-plastic surface treatment across the roster.
- Rim light and glow are accents, not mandatory finishing filters.

### 4.5 Outline and edge language

- Prioritize a clean, readable outer silhouette.
- Avoid a heavy universal black cartoon outline around every monster.
- Interior edges may be softer than the silhouette edge; selective darker local-color edges are allowed where small-size separation needs help.
- Effects must not blur or erase the signature silhouette.

### 4.6 Background / transparency

- Production art follows the CURRENT contract: transparent or clean white background; transparent is preferred for per-ID game candidates.
- No text, badge, number, UI, scenery, frame, or type label is baked into the monster image.
- Full body and signature features stay inside a game-safe crop.

### 4.7 Elemental VFX amount

- Type identity must remain understandable from **body/material/motif**, not only from aura color.
- Stage 1: none or one small localized effect when the CURRENT concept needs it.
- Middle: effect may develop with the signature feature but must stay secondary to anatomy.
- Final: effect can be dramatic, but face, body silhouette, and family signature remain readable if the effect were conceptually removed.
- Full-body aura, particle halo, floating shards, lightning, flames, leaves, bubbles, and sparkles are **not** default decorations to apply across a type.

### 4.8 Stage escalation

Every multi-stage family review must answer all three questions:

1. What two or more identity signals visibly survive from first to final stage?
2. What one signature feature visibly develops at the middle stage?
3. What completed body/role silhouette makes the final stage stronger without relying on decoration count?

A recolor-only evolution fails. A VFX-only evolution fails. A final form that no longer looks related to its earlier stages also fails unless CURRENT explicitly requires that break.

### 4.9 Dark / scary but child-safe

- Safe scariness may come from posture, mass, negative space, shadow, asymmetry, restrained spikes, narrowed eyes, unusual material, or controlled glow.
- Do not use gore, exposed realistic anatomy, realistic injury, body horror, or threatening humanlike facial realism.
- Dark/ghost/poison monsters do not need to be converted into cheerful mascot faces; mystery and coolness are allowed.
- Strong silhouettes should create the threat first; teeth, claws, and horror detail are secondary and age-appropriate.

## 5. Anti-template review rule for all 18 types

The global style lock is about **rendering**, not about making 18 type templates.

For every later attribute work item, compare all families of that attribute together and explicitly vary at least these axes where CURRENT permits:

- body plan / dominant mass;
- head/face language;
- signature feature location;
- color distribution, not only hue;
- material language;
- posture / motion language;
- elemental-effect language.

A type must not become "the same animal with the same horns/wings/ears plus a different color." The historical 0822 pack is useful precisely because it contains both successful variety examples and repeated-template warning examples.

## 6. KEEP / REFINE / REGENERATE decision rule for later art work

Use these labels only after resolving the CURRENT family first.

### KEEP

Use when the existing CURRENT candidate or compatible historical visual direction already satisfies family identity, stage continuity, silhouette distinction, child readability, originality, crop/background, and small-size readability without material redesign.

`KEEP` does not mean `FORMAL`; approval remains a separate gate.

### REFINE

Use when the existing direction contains useful family identity but needs controlled changes such as silhouette separation, stage growth, face treatment, detail reduction, VFX reduction, material clarification, crop, or originality distance.

Preserve the useful identity instead of restarting from zero.

### REGENERATE

Use when a CURRENT per-ID asset is missing or when the prior direction cannot be repaired without retaining a CURRENT conflict, duplicate template, broken family continuity, unreadable small-size design, unsafe age treatment, or existing-IP resemblance.

Regeneration must still use compatible 0822 historical visual cues where useful; it is not permission to invent new lore or change the CURRENT family.

## 7. Validation against W-301 acceptance

- [x] CURRENT monster-art authority and all active-scope guards were checked.
- [x] `m239` remains excluded.
- [x] Existing `m001-m020` remain CANDIDATE; no historical "formal" label was promoted.
- [x] The user-supplied 0822 archive was directly reviewed and used as visual continuity evidence.
- [x] F001 grass, F002 fire, F003 water, and F008 bug were calibrated as separate family/body directions.
- [x] Grass/fire/water/bug are explicitly prevented from becoming recolors of one base creature.
- [x] Family continuity and stage escalation rules preserve at least two identity signals and develop the signature feature.
- [x] The proposed rendering language is usable by all 18 types without assigning shared anatomy.
- [x] Detail density, proportion, face/eye range, material/light, edge language, background, VFX, stage escalation, and child-safe scary treatment are all covered.
- [x] No shared ear/horn/eye/wing/limb template is locked.
- [x] No runtime/gameplay/test/master/manifest/image file is changed.
- [x] No CANDIDATE is promoted to FORMAL.
- [x] No new monster lore, name, number, type, stage, or gameplay rule is introduced.

## 8. Approval gate

W-301 explicitly requires commander/user approval before the approved direction is recorded as `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`.

Therefore this branch intentionally contains the **review packet only**. It does not create `PHASE-4-STYLE-LOCK.md`, because doing so before explicit approval would violate the Work Item. Once this calibration is explicitly approved, the approved subset can be materialized into that style-lock file without changing monster identity or promoting any asset.
