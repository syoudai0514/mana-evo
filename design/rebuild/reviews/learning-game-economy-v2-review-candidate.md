# ManaEvo Learning × Game Economy V2 — Review Candidate

Status: **PROPOSAL / SECOND REVIEW REQUIRED / NOT CURRENT**  
Base: `main@118f3931819cded4da8bc0dc5622775dff20d535`  
Governance: `REBUILD-START-HERE.md` / D-023 Canonical Design Sync Gate

> This document remains deliberately **non-authoritative**. It incorporates the first independent review of PR #115 and is now a revised candidate for a second review. It must not be promoted into `design/current/**` or runtime until that review passes.

## 1. Product invariant

ManaEvo is a learning product with an RPG reward loop.

> **GAME REWARD MAXIMIZATION SHOULD LEAD TO HIGH-VALUE LEARNING BEHAVIOR.**

A child optimizing for more battles should naturally be pushed toward recommended/current-fit retrieval, due spaced review, honest recovery from mistakes and sustained learning — not toward mastered-easy repetition, intentional failure, idle waiting, free-mode leakage, replay exploits or game-side farming.

Kids Quest remains authoritative for learning content, SRS, mastery, adaptive difficulty, promotion and grade controls. ManaEvo owns only the bridge from semantic learning events into game rewards.

## 2. Current production baseline

Preserve unless an approved later decision changes it:

- daily five-core-task completion grants `ticket +3` once/day;
- new battle is locked until today's core is complete;
- ticket TTL is acquisition day + six days; consume FEFO;
- a played battle consumes the exact reserved ticket on win / capture / loss / explicit abandon;
- reload/crash/Safari termination resumes the same active battle without a second ticket;
- free study grants no direct ticket;
- additional-learning star/mastery rewards remain governed by CURRENT W-101;
- D-022 Battle V6 XP, world, capture and fair-fight rules remain baseline inputs.

The current production statement `5 qualifying extra correct -> ticket +1` is retained as the simple shape, but this proposal defines **qualifying** more precisely.

## 3. First-review result

The first independent review rejected both:

1. a hard `20 sec` minimum-time ticket condition; and
2. continuous weighted Learning Value (`0.35`, `0.60`, `1.25`, `1.30`, etc.).

Reason: both create new optimization targets. Waiting can satisfy a time threshold, and weighted values can make mastered-easy or bonus-classified questions economically superior to ordinary recommended learning.

Recommended replacement: **A+ — five semantic qualifying correct answers**.

This revision adopts that recommendation for second review.

## 4. Proposed A+ reward rule

### 4.1 Ticket threshold

After daily core is complete:

```text
for each EXTRA-mode answer event:
  if semanticQualifyingCorrect(event, learningState):
    extraQualifyingCorrectTotal += 1

for each newly crossed multiple of 5:
  battle ticket +1
```

No fractional ticket progress. No challenge multiplier. No recovery multiplier. No hard time threshold.

### 4.2 Qualifying categories

A correct answer contributes exactly `1` only when it is one of these semantic categories.

#### A. Recommended / current-fit retrieval

Qualifies when Kids Quest selected the item as legitimate current learning according to its existing mastery/adaptive/review state and the answer is a valid correct retrieval.

Examples:

- unmastered/current unit practice;
- current-fit adaptive question;
- a next-needed item selected by the learning engine.

ManaEvo must not create a second difficulty engine.

#### B. Due SRS retrieval

A correct answer to an item that Kids Quest marks as **due** for spaced review qualifies as `1`, even when the knowledge is otherwise mastered.

Core distinction:

```text
mastered + due SRS -> 1
mastered + non-due immediate/easy repeat -> 0 for ticket progress
```

Learning progress itself remains owned by Kids Quest and is not zeroed merely because the ManaEvo ticket bridge contributes `0`.

#### C. Genuine recovery retrieval

A prior miss may lead to a later qualifying correct only when a genuine retrieval step occurs after support/scaffolding.

Desired shape:

```text
miss -> explanation/support -> later or alternate retrieval -> correct -> 1
```

Non-qualifying:

```text
show answer -> acknowledge/repeat same revealed answer -> 0
```

The miss itself is always `0`. Recovery can never be worth more than an ordinary qualifying correct.

### 4.3 Non-qualifying events

Ticket progress is `0` for:

- `free` mode answers;
- `okawari` answers unless a later explicit product decision changes ownership;
- mastered, non-due easy repeats selected only for repetition/farming;
- exact or near-exact immediate replay where semantic identity indicates the answer was just exposed;
- explanation acknowledgement without retrieval;
- wrong answers / `わからない` themselves;
- duplicate/replayed reward events already accounted by stable semantic IDs.

This does not erase legitimate Kids Quest progress or SRS state. It only controls ManaEvo battle-ticket progress.

## 5. Required state separation

The ticket bridge must not use a shared `additionalCorrectTotal` for multiple task kinds.

Canonical candidate state:

```text
extraQualifyingCorrectTotal
```

Requirements:

- increment only from semantic qualifying `extra` events;
- persist per child profile;
- survive reload/cloud resume without duplicate milestone crossing;
- use stable semantic event/reward IDs;
- never derive ticket eligibility from a transient UI index;
- free/okawari/additional-capture-item counters remain separate concerns.

This explicitly prevents the known runtime route:

```text
free correct x4 -> extra correct x1 -> ticket
```

## 6. No hard time condition

Ticket eligibility must **not** depend on wall-clock or minimum answer time.

Reason:

- waiting becomes a farmable action;
- genuine high performers would be forced to slow down;
- elapsed time is not equivalent to cognitive engagement.

Time remains important as telemetry.

Recommended measurement only:

- foreground answer time;
- background time excluded;
- cap individual answer contribution for analytics (candidate upper cap around 12 sec, tuning value only);
- report P10/P50/P90 by learner segment;
- monitor rolling learning/game ratio.

The time metric must not tell the child to wait before submitting an answer.

## 7. High performer rule

Fast correct is not cheating.

If a child correctly retrieves five qualifying items in ten seconds, the five answers may still earn one ticket.

The response to persistent high accuracy/fast mastery should be Kids Quest adaptive advancement, not ManaEvo reward suppression.

Existing multi-signal anti-spam remains valid:

- speed alone is insufficient;
- suspicious reward is held, not destroyed;
- legitimate learning progress is not zeroed.

## 8. Struggling learner and error recovery

Do not pay for mistakes, but do not make a mistake an irreversible economic loss.

Candidate:

- miss = `0`;
- support/explanation = `0`;
- genuine later retrieval correct = `1`;
- revealed-answer immediate repetition = `0`.

There is no `1.3x` recovery bonus. This avoids intentional-miss arbitrage while making honest recovery economically equivalent to an ordinary qualifying correct.

## 9. Intentional difficulty demotion

Kids Quest adaptive difficulty may lower difficulty after repeated misses. ManaEvo must not reward this strategy.

Candidate invariants:

- misses never add ticket progress;
- raw displayed difficulty never adds a ticket multiplier;
- recovery contribution is capped at ordinary `1`;
- mastered/non-due repeats remain `0` even if a learner intentionally demoted difficulty;
- repeated `miss -> demotion -> rapid easy correct` patterns are telemetry/anti-spam signals, not a positive reward source.

Therefore intentional demotion necessarily requires additional non-rewarding actions versus simply answering qualifying current-fit items correctly.

## 10. Same-skill and strongest-subject behavior

Do not apply an automatic fractional diminishing return merely because several questions share a skill or subject. Focused practice can be legitimate.

Instead use semantic state:

- unmastered/current-fit questions may continue to qualify even within one skill;
- once content is mastered and not due, repetition stops contributing to tickets;
- due SRS becomes qualifying again when spacing makes retrieval valuable;
- hard subject quotas are not required;
- subject concentration is telemetry, not a hard reward multiplier.

This lets a child legitimately focus on one domain without making already-mastered easy material the fastest farm.

## 11. Ticket storage and daily game concentration

Keep current 7-day TTL / FEFO.

Do not add a hard daily battle cap in this candidate.

Candidate UX guardrail:

- after approximately **9 battles/day**, show a soft learning-oriented nudge;
- do not confiscate tickets or block play;
- exact threshold is tuning/UI review material, not yet a locked product constant.

Rationale: earned rewards should not feel stolen, and rolling seven-day study/game balance matters more than forcing every single high-performer day to have learning minutes greater than game minutes.

## 12. Study-first time guardrail

Time is a product-health metric, not a per-ticket hard gate.

Supplied telemetry baseline:

- learning average ≈ `7.8 sec/question`;
- battle average ≈ `15.5 sec/battle`;
- ordinary daily core ≈ `156 sec learning -> 46.5 sec game`;
- ordinary additional 5-question block ≈ `39 sec learning -> 15.5 sec game`.

Review/telemetry should monitor:

- rolling 7-day learning/game ratio;
- P10/P50/P90 ratios;
- high-performer segment separately;
- ticket efficiency by semantic answer type;
- easy/mastered non-due share;
- due SRS share;
- recovery share.

A genuine high performer may occasionally have `learning time < game time` in a day without being forced to idle. The product-level invariant is that reward optimization should not make low-value learning the dominant strategy.

## 13. Battle / XP economy invariants

This proposal does not change D-022 values, but the second review must verify end-to-end consistency.

Required:

- ordinary encounter reference must never fall below active-only power because of a weak bench;
- Battle XP level-gap modifier applies to all equivalent reward terminal paths, including pre-KO capture;
- post-KO capture grants no second Battle XP;
- old-area farming is easier but materially worse XP/ticket;
- slightly stronger opponents retain modest reward value without making reckless losses optimal;
- new low-level monsters remain trainable;
- played loss/abandon consumes exact reservation.

Known runtime drift from prior review:

- free/okawari shared additional counter can leak into ticket milestones;
- `0.70 * active + 0.30 * support` may violate active-only floor when support is weak;
- pre-KO capture / terminal-path XP consistency must be verified/fixed by implementation work if still present.

These are not reasons to add complexity to the learning formula; they are separate runtime conformance defects.

## 14. Child-facing UX

Do not expose optimization math.

Preferred feedback:

- `あと2もんで バトルチケット！`
- `このもんだいは もうバッチリ！ つぎへすすもう`
- `きょうは このもんだいを おぼえているかな？`
- `まちがえても、あとでできたらOK！`

Avoid:

- decimals/factors such as `1.25x`;
- countdowns that imply waiting longer earns more;
- punitive language that says mastered review is “worth less.”

## 15. Behavioral rationale

- **Goal gradient:** binary `あとNもん` is simpler and less gameable than `あと2.15 value`.
- **Present bias:** battle access remains an immediate motivator after meaningful retrieval.
- **Overjustification:** keep reward math mostly invisible; emphasize mastery, remembering and persistence.
- **Retrieval / spacing:** due SRS is full qualifying, non-due immediate replay is not.
- **Mastery motivation:** fast accurate learners advance difficulty rather than being slowed artificially.
- **Frustration / learned helplessness:** later genuine recovery restores ordinary credit, so one miss does not permanently push the ticket farther away.

## 16. Second-review adversarial cases

Re-test at minimum:

A. normal recommended learner  
B. easy/mastered farmer  
C. strongest-subject-only farmer  
D. same-skill focused learner  
E. intentional-miss demoter  
F. genuine 1–2 sec high performer  
G. random fast tapper  
H. idle waiter  
I. difficulty-avoiding learner  
J. honest wrong -> support -> retrieval learner  
K. due SRS learner  
L. free/extra/okawari optimizer  
M. 7-day ticket hoarder  
N. old-area farmer  
O. capture optimizer  
P. high-level active + weak bench  
Q. newly caught low-level trainer  
R. slightly stronger opponent challenger  
S. reload/replay/profile-switch optimizer

The second review must specifically try to falsify the claim that **recommended/current-fit, due SRS and genuine recovery are the shortest reliable routes to ticket progress**.

## 17. Simulation requirements

Run deterministic or Monte Carlo comparisons over 7 and 30 days for at least:

- NORMAL;
- EASY FARMER;
- STRONG-SUBJECT FARMER;
- HIGH PERFORMER;
- STRUGGLING LEARNER;
- INTENTIONAL MISS OPTIMIZER;
- HEAVY LEGITIMATE LEARNER;
- OLD-AREA FARMER.

Report:

- semantic qualifying answers/day;
- total questions/day;
- learning minutes/day (telemetry only);
- tickets/day;
- battles/day;
- game minutes/day;
- rolling learning/game ratio;
- XP/day and expected level path;
- due-SRS share;
- mastered non-due repeat share;
- recovery share;
- exploitability.

Success criterion is not that every learner has identical tickets/minute. A high performer may be faster. Success means an **educationally low-value strategy does not outperform legitimate qualifying learning merely because it is easier to farm**.

## 18. Proposed telemetry / guardrails

Candidate telemetry, not immutable production thresholds:

- rolling 7-day learning minutes / game minutes;
- tickets earned/spent per day;
- semantic qualifying correct / all extra correct;
- mastered non-due repeat share;
- due SRS share;
- recovery-after-error rate;
- repeated miss -> demotion -> rapid-correct pattern rate;
- subject concentration;
- stored ticket age;
- battles/day and soft-nudge exposure;
- old-area battle share / XP share;
- capture-vs-KO XP consistency;
- level velocity vs world bands.

## 19. Promotion acceptance criteria

The revised A+ proposal may be promoted only if a second independent review finds:

1. mastered non-due easy repetition cannot earn additional tickets;
2. due SRS remains fully rewarded;
3. genuine recovery earns normal credit without intentional-miss profit;
4. fast mastery is not time-gated or punished;
5. free/okawari cannot leak into extra ticket milestones;
6. exact/near replay cannot duplicate progress;
7. same-skill legitimate focused practice is not unnecessarily suppressed;
8. no hard subject quota is needed to stop easy farming;
9. reload/profile/cloud boundaries are idempotent with stable semantic event IDs;
10. the model can be implemented using stable Kids Quest state already available or explicitly exposed without creating a second learning authority;
11. battle-side weak-bench / XP / capture conformance defects are separately fixed before end-to-end production PASS;
12. A+ is materially simpler and no less safe than continuous weighted Learning Value.

## 20. Promotion procedure under D-023

If second review passes, do **not** merge this proposal as authority by itself. Create a separate canonical-promotion/product-change PR that updates the exact owning contracts and Decision Log:

- `design/current/01-LEARNING-REWARDS.md` — semantic qualifying correct and counter separation;
- `design/current/02-BATTLE-TICKETS-BALANCE.md` — only if battle-side conformance/ticket guardrails are changed in that product PR;
- `design/current/08-ACCEPTANCE-TEST-CONTRACT.md` — semantic qualification, adversarial and idempotency tests;
- `design/current/05-WORLD-PROGRESSION.md` only if world rules actually change;
- `design/rebuild/DECISION-LOG.md` — exact approved decision and rationale.

Under D-023, once runtime changes are included, the same product-change PR must declare `Canonical-Impact: changed`, list owning domains and keep CURRENT + Decision Log synchronized with implementation.

## 21. Explicit non-scope

- no runtime change in PR #115;
- no DB/save migration;
- no automatic existing-level downgrade;
- no Monster Art or registry changes;
- no production deploy;
- no change to Kids Quest source authority.

Next action: **second independent design review of A+**, not implementation.
