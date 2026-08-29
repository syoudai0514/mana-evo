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

The first independent review rejected both a hard `20 sec` minimum-time ticket condition and continuous weighted Learning Value (`0.35`, `0.60`, `1.25`, `1.30`, etc.). Both create new optimization targets: waiting can satisfy time, and weighted values can make easy/bonus-classified questions economically superior.

Recommended replacement: **A+ — five semantic qualifying correct answers**.

## 4. Proposed A+ reward rule

After daily core is complete:

```text
for each EXTRA-mode answer event:
  if semanticQualifyingCorrect(event, learningState):
    extraQualifyingCorrectTotal += 1

for each newly crossed multiple of 5:
  battle ticket +1
```

No fractional progress. No challenge multiplier. No recovery multiplier. No hard time threshold.

A correct contributes exactly `1` only when it is one of these categories:

### A. Recommended / current-fit retrieval
Kids Quest selected the item as legitimate current learning according to its existing mastery/adaptive/review state, and the answer is a valid correct retrieval. ManaEvo must not create a second difficulty engine.

### B. Due SRS retrieval
A correct answer to an item Kids Quest marks **due** qualifies as `1`, even if historically mastered.

```text
mastered + due SRS -> 1
mastered + non-due immediate/easy repeat -> 0 for ticket progress
```

### C. Genuine recovery retrieval

```text
miss -> explanation/support -> later or alternate retrieval -> correct -> 1
show answer -> acknowledge/repeat revealed answer -> 0
```

The miss itself is always `0`. Recovery is never worth more than ordinary correct.

Non-qualifying ticket events include:
- free mode;
- okawari unless explicitly approved later;
- mastered non-due easy repeats;
- exact/near-exact immediate replay after exposure;
- explanation acknowledgement without retrieval;
- wrong / `わからない`;
- duplicate/replayed reward events already accounted by stable semantic IDs.

Kids Quest learning progress itself is not erased when ManaEvo ticket progress is `0`.

## 5. State separation and idempotency

Do not use shared `additionalCorrectTotal` for ticket milestones.

Use a dedicated per-profile semantic counter such as:

```text
extraQualifyingCorrectTotal
```

It must increment only from qualifying `extra` events, persist per profile, survive reload/cloud resume, cross each multiple-of-5 milestone exactly once, and use stable semantic event/reward IDs rather than transient UI indexes.

This explicitly prevents the known runtime route `free x4 -> extra x1 -> ticket`.

## 6. No hard time condition

Ticket eligibility must not depend on wall-clock or minimum answer time. Waiting becomes farmable and genuine high performers would be forced to slow down.

Time remains telemetry only:
- foreground answer time;
- background excluded;
- bounded/capped per-answer contribution for analytics only;
- P10/P50/P90 by learner segment;
- rolling learning/game ratio.

Fast correct alone is not cheating. Persistent fast + accurate mastery should cause Kids Quest adaptive advancement, not ManaEvo reward suppression. Existing multi-signal anti-spam remains the safety model.

## 7. Struggling learner / intentional miss

Candidate:
- miss = `0`;
- support/explanation = `0`;
- genuine later retrieval correct = `1`;
- revealed-answer immediate repetition = `0`.

For intentional demotion:
- misses never add progress;
- displayed difficulty has no multiplier;
- recovery is capped at `1`;
- mastered/non-due repeats remain `0` even after demotion;
- repeated `miss -> demotion -> rapid easy correct` is telemetry/anti-spam evidence, not a reward source.

Thus intentional demotion requires extra non-rewarding actions and must not beat direct qualifying learning.

## 8. Same-skill / subject concentration

Do not apply fractional diminishing return merely because questions share a skill or subject; focused practice can be legitimate.

Use semantic state instead:
- unmastered/current-fit may continue to qualify within one skill;
- once mastered and non-due, repetition contributes `0`;
- due SRS later qualifies again;
- no hard subject quota;
- subject concentration is telemetry.

## 9. Ticket storage and study-first time budget

Keep 7-day TTL / FEFO. Do not add a hard daily battle cap in this candidate.

A soft learning-oriented nudge after approximately **9 battles/day** may be reviewed as UX tuning, but must not confiscate tickets or block play.

Time is a product-health metric, not a per-ticket hard gate. Supplied baseline telemetry:
- learning average ≈ 7.8 sec/question;
- battle average ≈ 15.5 sec/battle;
- typical daily core ≈ 156 sec learning -> 46.5 sec game;
- typical extra 5 questions ≈ 39 sec learning -> 15.5 sec game.

A genuine high performer may occasionally have daily learning time below game time without being forced to idle. The invariant is that **low-value reward optimization must not become the dominant strategy**.

## 10. Battle / XP economy invariants

This proposal does not change D-022 values, but second review must verify end-to-end consistency:
- weak bench cannot reduce ordinary reference below active-only power;
- Battle XP level-gap modifier applies consistently, including pre-KO capture where equivalent;
- post-KO capture grants no second Battle XP;
- old-area farming is easier but worse XP/ticket;
- slightly stronger opponents retain modest reward value;
- new low-level monsters remain trainable;
- played loss/abandon consumes exact reservation.

Known runtime drifts requiring later product-change implementation if still present:
- free/okawari shared counter leakage;
- weak-bench active-floor violation;
- pre-KO capture / terminal-path XP inconsistency.

## 11. Child-facing UX / behavioral rationale

Prefer simple progress:
- `あと2もんで バトルチケット！`
- `このもんだいは もうバッチリ！ つぎへすすもう`
- `きょうは このもんだいを おぼえているかな？`
- `まちがえても、あとでできたらOK！`

Avoid decimal multipliers, waiting countdowns, and punitive “worth less” wording.

Rationale:
- goal gradient favors `あとNもん` over fractional value;
- due SRS preserves retrieval/spacing value;
- fast mastery advances difficulty instead of being punished;
- later recovery restores ordinary credit without intentional-miss bonus;
- reward math stays mostly invisible to reduce reward arbitrage / overjustification risk.

## 12. Second-review adversarial cases

Re-test A–S:
normal recommended, easy/mastered farmer, strongest-subject farmer, same-skill focused learner, intentional demoter, genuine fast learner, random tapper, idle waiter, difficulty avoider, honest recovery learner, due SRS learner, free/extra/okawari optimizer, ticket hoarder, old-area farmer, capture optimizer, weak-bench optimizer, new-monster trainer, slightly-stronger challenger, reload/replay/profile-switch optimizer.

The reviewer must try to falsify the claim that **recommended/current-fit, due SRS and genuine recovery are the shortest reliable routes to ticket progress**.

## 13. Simulation and feasibility requirements

Run 7-day / 30-day comparisons at least for NORMAL, EASY FARMER, STRONG-SUBJECT FARMER, HIGH PERFORMER, STRUGGLING LEARNER, INTENTIONAL MISS OPTIMIZER, HEAVY LEGITIMATE LEARNER and OLD-AREA FARMER.

Report total questions, semantic qualifying correct, learning minutes (telemetry), tickets, battles, game minutes, rolling learning/game ratio, XP/level path, mastered non-due share, due-SRS share, recovery share and exploitability.

Success does not require identical tickets/minute across children. A high performer may be faster. It requires that an **educationally low-value strategy does not outperform legitimate learning because of reward mechanics**.

For every semantic rule, reviewer must identify exact stable Kids Quest/ManaEvo state or ID supporting it: task kind, skill/unit/knowledge identity, mastery, SRS due state, first-attempt correctness, reveal/explanation state, retry/reinforcement identity, stable completion/reward event ID, per-profile persistence and cloud/reload idempotency. If deterministic state is missing, promotion is blocked until the contract specifies it.

## 14. Promotion acceptance

Promote only if second review confirms:
1. mastered non-due easy repetition cannot earn tickets;
2. due SRS remains full qualifying;
3. genuine recovery earns ordinary credit without intentional-miss profit;
4. fast mastery is not time-gated;
5. free/okawari cannot leak into extra milestones;
6. replay cannot duplicate progress;
7. legitimate focused practice is not unnecessarily suppressed;
8. no hard subject quota is needed;
9. profile/reload/cloud is idempotent with stable semantic IDs;
10. semantic qualification is implementable from stable Kids Quest state without a second learning authority;
11. battle-side weak-bench/XP/capture drifts are separately fixed before end-to-end production PASS;
12. A+ is materially simpler and no less safe than weighted Learning Value.

## 15. Promotion procedure under D-023

If second review passes, do not merge this proposal as authority by itself. Create a separate canonical-promotion/product-change PR updating:
- `design/current/01-LEARNING-REWARDS.md`;
- `design/current/02-BATTLE-TICKETS-BALANCE.md` if battle-side conformance changes are included;
- `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`;
- `design/current/05-WORLD-PROGRESSION.md` only if world rules actually change;
- `design/rebuild/DECISION-LOG.md`.

When runtime changes are included, declare `Canonical-Impact: changed` and synchronize CURRENT + Decision Log + implementation in the same product-change PR.

## 16. Non-scope

No runtime, DB/save migration, level downgrade, Monster Art, registry, deployment, or Kids Quest authority change in PR #115.

Next action: **second independent design review of A+**, not implementation.
