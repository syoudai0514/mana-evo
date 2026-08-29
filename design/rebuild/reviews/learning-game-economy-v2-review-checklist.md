# Learning × Game Economy V2 — Second Independent Review Checklist

Status: REVIEW INSTRUCTION / NOT CURRENT

Review target: `design/rebuild/reviews/learning-game-economy-v2-review-candidate.md`

This is a second review of the revised A+ model. Recover CURRENT under D-023, then try to falsify whether `5 semantic qualifying extra correct -> 1 ticket` makes legitimate recommended/current-fit retrieval, due SRS, and genuine recovery the shortest reliable reward route.

Required review focus:
- mastered non-due repeats must not earn ticket progress;
- due SRS correct must count fully;
- miss=0 and later genuine retrieval=1, with revealed-answer replay=0;
- no hard time gate or challenge/recovery multiplier;
- free/okawari must not leak into the extra counter;
- intentional demotion must not improve ticket efficiency;
- genuine fast mastery must remain valid;
- stable semantic IDs/state must exist for deterministic implementation;
- reload/profile/cloud must be idempotent;
- weak-bench, pre-KO capture XP, old-area XP and exact-ticket settlement must remain end-to-end consistent.

Attack A–S archetypes from the candidate and run 7-day/30-day comparisons for NORMAL, EASY FARMER, STRONG-SUBJECT FARMER, HIGH PERFORMER, STRUGGLING LEARNER, INTENTIONAL MISS OPTIMIZER, HEAVY LEGITIMATE LEARNER and OLD-AREA FARMER.

For every semantic rule, identify the exact Kids Quest/ManaEvo state or stable ID that supports it. A rule that cannot be made deterministic from stable state blocks promotion.

Classify findings P0/P1/P2/P3 and conclude exactly one:
- DESIGN PASS — PROMOTE A+ TO CURRENT
- DESIGN PASS WITH CHANGES — REVISE A+ THEN PROMOTE
- DESIGN FAIL — KEEP CURRENT

If PASS, return exact canonical wording/values and list CURRENT contracts + runtime drifts to change. Do not merge PR #115, modify CURRENT or implement runtime during this review.
