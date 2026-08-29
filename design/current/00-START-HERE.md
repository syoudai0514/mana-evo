# ManaEvo CURRENT — START HERE

Status: **CURRENT NORMATIVE ENTRY POINT**  
Updated: 2026-08-29

## 1. Purpose

This is the single navigation entry point for the approved ManaEvo CURRENT product contracts.

Before using it, apply the authority and synchronization rules in:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. this file

Runtime, tests, generated data, PR descriptions and historical reviews are evidence; they do not silently override an owning CURRENT contract.

## 2. CURRENT domain contracts

| CURRENT contract | Ownership |
|---|---|
| [`01-LEARNING-REWARDS.md`](./01-LEARNING-REWARDS.md) | Kids Quest boundary / learning → game rewards / ticket earning |
| [`02-BATTLE-TICKETS-BALANCE.md`](./02-BATTLE-TICKETS-BALANCE.md) | battle start / ticket settlement / damage / enemy scaling / Battle XP |
| [`03-CAPTURE-DUPLICATES.md`](./03-CAPTURE-DUPLICATES.md) | capture eligibility / capture result / duplicate settlement / capture presentation contract |
| [`04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`](./04-EVOLUTION-ITEMS-SPECIAL-FORMS.md) | evolution methods / items / Giga / Burst |
| [`05-WORLD-PROGRESSION.md`](./05-WORLD-PROGRESSION.md) | world / area / zone / boss progression / encounter level bands |
| [`06-UI-SCREEN-CONTRACT.md`](./06-UI-SCREEN-CONTRACT.md) | child-facing screens / navigation / focused-flow UI |
| [`07-SAVE-PROFILES-PARENT-PWA.md`](./07-SAVE-PROFILES-PARENT-PWA.md) | save / profiles / Parent / cloud / PWA / hosting boundaries |
| [`08-ACCEPTANCE-TEST-CONTRACT.md`](./08-ACCEPTANCE-TEST-CONTRACT.md) | behavioral acceptance / regression contract |
| [`08-EVOLUTION-PACING.md`](./08-EVOLUTION-PACING.md) | production evolution-XP pacing tuning contract |
| [`09-MONSTER-MASTER-ART-SPEC.md`](./09-MONSTER-MASTER-ART-SPEC.md) | monster identity / visual provenance / candidate vs FORMAL / runtime art eligibility |

A domain contract must not redefine another domain silently. Cross-domain behavior follows every owning contract plus the relevant Decision Log entries.

## 3. Machine-readable companions

These are companions to the contracts above, not independent product authorities.

- [`monster-asset-manifest.json`](./monster-asset-manifest.json) — W-109 approval-state / initial-inventory companion used by FORMAL promotion guards. **Candidate ingestion intentionally does not make this a live count of every later candidate binary.**
- `design/rebuild/asset-production/candidate-provenance/` + actual `public/monsters/mNNN.webp` + Work Item evidence — later candidate-revision evidence where present.
- `src/game/playtestCandidateArt.js` — current main's explicit D-016 production-visible candidate allowlist; production visibility is not FORMAL approval.
- [`monsters/descriptions-001-080.json`](./monsters/descriptions-001-080.json)
- [`monsters/descriptions-081-160.json`](./monsters/descriptions-081-160.json)
- [`monsters/descriptions-161-238.json`](./monsters/descriptions-161-238.json)
- [`canonical-sync-map.json`](./canonical-sync-map.json) — CI ownership metadata only; it does **not** define gameplay.

Active monster scope remains exactly `m001`–`m238` / 83 families. `m239` remains baseline/reference only under D-003.

## 4. Production authority / deployment

D-019 is current:

- GitHub = source / PR / CI
- Vercel = **only production canonical host** + PR Preview
- Supabase = Auth / DB / Cloud Save
- production canonical = `https://mana-evo.vercel.app/`
- production base/scope = `/`

Older documents that call GitHub Pages `/mana-evo/` the production canonical are historical and must not be used to revert hosting.

## 5. Important post-W-114 decisions that CURRENT must reflect

The CURRENT set is not frozen at its 2026-08-25 creation date. Later explicit decisions must be incorporated into the owning contract.

At minimum, current readers must account for:

- **D-016** — validated CANDIDATE monster art may be progressively visible in production without becoming FORMAL.
- **D-017** — child-facing capture items are ほし/ぎん/きん/にじ **ボール**; stable domain keys remain `star/silver/gold/rainbow`.
- **D-018** — family account + profile-separated cloud save / backup / TEST isolation.
- **D-019** — Vercel production canonical.
- **D-020** — Evolution pacing V5.
- **D-021** — cloud conflict resolution is adult-owned and must not interrupt normal child gameplay.
- **D-022** — Battle V6 study-first pacing / played-ticket cost / fair-fight intent / level-gap XP / post-KO capture / slower world bands.
- **D-023** — canonical design sync gate; product behavior and owning CURRENT update are one change set.

An open design proposal is not CURRENT merely because it is newer. In particular, a design-only PR remains proposal until explicitly approved and promoted through Decision Log + owning CURRENT contracts.

## 6. Canonical synchronization rule

Product behavior and CURRENT are one change set.

When a PR touches protected runtime/art paths, CI uses `canonical-sync-map.json` and requires the PR body to declare:

```text
Canonical-Impact: changed | none
Canonical-Domains: <domain,...>
Canonical-Reason: <reason>
```

If `changed`:

- update the owning CURRENT contract(s) in the same PR;
- update `design/rebuild/DECISION-LOG.md` in the same PR;
- update runtime/tests/derived data as required.

If `none`:

- give a concrete reason;
- Reviewer must verify this is truly implementation-only.

The CI guard exists so that "we will update the design later" cannot become the normal path again.

## 7. Evidence categories

### Governance / decision authority

- `REBUILD-START-HERE.md`
- `design/rebuild/DECISION-LOG.md`
- `design/rebuild/USER-DECISION-EVIDENCE.md`

### Immutable baseline

- `design/baseline/FINAL-CORRECTED/source/`

Do not modify it.

### Runtime / tests

- `src/**`
- `tests/**`
- `e2e/**`

These prove implementation behavior, not approval by themselves.

### History

- `design/rebuild/WORK-QUEUE.md`
- old Phase plans
- audit/review documents
- old PR completion reports

These explain history and must not be used as a competing CURRENT entry point.

## 8. Implementation procedure

For every product change:

1. start at `REBUILD-START-HERE.md`;
2. identify the owning CURRENT contract here;
3. check Decision Log / explicit user evidence;
4. classify the new request as question, concern, proposal or explicit change;
5. if behavior changes, update CURRENT + Decision Log **before/with** implementation;
6. implement runtime/tests;
7. verify tangible Acceptance evidence;
8. only then merge/deploy.

Never recover current product behavior from "the newest document" alone. Recover it from authority + approval + CURRENT + actual GitHub state.

## 9. Current commander assignment

- 2026-08-29: the user explicitly reassigned ManaEvo commander / Reviewer responsibility away from the previous commander chat to a successor commander.
- The previous commander chat is no longer an active planning authority; its outputs are historical evidence only.
- The successor commander must recover state through `REBUILD-START-HERE.md` / D-015 before issuing new plans, and must determine current progress from GitHub + actual Acceptance evidence rather than inheriting the former commander's latest conclusion.
- This assignment change does not modify gameplay, Monster Art rules, runtime behavior, or any existing product-domain decision.
