# Learning × Game Economy V2 — Second Independent Review Checklist

Status: REVIEW INSTRUCTION / NOT CURRENT

Review target: `design/rebuild/reviews/learning-game-economy-v2-review-candidate.md`

This is a **second review**. The first review rejected continuous weighted Learning Value and a 20-second hard reward gate, and recommended A+: `5 semantic qualifying extra correct -> ticket +1`.

Before judging the revised proposal, recover context in this order:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md` — especially D-005, D-006, D-020, D-022, D-023
3. `design/current/00-START-HERE.md`
4. `design/current/01-LEARNING-REWARDS.md`
5. `design/current/02-BATTLE-TICKETS-BALANCE.md`
6. `design/current/03-CAPTURE-DUPLICATES.md`
7. `design/current/05-WORLD-PROGRESSION.md`
8. `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
9. `design/current/canonical-sync-map.json`
10. current Kids Quest learning runtime/state and ManaEvo reward/battle runtime as implementation evidence

Do not treat this proposal as authority because it is newer.

## Core claim to falsify

The revised design claims that the shortest reliable ticket route is legitimate semantic learning:

- recommended/current-fit correct = 1;
- due SRS correct = 1;
- genuine later recovery retrieval correct = 1;
- mastered non-due repeat = 0;
- immediate revealed-answer replay = 0;
- miss = 0;
- free/okawari = 0 for battle ticket progress;
- 5 qualifying extra correct = 1 ticket;
- no hard time gate;
- no difficulty/challenge/recovery multiplier.

Try to break that claim.

## Required attack questions

- Can mastered/easy content still be presented as `recommended/current-fit` often enough to farm tickets?
- Is the boundary between recommended practice and non-due mastered repeat available stably from Kids Quest state?
- Can a child intentionally miss to reset mastery/difficulty and turn formerly mastered items back into qualifying items?
- Does the definition of genuine recovery prevent `show answer -> tiny variation -> correct` farming?
- Can due-SRS state be manipulated through clock/date/reload/profile changes?
- Can repeated same-skill practice stay qualifying indefinitely before mastery updates persist?
- Can strongest-subject-only play exploit a gap between mastery granularity and question granularity?
- Can free/okawari events mutate learning state so that subsequent extra answers are incorrectly classified as qualifying?
- Can reload/replay/cloud/profile boundaries duplicate `extraQualifyingCorrectTotal` milestones?
- Are stable semantic event IDs actually available or must the design specify a new persisted identity contract?
- Does removing the time gate let a low-value high-speed route outperform legitimate learning?
- Does the proposal correctly allow genuine 1–2 second mastery without treating speed as cheating?
- Does due SRS receive full value even though the learner has mastered the item historically?
- Does honest struggling learning reach tickets without needing substantially more successful retrievals than a normal learner?
- Does the 9-battle soft nudge help without becoming a hidden cap or reward confiscation?
- Do weak-bench, pre-KO capture XP, old-area XP and ticket settlement remain consistent with end-to-end study-first economics?

## Required adversarial cases

A. normal recommended learner
B. easy/mastered farmer
C. strongest-subject-only farmer
D. same-skill focused learner
E. intentional-miss demoter
F. genuine fast high performer
G. random fast tapper
H. idle waiter
I. difficulty-avoiding learner
J. honest wrong -> support -> later retrieval learner
K. due SRS learner
L. free/extra/okawari optimizer
M. seven-day ticket hoarder
N. old-area XP farmer
O. capture optimizer
P. high-level active + weak bench
Q. newly caught low-level trainer
R. slightly stronger opponent challenger
S. reload/replay/profile-switch optimizer

## Required implementation-feasibility audit

For every semantic qualification rule, identify the exact existing state/ID that can support it, or mark it as a missing contract that must be added before implementation.

At minimum inspect:

- task kind / mode identity;
- skill / unit / knowledge identity;
- mastery state;
- SRS due state/date;
- first-attempt correctness;
- reveal/explanation state;
- retry/reinforcement identity;
- stable answer/completion/reward event ID;
- per-profile persistence;
- cloud/reload idempotency boundary.

Do not approve a semantic rule that is educationally elegant but cannot be made deterministic from stable state.

## Simulation

Run 7-day and 30-day estimates for at least:

- NORMAL;
- EASY FARMER;
- STRONG-SUBJECT FARMER;
- HIGH PERFORMER;
- STRUGGLING LEARNER;
- INTENTIONAL MISS OPTIMIZER;
- HEAVY LEGITIMATE LEARNER;
- OLD-AREA FARMER.

Report:

- total questions/day;
- semantic qualifying correct/day;
- learning minutes/day as telemetry;
- tickets/day;
- battles/day;
- game minutes/day;
- rolling learning/game ratio;
- XP/day and expected level path;
- mastered non-due repeat share;
- due-SRS share;
- recovery share;
- exploitability.

Do not fail the design merely because a genuinely high-performing learner earns tickets faster in wall-clock time. Fail it if a **lower-value strategy** beats legitimate qualifying learning because of reward mechanics.

## Review findings

Classify P0/P1/P2/P3.

For each issue include:

- design section;
- optimizing strategy / reproduction;
- exact semantic-state ambiguity if applicable;
- educational impact;
- game-economy impact;
- recommended fix;
- whether it blocks promotion.

## Required final answers

Answer explicitly:

1. Is binary A+ safer than continuous weighted Learning Value here?
2. Is `5` still a reasonable threshold?
3. Can `recommended/current-fit` be defined without creating a second ManaEvo learning engine?
4. Is `mastered + non-due = 0` safe for legitimate focused practice?
5. Is `due SRS = 1` robust and game-resistant?
6. Is the recovery definition strict enough to prevent answer-reveal farming?
7. Can intentional miss/demotion still create a profitable route?
8. Can high performers remain ungated by time safely?
9. Is a hard subject-diversity rule unnecessary?
10. Is 7-day TTL still acceptable?
11. Is a hard daily battle cap unnecessary?
12. What exact stable state/IDs are required for implementation?
13. Which CURRENT contracts must be updated if promoted?
14. Which runtime drifts must be fixed in the subsequent product-change PR?

## Final verdict

Conclude with exactly one:

- `DESIGN PASS — PROMOTE A+ TO CURRENT`
- `DESIGN PASS WITH CHANGES — REVISE A+ THEN PROMOTE`
- `DESIGN FAIL — KEEP CURRENT`

If PASS, provide **exact canonical wording/values** to promote, not just general approval.

Do not merge PR #115, modify CURRENT, or implement runtime during this review.
