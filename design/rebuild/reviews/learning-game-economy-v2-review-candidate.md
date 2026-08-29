# ManaEvo Learning × Game Economy V2 — Review Candidate

Status: **PROPOSAL / REVIEW REQUIRED / NOT CURRENT**  
Base: `main@118f3931819cded4da8bc0dc5622775dff20d535`  
Governance: `REBUILD-START-HERE.md` / D-023 Canonical Design Sync Gate

> This document is deliberately **not** a CURRENT contract yet. It exists to be attacked and reviewed before any product rule is promoted into `design/current/**` or runtime. Newer does not mean authoritative.

## 1. Product invariant

ManaEvo is a learning product with an RPG reward loop. The core invariant is:

> **GAME REWARD MAXIMIZATION SHOULD LEAD TO HIGH-VALUE LEARNING BEHAVIOR.**

A child who optimizes for more battles should naturally be pushed toward appropriate difficulty, useful retrieval, recovery from mistakes, spaced review and sustained learning — not toward easy-question farming, intentional failure, idle-time farming or replay exploits.

This extends the already-confirmed D-022 study-first principle. It does not change Kids Quest's ownership of learning content, SRS, mastery, promotion or adaptive difficulty.

## 2. Current production baseline to preserve unless review changes it

- Daily core: five core tasks; first daily completion grants `ticket +3`.
- New battle remains locked until today's core is complete.
- Ticket TTL: acquisition day + six following days; FEFO.
- Played battle consumes the exact reserved ticket on win / capture / loss / explicit abandon; technical interruption resumes the same battle.
- Additional-study production rate: `5 qualifying extra correct -> ticket +1`.
- `free` has no direct ticket grant.
- Additional learning 3 correct -> star capture item +1; normal/hard mastery grants remain separate.
- Battle V6 XP / world / capture / fair-fight rules remain governed by D-022 and CURRENT contracts.

The review may recommend replacing the simple `5 correct` rate, but must prove that the replacement improves learning incentives without making genuine mastery feel punitive.

## 3. Threat model: reward-optimizing child

Review under the assumption that the child discovers whichever route gives the most game access per unit effort.

Mandatory archetypes:

A. normal recommended learner  
B. easy-question farmer  
C. strongest-subject-only farmer  
D. genuine high performer / very fast correct learner  
E. intentional-miss difficulty demoter  
F. struggling learner who attempts hard material honestly  
G. core-only learner  
H. heavy additional-study learner  
I. ticket hoarder who batches battles on a later day  
J. old-area XP farmer  
K. capture-first progression optimizer  
L. high-level active + weak bench optimizer  
M. newly-caught low-level monster trainer  
N. slightly-overlevel challenge seeker  
O. reload/replay/profile-switch reward optimizer

The design fails if B/C/E/O can beat A/F/N materially on `tickets per effective-learning-minute` or if J/K/L can dominate XP progression in ways that undermine study-first pacing.

## 4. Learning Value candidate model

### 4.1 Replace raw correct-count as the long-term target

Candidate target:

```text
Learning Value >= 5.0
AND effective active study time >= 20 sec
=> battle ticket +1
```

These are **review numbers**, not approved constants.

The review must compare this against KEEP-5-CORRECT and simpler alternatives. Complexity must earn its keep.

### 4.2 Per-answer value

Start from `base = 1.0` for a legitimate extra-mode answer, then apply only signals already derivable from Kids Quest state or stable ManaEvo reward metadata.

Candidate bands:

| Learning state | Candidate value | Rationale |
|---|---:|---|
| appropriate / current-level first-attempt correct | 1.00 | default |
| slightly challenging, first-attempt correct | 1.15–1.25 | small challenge incentive, not jackpot |
| previously missed, then correctly retrieved after explanation / later retry | 1.15–1.30 | rewards recovery rather than mistake avoidance |
| legitimate spaced review due after meaningful delay | 0.80–1.00 | retrieval practice remains valuable |
| clearly mastered / easy repeat | 0.35–0.60 | review still counts, farming is inefficient |
| same skill/concept repeated in short window | diminishing to 0.20–0.40 | prevents same-skill farm |
| exact/near-exact immediate replay | 0 | no reward farming |
| answer while protected anti-spam hold is active | held, not destroyed | avoid punishing legitimate learning |

Maximum single-answer contribution should remain low enough that one lucky hard answer cannot buy a battle.

### 4.3 Do not use absolute school difficulty alone

Value must be relative to the child's learning state. A question that is objectively easy may still be valuable if it is a current weakness. Conversely, a nominally advanced item may be trivial for a high-performing child.

Use personal skill/mastery history where available. Do not create a second independent difficulty engine in ManaEvo.

## 5. Anti-farming rules to review

### 5.1 Easy-question farming

Desired invariant:

```text
5 appropriate questions should earn at least as much ticket progress
as a materially larger set of already-mastered easy repeats.
```

Easy review is not banned. It simply must not be the fastest route to game time.

### 5.2 Strongest-subject-only farming

Do not hard-require every subject for every ticket. That would interfere with legitimate focused practice.

Candidate guardrail:

- reward value is primarily per-learning-value, not per-subject;
- repeated same-domain / same-skill contributions diminish inside a short window;
- legitimate focused study remains possible, but hopping to the easiest mastered domain should not increase ticket efficiency.

Subject diversity should be a telemetry/guardrail metric before becoming a hard multiplier.

### 5.3 Intentional failure to lower adaptive difficulty

Kids Quest may lower support/difficulty after repeated misses. ManaEvo must not make this a profitable game-reward strategy.

Candidate protection:

- answers immediately following a difficulty demotion do not gain an artificial reward bonus merely because they are now easier;
- value derives from current mastery/retrieval state, not the raw displayed difficulty level alone;
- repeated pattern `misses -> demotion -> easy correct farm` must be detectable in simulation/telemetry.

Do not punish honest struggling learners for needing scaffolding.

### 5.4 Rapid answers vs genuine mastery

Fast correct is not cheating. A child who has mastered `2+1` should answer quickly.

Therefore:

- very fast alone must not zero rewards;
- existing multi-signal anti-spam hold remains the safety model;
- persistent fast + high accuracy should normally cause the learning engine to advance difficulty, not ManaEvo to punish speed;
- mastered fast items can have lower Learning Value because they are low incremental learning value, not because speed itself is bad.

### 5.5 Idle-time farming

If a minimum study-time floor is adopted, elapsed wall-clock time alone must not be farmable.

Candidate effective-time rule:

- count bounded per-question active time, e.g. floor/ceiling around a plausible engagement window;
- long background/idle time contributes no additional value;
- avoid requiring a child to wait intentionally before submitting a known answer.

Exact active-time measurement must be reviewed for reliability before implementation. If reliable engagement time cannot be measured, prefer a simpler learning-value-only rule over fake precision.

### 5.6 SRS / spaced repetition

Spaced review must not be classified as worthless easy repetition. A mastered item that is due after a meaningful interval can carry near-normal value because retrieval after delay is educationally useful.

Short-window repetition and due-SRS repetition must be distinguishable using existing stable knowledge/unit identities and SRS state.

### 5.7 Error recovery

Pure `correct-only` reward creates an incentive to avoid difficult material.

Desired behavior:

```text
initial miss -> explanation/scaffold -> later successful retrieval
```

should be at least as rewarding educationally as an easy first-attempt correct, while the miss itself does not mint a ticket.

This encourages persistence without making random guessing profitable.

## 6. Time-budget invariant

Production telemetry supplied for Battle V6:

- learning average ≈ 7.8 sec/question
- battle average ≈ 15.5 sec/battle

Current expected baseline:

```text
20 core questions-ish -> ~156 sec learning -> 3 battles -> ~46.5 sec game
5 additional answers -> ~39 sec learning -> 1 battle -> ~15.5 sec game
```

Target guardrail:

- median daily learning time should materially exceed battle time;
- additional-study route should not permit battle time to exceed effective learning time for ordinary/reward-optimizing use;
- do not infer success from population averages alone; examine P10/P50/P90 and optimizer archetypes.

A proposed minimum `20 sec effective study / extra ticket` is a starting hypothesis because it remains above one average battle duration with margin. It must be simulated and can be rejected.

## 7. Ticket storage / batching

Seven-day TTL is valuable because it avoids punishing missed days. But it creates a second question: accumulated study can produce a later game-heavy day.

Review alternatives:

1. **Keep 7-day storage with no daily spend cap** — simplest and child-friendly.
2. Add a soft daily battle recommendation, not a hard cap.
3. Add a hard daily spend cap only if telemetry shows game-only binge days materially violate the learning-first product goal.

Default recommendation before evidence: **do not add a hard daily battle cap yet**. Measure stored-ticket age and battles/day first. Hard caps create loss aversion and can make earned rewards feel confiscated.

## 8. Battle / XP economy interaction

Learning economy cannot be reviewed in isolation.

Mandatory invariants:

- weak bench cannot lower ordinary encounter reference below active-only power;
- Battle XP level-gap modifier applies consistently to KO, pre-KO capture and any other reward terminal path;
- post-KO capture gives no second Battle XP;
- old-area farming is easier for growth feeling but materially worse XP efficiency;
- slightly stronger opponents retain a modest XP premium;
- new low-level monsters remain trainable without making carry+weak-bench the dominant strategy;
- played loss/abandon consumes the exact reserved ticket so free retry is not optimal.

The existing D-022 values are baseline inputs to the review, not automatically assumed perfect.

## 9. Behavioral design principles

Use behavioral science as constraints, not decorative labels.

- **Present bias:** ticket progress provides immediate feedback after learning, but the game reward must not overpower the learning goal.
- **Goal-gradient effect:** visible progress toward the next ticket can increase persistence; avoid showing exploitable multiplier math.
- **Loss aversion:** hold suspicious rewards rather than deleting them; avoid hard caps that make earned tickets feel stolen without evidence.
- **Desirable difficulty:** slightly challenging work can earn a small bonus; do not make extreme difficulty optimal.
- **Retrieval practice / spacing:** due recall after delay remains high-value.
- **Interleaving:** monitor subject/skill diversity; prefer soft encouragement before hard gating.
- **Mastery motivation:** fast accurate performance should graduate the child to harder material, not trigger punishment.
- **Growth mindset:** recovery after mistakes should have visible positive value.
- **Overjustification risk:** child UI should emphasize learning/growth/challenge, not expose a casino-like reward formula.

## 10. Child-facing UX candidate

Internal calculation may be nuanced; child-facing language should be simple.

Good patterns:

- `あと 2マナで バトルチケット！`
- `このもんだいは もうバッチリ！ つぎへ すすもう`
- `きのうの もんだいを おぼえているかな？`
- `むずかしいのに できた！`
- `まちがえても だいじょうぶ。もういちど できた！`

Avoid:

- explicit `1.25x` difficulty multipliers;
- telling the child that mastered work is “worth less” in punitive language;
- visible optimization tables that turn learning into reward arbitrage.

## 11. Required simulations before promotion

Run at least 7-day and 30-day simulations for all A–O archetypes.

For each report:

- questions/day
- effective learning minutes/day
- Learning Value/day
- ticket earned/day
- ticket spent/day
- stored ticket age
- battles/day
- game minutes/day
- learning/game time ratio
- XP/day
- expected level path
- subject/skill diversity
- mastered-repeat share
- challenge share
- recovery-after-error share
- exploit score / dominant strategy

Compare at minimum three candidate economies:

1. CURRENT `5 extra correct -> ticket +1`
2. `5 correct + minimum effective time`
3. Learning Value threshold + effective-time guard

A more complex model should only win if it clearly improves optimizer behavior and struggling-learner fairness.

## 12. Proposed telemetry / guardrails

Initial review targets, not production commitments:

| Metric | Desired direction / review alert |
|---|---|
| learning minutes / game minutes | >1.5 at P10; comfortably >2 at median |
| effective learning minutes per additional ticket | > one average battle duration with margin |
| mastered/easy-repeat share among ticket-earning answers | alert if it becomes dominant |
| same-skill short-window share | no farming advantage vs recommended mix |
| challenge-question share | enough to show progression, not forced |
| recovery-after-error rate | should not fall because children avoid hard items |
| subject concentration | monitor high concentration, do not hard-fail legitimate focus |
| ticket earned/day vs spent/day | detect accumulation/binge patterns |
| stored ticket age | detect 7-day edge exploitation |
| old-area battle share / XP share | old-area XP must not dominate progression |
| capture-vs-KO XP | same policy for equivalent pre-KO terminal reward |
| level velocity | remains consistent with world recommendation bands |

Thresholds should be calibrated after simulation and real telemetry rather than invented as immutable constants.

## 13. Acceptance criteria for design promotion

This proposal may be promoted into CURRENT only when an independent reviewer concludes all of the following:

1. Easy-question farming is not the fastest ticket route.
2. Intentional failure cannot profitably lower difficulty for ticket farming.
3. Genuine fast mastery is not treated as cheating.
4. Honest struggling learners are not penalized for scaffolding/mistakes.
5. Spaced repetition retains meaningful value.
6. Same-skill short-window farming has diminishing value.
7. Idle time cannot satisfy a study-time rule without meaningful interaction.
8. Error recovery is positively reinforced.
9. Additional-study game time remains below effective learning time for optimizer archetypes.
10. Ticket storage does not require a hard cap without evidence.
11. Battle/XP/capture routes do not provide an easier progression exploit than the learning economy intends.
12. The model is implementable with stable IDs/state and remains idempotent across reload/profile/cloud boundaries.
13. Complexity is justified; if a simpler model meets these criteria, prefer the simpler model.

## 14. Promotion procedure under D-023

If review approves a product change:

- update `design/current/01-LEARNING-REWARDS.md` for Learning Value / additional-ticket rules;
- update `design/current/02-BATTLE-TICKETS-BALANCE.md` if battle/XP/ticket lifecycle guardrails change;
- update `design/current/08-ACCEPTANCE-TEST-CONTRACT.md` with simulation/regression requirements;
- update `design/current/05-WORLD-PROGRESSION.md` only if world bands/progression rules actually change;
- update `design/rebuild/DECISION-LOG.md` with the approved decision and exact values;
- then implement runtime in a PR declaring `Canonical-Impact: changed` and the mapped domains;
- CURRENT + Decision Log + implementation must remain in the same product-change PR, per D-023.

If review rejects the proposal, do not alter CURRENT just because this review candidate is newer.

## 15. Explicit non-scope of this review candidate

- no runtime change
- no DB/save migration
- no automatic existing-level downgrade
- no Monster Art changes
- no art registry/promotion changes
- no production deploy
- no change to Kids Quest source authority

The next action is adversarial design review, not implementation.
