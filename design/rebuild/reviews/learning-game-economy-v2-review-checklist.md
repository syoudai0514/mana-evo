# Learning × Game Economy V2 — Second Independent Review Checklist

Status: REVIEW INSTRUCTION / NOT CURRENT

Review target: `design/rebuild/reviews/learning-game-economy-v2-review-candidate.md`

Recover D-023 CURRENT first, then attack the revised A+ proposal. Do not treat it as authority by recency.

## Core claim to falsify

`5 semantic qualifying EXTRA correct -> 1 ticket`, where:
- recommended/current-fit correct = 1;
- due SRS correct = 1;
- genuine later recovery retrieval correct = 1;
- mastered non-due repeat = 0;
- immediate revealed-answer replay = 0;
- miss = 0;
- free/okawari = 0 for ticket progress;
- no hard time gate;
- no challenge/recovery multiplier.

## Required attacks

Check whether mastered/easy content can still be classified as current-fit often enough to farm; intentional misses can reset mastery/difficulty; recovery can be faked by tiny variants after answer reveal; SRS due state can be manipulated by date/reload/profile changes; same-skill practice can stay qualifying before mastery persistence catches up; free/okawari can mutate state and leak into extra; stable semantic IDs really exist; reload/cloud/profile can duplicate milestones; high performers remain valid without time gating; struggling learners can recover without economic penalty.

Also verify end-to-end battle economy: weak-bench active floor, pre-KO capture XP modifier consistency, post-KO no-double-XP, old-area XP/ticket, exact ticket settlement, and new-monster training.

## Required state audit

For every semantic decision identify the exact stable source for:
- task/mode identity;
- skill/unit/knowledge identity;
- mastery state;
- SRS due state/date;
- first-attempt correctness;
- reveal/explanation state;
- retry/reinforcement identity;
- stable completion/reward event ID;
- per-profile persistence;
- cloud/reload idempotency.

Missing deterministic state blocks promotion.

## Simulation

Run 7-day and 30-day comparisons for NORMAL, EASY FARMER, STRONG-SUBJECT FARMER, HIGH PERFORMER, STRUGGLING LEARNER, INTENTIONAL MISS OPTIMIZER, HEAVY LEGITIMATE LEARNER and OLD-AREA FARMER.

Report total questions, qualifying correct, learning time as telemetry, tickets, battles, game time, rolling learning/game ratio, XP/level path, mastered non-due share, due-SRS share, recovery share and exploitability.

Do not fail merely because a genuinely high-performing child is faster. Fail if a lower-value strategy beats legitimate learning because of reward mechanics.

## Final output

Classify P0/P1/P2/P3. Answer whether A+ is safer than weighted LV; whether threshold 5 is sound; whether semantic qualification is implementable without a second learning engine; whether SRS/recovery/demotion are robust; whether hard subject diversity/time/battle caps are unnecessary; exact stable state required; CURRENT contracts to update; runtime drifts to fix.

Conclude exactly one:
- DESIGN PASS — PROMOTE A+ TO CURRENT
- DESIGN PASS WITH CHANGES — REVISE A+ THEN PROMOTE
- DESIGN FAIL — KEEP CURRENT

If PASS, return exact canonical wording/values. Do not merge PR #115, modify CURRENT, or implement runtime during review.
