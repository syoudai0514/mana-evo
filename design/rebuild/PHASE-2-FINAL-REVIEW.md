# ManaEvo Rebuild — Phase 2 Commander Final Review

Date: 2026-08-25
Status: **ACCEPTED WITH CROSS-CANONICAL NORMALIZATION**

## 1. Integrated Phase 2 work

W-101 through W-113 were reviewed and merged into `rebuild/canonical-governance` through PRs #40-#52. No Phase 2 worker PR was merged to `main`.

The domain outputs now exist under `design/current/` for learning/rewards, battle/tickets/balance, capture/duplicates, evolution/items/special forms, world/progression, UI/navigation, save/profiles/Parent/PWA, acceptance/tests, monster master/art, asset manifest, and three monster-description shards.

## 2. Accepted product decisions

Phase 2 preserves the existing commander decisions and evidence precedence. Key accepted CURRENT rules include:

- active monster scope No.001-238 / 83 families; No.239 reference only
- Kids Quest learning remains the learning source of truth
- daily core completion gate before new battles
- extra learning ticket +1 per cleared extra question, unlimited
- later-approved ring economy
- seven-day FEFO tickets with battle reserve/refund/commit lifecycle
- in-battle capture at enemy HP <= 50%, max 3 throws, current ring multipliers and 4-star temporal presentation
- duplicate catch choice and growth shards
- exploration-point evolution-item acquisition with per-area pity and sixth-run choice
- self-evolution-first evolved-form discovery/world unlock
- boss gate = per-area 12 learning progress points + 2 unique skills
- boss normal-rematch growth advantage and balanceVersion replacement/re-lock
- Giga 12 / Burst 8; Star Awakening excluded
- one dominant child decision per normal screen and 390px iPhone first-viewport contract
- GitHub Pages `/mana-evo/` as official hosting authority
- manifest-driven MonsterArt resolution; file existence alone is not FORMAL approval

## 3. Cross-document findings requiring normalization

These do not reopen product design and do not block unrelated implementation domains.

### N-001 — Level cap wording

`design/current/02-BATTLE-TICKETS-BALANCE.md` correctly records the final product level cap as a non-blocking BLOCKED DECISION; current runtime Lv100 is compatibility behavior only.

`design/current/08-ACCEPTANCE-TEST-CONTRACT.md` currently says `Level is capped at 100` as canonical acceptance. This is too strong and must be normalized so tests do not freeze Lv100 as a product invariant until separately decided.

### N-002 — Monster-description shard schema

The three description shards contain the intended baseline information but use inconsistent field names/shapes:

- W-110: `familyConcept` + stage-specific `personalityArcContext`
- W-111/W-112: `concept` + full-family `personalityArc`

Normalize all three to one lossless schema:

```text
no
speciesId
name
familyNo
stage
type
motif
familyConcept
personalityArc          # full baseline family arc object
personalityArcContext   # stage-relevant string
description
graphicCore
expressionAndPose
silhouette
```

No lore may be invented; derive both arc fields from exact baseline `families.mjs` / visual briefs.

### N-003 — No.236 name drift

Exact baseline `families.mjs` names F081 / m236 **ホシラディア**. The later review CSV `design/13d-monster-growth-area4-part2.csv` names the same stable ID **ソラリオン**. No explicit later approval for that rename is recorded.

CURRENT identity therefore remains **m236 / ホシラディア** unless explicit approval evidence is later recovered. Treat the later CSV/runtime occurrence of `ソラリオン` as data drift to repair during implementation/master reconciliation.

W-109 wording that broadly implies zero identity mismatches must be narrowed so it cannot hide this known later-data drift.

### N-004 — Capture-success Battle XP evidence backfill

Prior user decision evidence supports capture success granting the same Battle XP as defeat/victory. W-103 records the rule. Backfill the user-decision evidence ledger with the recovered decision reference so the rule is not justified only by a later review document.

Do not invent a reward for the newly caught instance from the same battle; preserve the canonical recipient rule in W-103.

## 4. Non-blocking unresolved details

The following do not block Phase 3 implementation. Existing compatible behavior may remain as implementation/tuning default where required, but tests must not promote it to immutable product truth:

- final product level cap
- exact battle-derived Mana formula
- exact non-rainbow base capture formula constants
- failed-capture enemy-turn/detail resolution where not explicitly approved
- exact EX unlock/internal representation
- exact grade-reward species assignment
- exact per-species evolved-form relocation map
- held evolution-item consume/retain detail when baseline is silent
- boss regional item bonus selection presentation

Where exact baseline does resolve a detail, use baseline rather than retaining a false BLOCKED status.

## 5. Phase 2 completion gate

Phase 2 domain canonicals are accepted for implementation, subject to W-114 normalization above. Unrelated implementation work may start immediately; it does not need to wait for W-114.

W-114 must complete before `design/current/00-START-HERE.md` is declared fully normalized and before final release acceptance is frozen.

Phase 3 implementation work is defined in `design/rebuild/PHASE-3-WORK-ITEMS.md`.
