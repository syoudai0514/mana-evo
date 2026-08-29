# ManaEvo Learning × Game Economy V2 — Review Candidate

Status: **PROPOSAL / SECOND REVIEW REQUIRED / NOT CURRENT**  
Base: `main@118f3931819cded4da8bc0dc5622775dff20d535`  
Governance: `REBUILD-START-HERE.md` / D-023 Canonical Design Sync Gate

> Revised after the first independent review. The proposal is now **A+ — 5 semantic qualifying extra correct -> 1 ticket**. Continuous weighted Learning Value and a hard minimum-time reward gate are rejected. This document remains non-authoritative until second review passes.

See the companion second-review checklist in `design/rebuild/reviews/learning-game-economy-v2-review-checklist.md`.

## Proposed exact core rule

After daily core completion:

```text
recommended/current-fit correct = 1 qualifying correct
due SRS correct = 1 qualifying correct
genuine later recovery retrieval correct = 1 qualifying correct
mastered + non-due repeat = 0
immediate revealed-answer replay = 0
miss / わからない = 0
free / okawari = 0 for battle-ticket progress

5 qualifying extra correct -> battle ticket +1
```

No fractional progress, challenge multiplier, recovery multiplier, or hard time threshold.

## State and safety

Use a dedicated per-profile `extraQualifyingCorrectTotal` (or equivalent semantic state), never shared `additionalCorrectTotal`. Crossing each multiple of 5 must be exactly-once with stable semantic event/reward IDs across reload, cloud and profile boundaries.

Kids Quest remains the authority for recommended/current-fit state, mastery, adaptive difficulty and SRS due state. ManaEvo must not create a second learning engine.

## Educational distinctions

- mastered + due SRS remains full-value retrieval;
- mastered + non-due immediate/easy repeat gives no ticket progress but does not erase Kids Quest learning progress;
- miss itself gives no progress;
- support/explanation gives no progress;
- later genuine retrieval after support gives ordinary `1`, never a bonus >1;
- fast correct is not cheating and is not time-gated;
- displayed difficulty has no reward multiplier;
- intentional miss/demotion cannot produce bonus progress.

## Time policy

Learning time remains telemetry/product-health evidence only. Do not require a child to wait before submission. Monitor foreground time, rolling learning/game ratios and P10/P50/P90 segments; do not use elapsed wall-clock as a ticket condition.

## Ticket/game guardrails

Keep current 7-day TTL / FEFO and no hard daily battle cap. A soft learning-oriented nudge around 9 battles/day may be reviewed later as UX tuning, without confiscating tickets or blocking play.

## End-to-end economy invariants

Second review must also confirm:
- weak bench cannot reduce ordinary reference below active-only power;
- level-gap XP policy applies consistently to equivalent terminal paths including pre-KO capture;
- post-KO capture has no second Battle XP;
- old-area farming is materially worse XP/ticket;
- played loss/abandon consumes exact reservation;
- new low-level monster training remains viable.

Known runtime conformance issues from prior review must be fixed later if still present: free/okawari counter leakage, weak-bench active-floor drift, and pre-KO/terminal XP inconsistency.

## Second-review acceptance

Reviewer must try to falsify that recommended/current-fit retrieval, due SRS and genuine recovery are the shortest reliable ticket routes. It must also identify the exact stable Kids Quest/ManaEvo state/IDs needed for deterministic implementation and run 7-day/30-day adversarial comparisons.

If second review passes, create a **separate** D-023 canonical-promotion/product-change PR updating the owning `design/current/**` contracts + Decision Log and then runtime in synchronized form. Do not merge PR #115 as CURRENT authority by recency alone.

## Non-scope

No runtime, DB/save migration, level downgrade, Monster Art/registry, deployment, or Kids Quest authority change in PR #115.
