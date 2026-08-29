# Learning × Game Economy V2 — Independent Review Checklist

Status: REVIEW INSTRUCTION / NOT CURRENT

Review target: `design/rebuild/reviews/learning-game-economy-v2-review-candidate.md`

Before judging the proposal, recover context in this order:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md` — especially D-005, D-006, D-020, D-022, D-023
3. `design/current/00-START-HERE.md`
4. `design/current/01-LEARNING-REWARDS.md`
5. `design/current/02-BATTLE-TICKETS-BALANCE.md`
6. `design/current/03-CAPTURE-DUPLICATES.md`
7. `design/current/05-WORLD-PROGRESSION.md`
8. `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
9. `design/current/canonical-sync-map.json`
10. actual CURRENT main learning/battle/capture/world runtime and tests

Do not treat the review candidate as authority merely because it is newer.

## Required attack questions

- Can a child obtain more tickets per real learning effort by choosing mastered/easy content?
- Can a child rotate to the easiest subject to beat recommended study?
- Can intentional misses lower adaptive difficulty and improve subsequent ticket efficiency?
- Can waiting/idle/background time satisfy any proposed study-time requirement?
- Does the proposal punish genuine fast mastery instead of advancing difficulty?
- Does it accidentally make SRS due review low-value?
- Does correct-only reward make struggling children avoid difficult material?
- Can random hard-question guessing become profitable because of challenge bonus?
- Can repeated same-skill questions beat interleaved/recommended study?
- Can free/okawari state leak into extra-ticket milestones?
- Can reload/replay/profile/cloud boundaries duplicate Learning Value or ticket milestones?
- Does 7-day ticket storage create a material game-only binge loophole, and if so is a hard cap actually better than a soft/telemetry response?
- Does battle XP/capture/weak-bench/old-area behavior overpower the learning economy?
- Does the model require data Kids Quest does not expose stably?
- Is a simpler model sufficient?

## Simulation matrix

Compare at least:

1. CURRENT: 5 extra correct -> 1 ticket
2. 5 extra correct + effective-time floor
3. Learning Value + effective-time guard

Run 7-day and 30-day estimates for normal learner, easy farmer, strong-subject farmer, high performer, struggling learner, intentional demoter, heavy learner, ticket hoarder, old-area farmer and capture optimizer.

Report:

- effective learning minutes
- ticket earned/spent
- game minutes
- learning/game ratio
- ticket efficiency per effective-learning-minute
- XP/day and level velocity
- subject/skill concentration
- mastered-repeat share
- challenge share
- recovery-after-error share
- exploitability

## Review output

Classify findings P0/P1/P2/P3.

Conclude with exactly one:

- DESIGN PASS — PROMOTE TO CURRENT
- DESIGN PASS WITH CHANGES — REVISE THEN PROMOTE
- DESIGN FAIL — KEEP CURRENT

If promotion is recommended, list the exact CURRENT contracts and Decision Log entries that must be changed under D-023. Do not implement runtime in the design-review PR.
