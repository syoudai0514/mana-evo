# ManaEvo CURRENT — START HERE

Status: **CURRENT NORMATIVE ENTRY POINT**  
Date: 2026-09-05  
Origin: W-114 canonical normalization; navigation updated through D-031 Evolution Training & Route Progression

## 1. Purpose

This file is the single navigation entry point for implementing the approved ManaEvo CURRENT design set. Start here before reading individual CURRENT domain contracts.

This navigation role does **not** change the authority precedence in `REBUILD-START-HERE.md` or the decisions in `design/rebuild/DECISION-LOG.md`. In particular, an implementation, test, derived data master, historical review, or later unapproved document cannot override higher-authority evidence merely because it is newer or closer to runtime.

When sources conflict, follow `REBUILD-START-HERE.md` / `DECISION-LOG.md`; do not invent a missing rule. Unresolved product choices remain unresolved until approved.

D-031 is an explicit 2026-09-05 user decision. For evolved-form acquisition, evolution training, the ①→②→③ route-clear count, and zone/training XP progression, [`10-EVOLUTION-TRAINING-PROGRESSION.md`](./10-EVOLUTION-TRAINING-PROGRESSION.md) supersedes conflicting older text in W-102/W-104/W-105 while preserving their unrelated contracts.

## 2. CURRENT domain contracts

Read the contract that owns the behavior being changed.

| Work Item | CURRENT contract | Ownership |
|---|---|---|
| W-101 | [`01-LEARNING-REWARDS.md`](./01-LEARNING-REWARDS.md) | learning flow / rewards bridge |
| W-102 | [`02-BATTLE-TICKETS-BALANCE.md`](./02-BATTLE-TICKETS-BALANCE.md) | battle / tickets / XP / balance boundaries |
| W-103 | [`03-CAPTURE-DUPLICATES.md`](./03-CAPTURE-DUPLICATES.md) | capture / duplicate settlement / growth shards |
| W-104 | [`04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`](./04-EVOLUTION-ITEMS-SPECIAL-FORMS.md) | evolution / items / Giga / Burst |
| W-105 | [`05-WORLD-PROGRESSION.md`](./05-WORLD-PROGRESSION.md) | adventure / world / progression |
| W-106 | [`06-UI-SCREEN-CONTRACT.md`](./06-UI-SCREEN-CONTRACT.md) | screen / child-flow UI contract |
| W-107 | [`07-SAVE-PROFILES-PARENT-PWA.md`](./07-SAVE-PROFILES-PARENT-PWA.md) | save / profiles / parent / PWA boundaries |
| W-108 | [`08-ACCEPTANCE-TEST-CONTRACT.md`](./08-ACCEPTANCE-TEST-CONTRACT.md) | behavioral acceptance contract |
| W-109 | [`09-MONSTER-MASTER-ART-SPEC.md`](./09-MONSTER-MASTER-ART-SPEC.md) | monster identity / master / art contract |
| W-110 / D-031 | [`10-EVOLUTION-TRAINING-PROGRESSION.md`](./10-EVOLUTION-TRAINING-PROGRESSION.md) | evolved acquisition / self-evolution training / ①②③ route / growth XP progression |

A domain contract must not silently define behavior owned by another row. Cross-domain behavior follows the owning contract and the explicit dependencies recorded in these documents.

## 3. CURRENT machine-readable companions

The following files are CURRENT companions to the domain contracts and must be consumed with their owning contract rather than treated as free-standing specification sources.

### Monster asset state

- [`monster-asset-manifest.json`](./monster-asset-manifest.json) — W-109 asset-state inventory / resolution companion.

As of the 2026-08-31 final art closeout, the active roster is FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0 with `m239` excluded. **Do not treat this sentence as a substitute for reading the current manifest**; it records the closeout baseline only.

Operational/release documents for Monster Art:

- `../../docs/monster-production-status.md` — current operational status entry;
- `../../docs/MONSTER-ART-FINAL-HANDOFF-20260831.md` — final closeout handoff and recovery context;
- `../../docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md` — future FORMAL replacement procedure;
- `../../docs/MONSTER-ART-TIPS-AND-PITFALLS.md` — practical failure patterns;
- `../rebuild/asset-production/PHASE-4-STYLE-LOCK.md` — detailed art visual/technical lock;
- `../rebuild/asset-production/PHASE-4-GITHUB-BINARY-HANDOFF.md` — exact binary transport/handoff.

Those operational documents explain **how to maintain/release art**. They do not outrank the W-109 CURRENT identity/art contract or rebuild authority rules.

### Monster visual-description shards

Together these three files contain the active visual-description set for **exactly `m001` through `m238`**:

- [`monsters/descriptions-001-080.json`](./monsters/descriptions-001-080.json)
- [`monsters/descriptions-081-160.json`](./monsters/descriptions-081-160.json)
- [`monsters/descriptions-161-238.json`](./monsters/descriptions-161-238.json)

They use one lossless schema derived from the immutable FINAL-CORRECTED visual-brief provenance:

```text
no
speciesId
name
familyNo
stage
type
motif
familyConcept
personalityArc
personalityArcContext
description
graphicCore
expressionAndPose
silhouette
```

Active-scope guards:

- every `m001`〜`m238` appears exactly once;
- `m239` is not part of CURRENT active scope and remains baseline/reference only under D-003;
- `m236` CURRENT official name is **`ホシラディア`**;
- baseline-derived lore/description data must not be invented or paraphrased into new canonical facts;
- `m235` is F080 `ユグドラシア`, concept `世界樹`, stage 1 of 1; the world tree itself is the species identity unless a higher-authority approved decision changes it.

## 4. Evidence and source categories

These sources remain important, but they are **not alternative CURRENT navigation entry points**.

### Authority / governance

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md`

These define precedence and approved rebuild decisions and must be obeyed before implementation.

### User-decision evidence

- `design/rebuild/USER-DECISION-EVIDENCE.md`

This is a provenance/evidence ledger for recovered explicit user decisions. It supports the CURRENT contracts; it is not a separate domain contract to implement independently.

### Immutable FINAL-CORRECTED baseline

- `design/baseline/FINAL-CORRECTED/source/`

The baseline is immutable source/provenance evidence with the authority defined by `REBUILD-START-HERE.md`. Do not modify it. It is not the day-to-day CURRENT navigation entry because approved later decisions may intentionally differ from it; such differences require explicit evidence.

### Derived data masters and later design material

Files such as `design/13*.csv`, later implementation-oriented design documents, generated masters, and manifests outside the CURRENT set are derived/supporting inputs. They cannot override an owning CURRENT contract or higher-authority evidence. A conflicting derived value is drift until supported by an approved change.

### Audits / reviews / history

`design/rebuild/audit/`, review documents, PR history, and historical implementation notes explain how conclusions were reached. They are evidence/history, not parallel product specifications.

### Runtime / tests

`src/**` and `tests/**` are implementation evidence and regression machinery. They do not become specification authority merely because current behavior or an existing assertion differs from CURRENT.

## 5. Implementation rule

For any change:

1. start with this file;
2. identify the owning CURRENT domain contract;
3. apply `REBUILD-START-HERE.md` / `DECISION-LOG.md` precedence to supporting evidence;
4. use the machine-readable companion only within its documented ownership;
5. preserve unresolved decisions as unresolved rather than guessing;
6. update runtime/tests only in a Work Item that explicitly owns them.

For Monster Art maintenance specifically:

1. read W-109 and fresh CURRENT metadata/manifest;
2. record current per-ID state/SHA before looking for a convenient old reference;
3. follow the maintenance runbook through separate `VISUAL QA → ART READY → REGISTERED/REPLACED → FORMAL → MAIN → DEPLOYED → LIVE VERIFIED` gates;
4. never use an old ZIP/chat SHA as CURRENT without refetching;
5. never report a generated image, merged PR or successful deploy as the same completion state.

W-114 performed canonical normalization only; later navigation updates may add explicitly approved decisions such as D-031 but do not create independent product rules without approval.
