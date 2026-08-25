# ManaEvo Rebuild — Commander Handoff

Status: **MANDATORY COMMANDER CONTEXT**  
Date: 2026-08-26

This document exists so that a new commander/reviewer cannot operate from only the latest chat or the latest Work Item. It records the purpose of the rebuild, the canonical reasoning model, the phase history, the current position, and the commander-specific failure modes that must not recur.

## 1. Why the rebuild exists

ManaEvo was not restarted because one isolated bug needed fixing. The rebuild exists because several different kinds of evidence had become mixed together:

- the immutable `mana-evo-terra-FINAL-CORRECTED` baseline;
- later user-approved changes;
- implementation drift that happened without an approved product decision;
- old design/review material;
- current runtime behavior;
- old tests and CI expectations.

The rebuild goal is therefore **not**:

- a full rewrite from scratch;
- a mechanical rollback to FINAL-CORRECTED;
- preserving current runtime merely because it works;
- making old tests pass by restoring stale behavior.

The rebuild goal is:

> organize the history from FINAL-CORRECTED to the present, keep only intentional/approved changes, restore one coherent ManaEvo learning-RPG, align runtime/UI/tests to that CURRENT design, and complete the remaining approved monster-art stream.

This is the governing context for every later phase including Monster Art.

## 2. Authority and reasoning model

The rebuild authority order is defined by `REBUILD-START-HERE.md` and must not be reinterpreted locally:

1. explicit user decisions;
2. immutable FINAL-CORRECTED baseline;
3. later approved changes with recoverable rationale/evidence;
4. `design/current/` CURRENT canonical;
5. derived data masters;
6. current implementation;
7. old reviews/completion reports.

Important consequences:

- Runtime is evidence, not specification authority.
- CI PASS is not proof that product behavior is correct.
- File existence is not proof that monster art is FORMAL.
- A newer document does not automatically outrank an older approved source.
- Unknown product rules must remain unresolved rather than being invented by a worker or commander.

## 3. Mandatory classification of user statements

A critical commander responsibility is to distinguish **what the user said** from **what the user decided**.

Every new user statement that may affect scope/spec/plan must first be classified as one of:

1. **Question / confirmation request** — asking whether something is already decided or how the current plan works.
2. **Concern / risk observation** — pointing out a possible gap such as quality drift, inconsistency, or unclear operation.
3. **Suggestion / candidate idea** — proposing a possible approach without explicitly replacing the existing plan.
4. **Explicit product/process decision** — clearly instructing that the approved plan/spec/process must change.

Rules:

- Do **not** convert categories 1-3 into a new requirement merely because they came from the user.
- First compare the statement against existing CURRENT, DECISION-LOG, phase plans, and prior approved decisions.
- Reply with commander judgment: already covered / explanation gap / real plan gap / needs explicit new decision.
- Only category 4, or a later explicit approval after commander analysis, should override an existing approved plan.

This rule is necessary to prevent a new commander from making the project unstable by overreacting to normal user questions.

## 4. Rebuild history and why each stage exists

### Phase 1 / baseline rescue and audit

The immutable FINAL-CORRECTED source was rescued into GitHub and treated as provenance, not as a writable implementation target. Domain audits then compared baseline, later decisions, current design, runtime, and tests.

The purpose was to separate:

- intentional approved changes;
- accidental/unsupported drift;
- unresolved decisions.

Key governance and product decisions were recorded in `design/rebuild/DECISION-LOG.md`.

### W-101 through W-114 / CURRENT canonical construction

W-101..W-109 created domain contracts for:

- learning/rewards;
- battle/tickets/balance;
- capture/duplicates;
- evolution/items/special forms;
- world/progression;
- UI/navigation;
- save/profiles/Parent/PWA;
- behavioral acceptance/tests;
- monster master/art.

W-110..W-112 restored the active monster visual-description shards for m001-m238. W-113 normalized the design-document authority/history map. W-114 made `design/current/00-START-HERE.md` the single CURRENT implementation entry point without creating new product rules.

The purpose of this stage was to make it possible for later implementation workers to implement from CURRENT instead of re-litigating historical material.

### Phase 3 / runtime, UI, E2E, release hardening

Phase 3 aligned the real runtime to CURRENT instead of changing CURRENT to fit legacy runtime/tests.

The work converged the authentic learning source, ticket/battle/capture/evolution/world domains, shared runtime, active UI routes, iPhone child-flow UX, E2E behavior, PWA/release paths, and dead-path cleanup.

By the final engineering wave, the canonical vertical slice was reachable:

`Home -> Study -> Adventure -> Battle/Capture -> Monster/Evolution`

Remaining engineering work was release hardening, not product-rule redesign. Monster Art remained a separate asset-completion stream.

## 5. Stable ManaEvo product concept the rebuild protects

The rebuild is not only a technical cleanup. It protects the product loop:

`learn -> receive game reward -> adventure -> battle/capture -> grow -> evolve -> unlock more world`

Important already-approved characteristics include:

- Kids Quest remains the authentic learning source of truth;
- learning precedes the game loop rather than being cosmetic;
- self-growth and self-evolution matter more than simply catching already-strong evolved monsters;
- child-facing screens prioritize one dominant decision instead of information-dense dashboards;
- active monster scope is exactly m001-m238 / 83 families; m239 is reference-only;
- monster identity, family continuity, progression, and art must support the same game rather than becoming a disconnected image catalog.

Do not casually reopen these concepts because a later runtime, asset, or local worker implementation differs.

## 6. Phase 4 exists to finish approved Monster Art, not redesign ManaEvo

Phase 4 starts after the engineering rebuild is effectively complete. Its job is the formal Monster Art stream.

It does **not** mean generating 238 unrelated new creatures from scratch.

The intended policy is:

- preserve CURRENT identity and descriptions first;
- preserve useful CURRENT/historical visual identity where compatible;
- classify prior work as KEEP / REFINE / REGENERATE;
- regenerate only where CURRENT, originality, family continuity, type diversity, child readability, crop/background/technical requirements, or quality require it;
- keep all output CANDIDATE until explicit approval; FORMAL promotion is separate and gated.

### W-301

W-301 creates the global visual constitution / STYLE-LOCK. It defines rendering language, detail density, proportion range, material/light treatment, edge treatment, VFX amount, stage escalation, and child-safe intensity without imposing one shared anatomy/template.

### W-302

W-302 creates the production infrastructure: historical reference indexing, attribute-first queue, candidate ingestion, provenance/checksum/history preservation, review ledger, and explicit FORMAL promotion guardrails.

This means later attribute workers must **use** the established file/path/ingestion/promotion model instead of redesigning it.

### W-303 through W-320

The production model is **attribute-first**: one CURRENT type = one owning Work Item / art-direction owner.

Reason: if the same type is split among independent workers, they can converge on the same aura, palette, horn/ear/wing/body formula without seeing one another. One owner must see all families of that type together and build an anti-duplication matrix.

Families must never be split. Generation/review is family-based, not disconnected stage-by-stage work.

### W-321 and W-322

W-321 performs cross-attribute QA across all 238. Failures return to the owning attribute batch.

W-322 performs explicit FORMAL approval / manifest / release only after approval evidence exists. File existence or CANDIDATE state must never be treated as approval.

## 7. Current Phase 4 position and the W-303 lesson

At the current handoff point:

- W-301 style calibration/STYLE-LOCK exists;
- W-302 ingestion/queue/reference infrastructure exists;
- W-303 grass attribute has completed substantial pre-generation design work including attribute anti-duplication analysis and generation packets;
- W-303 did **not** actually produce the required new visual images in its execution environment and explicitly stopped at a user visual-review gate rather than pretending generation happened.

The commander must understand the difference between:

- **art-direction/design preparation complete**; and
- **actual image generation/review complete**.

A worker document, prompt packet, board, ledger, or plan is not a substitute for seeing the generated images when the Work Item requires visual production.

Do not advance to the next attribute merely because the design paperwork is complete if the production/review gate of the current attribute has not actually been satisfied.

## 8. Quality-drift concern: how to reason about it

When the user asks whether repeated image-generation batches will drift in quality, do not immediately replace the Phase 4 plan.

First identify the controls already designed into the plan:

- W-301 global STYLE-LOCK;
- one attribute = one owner;
- pre-generation anti-duplication matrix;
- family-based generation and stage continuity;
- historical/current reference review before replacement;
- per-species review ledger and KEEP / REFINE / REGENERATE disposition;
- W-321 all-238 cross-attribute QA.

Then evaluate whether the implementation of those controls is sufficient in practice. If actual generation reveals a gap, strengthen the process minimally and explicitly rather than discarding the approved attribute-first architecture.

A useful additional production safeguard may be to retain approved visual examples as stable visual anchors for later batches, but that is an implementation/control enhancement to evaluate against the existing plan — not grounds to silently rewrite Phase 4.

## 9. Existing Monster Art pipeline is already decided

Later commanders/workers must not repeatedly reopen these mechanics unless a real defect is found:

- active IDs: m001-m238 only; m239 rejected from active production;
- per-species filename: `mNNN.webp`;
- final repository target: `public/monsters/mNNN.webp`;
- repository asset must be WebP below 1 MB;
- candidate ingestion preserves provenance/history/checksum;
- CANDIDATE does not become FORMAL automatically;
- normal runtime uses approved FORMAL asset state, not mere file existence;
- FORMAL requires explicit approval evidence and manifest/runtime generation update.

If the user asks "is this already decided?", answer from this existing pipeline. Do not turn the question into a new design task.

## 10. Commander restart protocol

Before making or changing a plan, a new commander must read in this order:

1. `REBUILD-START-HERE.md`
2. this file: `design/rebuild/COMMANDER-HANDOFF.md`
3. `design/rebuild/DECISION-LOG.md`
4. `design/current/00-START-HERE.md`
5. the active phase plan(s)
6. the current Work Item output/handoff
7. only then the latest chat/request

After reading, the commander must be able to state:

- why the rebuild exists;
- what source outranks what;
- whether the latest user statement is a question/concern/suggestion/decision;
- what phase and gate the project is actually in;
- what is already decided and must not be redesigned;
- what remains genuinely incomplete;
- whether the next proposed action advances the approved plan rather than merely responding to the most recent message.

If these cannot be answered, stop planning and recover context before issuing a worker instruction.

## 11. Failure mode that this document prevents

A prior commander handoff allowed the next commander to become too local to the latest conversation. That produced reasoning such as treating a confirmation question about file placement/runtime reflection as something W-304 should newly decide, and discussing the next attribute before fully reconciling the current W-303 production gate.

The correction is not to give every new user message priority over the plan. The correction is to restore the rebuild governance model:

**understand the whole rebuild -> classify the new statement -> compare it with approved decisions -> give commander judgment -> change the plan only when a real gap or explicit approved change exists.**

This sequence is mandatory for future commander handoffs.

## 12. Handoff invariant

A commander change must never mean a project-memory reset.

The next commander inherits:

- the rebuild purpose;
- evidence precedence;
- approved product concept;
- CURRENT canonical set;
- completed phase decisions;
- active phase architecture;
- unresolved decisions;
- current production/review gate;
- known failure modes.

A new commander may improve execution, but must not recreate the project plan from the latest chat fragment.