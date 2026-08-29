# ManaEvo Learning × Game Economy V2 — Review Candidate

Status: **PROPOSAL / SECOND REVIEW REQUIRED / NOT CURRENT**  
Base: `main@118f3931819cded4da8bc0dc5622775dff20d535`  
Governance: `REBUILD-START-HERE.md` / D-023 Canonical Design Sync Gate

> Revised after the first independent review. The proposal is now **A+ — 5 semantic qualifying extra correct -> 1 ticket**. Continuous weighted Learning Value and a hard minimum-time reward gate are rejected. This document remains non-authoritative until second review passes.

See `design/rebuild/reviews/learning-game-economy-v2-review-checklist.md` for the adversarial second-review contract.

## Proposed exact rule

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

## State / authority

Use a dedicated per-profile `extraQualifyingCorrectTotal` or equivalent semantic state, never a shared `additionalCorrectTotal`. Each multiple-of-5 milestone must settle exactly once through stable semantic event/reward IDs across rerender, reload, cloud and profile boundaries.

Kids Quest remains authoritative for recommended/current-fit state, mastery, adaptive difficulty and SRS. ManaEvo must not create a second learning engine.

## Semantic distinctions

- mastered + due SRS remains full qualifying;
- mastered + non-due easy repeat gives no ticket progress but does not erase learning progress;
- miss and support/explanation give no ticket progress;
- later genuine retrieval after support gives ordinary `1`, never >1;
- revealed-answer acknowledgement/immediate replay gives `0`;
- fast correct is not cheating and is not time-gated;
- raw displayed difficulty has no reward multiplier;
- intentional miss/demotion cannot create bonus progress.

## Time / batching

Learning time is telemetry only, not reward eligibility. Do not make waiting optimal. Monitor foreground time and rolling P10/P50/P90 learning/game ratios.

Keep 7-day TTL / FEFO and no hard daily battle cap. A soft nudge around 9 battles/day may be evaluated later as UX tuning only; do not confiscate tickets or block play.

## End-to-end game economy invariants

Second review must confirm:
- weak bench cannot reduce ordinary enemy reference below active-only power;
- level-gap XP applies consistently to equivalent terminal paths including pre-KO capture;
- post-KO capture has no second Battle XP;
- old-area farming is materially worse XP/ticket;
- played loss/abandon consumes exact reservation;
- new low-level monster training remains viable.

Known runtime conformance issues from prior review must be corrected later if still present: shared free/okawari ticket-counter leakage, weak-bench active-floor drift, and pre-KO/terminal XP inconsistency.

## Promotion gate

Second reviewer must try to falsify that recommended/current-fit retrieval, due SRS and genuine recovery are the shortest reliable ticket routes. For every semantic rule, the reviewer must identify exact stable Kids Quest/ManaEvo state/IDs and verify 7-day/30-day adversarial cases.

If second review passes, do **not** merge PR #115 as authority by recency. Create a separate D-023 canonical-promotion/product-change PR updating the owning `design/current/**` contracts + `design/rebuild/DECISION-LOG.md`, then synchronize runtime in that product-change PR.

## Non-scope

No runtime, DB/save migration, level downgrade, Monster Art/registry, deployment, or Kids Quest authority change in PR #115.
