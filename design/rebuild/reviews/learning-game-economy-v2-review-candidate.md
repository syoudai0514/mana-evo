# ManaEvo Learning × Game Economy V2 — Review Candidate

Status: **DESIGN PASS CONDITION SATISFIED / READY FOR CANONICAL PROMOTION / NOT CURRENT**  
Base: `main@118f3931819cded4da8bc0dc5622775dff20d535`  
Governance: `REBUILD-START-HERE.md` / D-023 Canonical Design Sync Gate

> This proposal incorporates both independent reviews of PR #115. It remains non-authoritative until promoted through a separate D-023 product-change PR that synchronizes CURRENT contracts, Decision Log, runtime and tests.

## 1. Approved A+ shape for canonical promotion

After daily core completion, only `taskKind=extra` correct answers may advance battle-ticket progress.

```text
5 semantic qualifying EXTRA correct -> battle ticket +1
```

There is no fractional Learning Value, difficulty/challenge multiplier, recovery multiplier, speed multiplier, hint multiplier, or minimum-time reward gate.

## 2. Semantic qualifying correct

A correct answer contributes exactly `1` only when the question provenance was fixed at presentation time as one of:

- `adaptive` — recommended/current-fit practice selected by Kids Quest;
- `srs_due` — due spaced-retrieval selected by Kids Quest;
- `reinforcement` — genuine retrieval after an earlier miss/support sequence.

A `reinforcement` item qualifies only when the child must retrieve an answer rather than merely acknowledge/repeat a revealed answer.

The following always contribute `0` to battle-ticket progress:

- miss / `わからない`;
- `free` mode;
- `okawari` mode;
- `revealed_retry` / immediate replay of an answer that was just shown;
- mastered + non-due repetition;
- duplicate/replayed semantic reward events already settled.

Due SRS remains fully qualifying even for mastered knowledge.

## 3. Anti-farm composition rule

Formal mastery can require success across multiple days, so `mastered=false` alone must not allow one already-easy skill to fill every ticket forever.

For each group of five qualifying correct answers that earns one ticket:

> **No more than 3 of the 5 may share the same `knowledgeId`.**

Therefore each ticket requires qualifying retrieval from at least two knowledge identities.

This is not a subject quota. A child may remain entirely within one subject, for example `たし算 x3 + ひき算 x2`.

Questions beyond the per-ticket `knowledgeId` contribution limit continue to update normal Kids Quest learning/mastery/SRS state; only battle-ticket progress waits for a qualifying answer from another `knowledgeId`.

The implementation should maintain the current in-progress five-answer ticket bucket (or an equivalent deterministic representation) so the `3/5` rule cannot be bypassed by reload, profile switching, or reordering semantic events.

## 4. Stable presentation provenance

Reward eligibility must not be inferred after the answer from transient React refs or from difficulty/mastery heuristics in ManaEvo.

Kids Quest presentation state must persist a stable semantic provenance for each presented question:

```text
learningIntent:
  adaptive
  srs_due
  reinforcement
  revealed_retry
```

Stable identity available to the reward bridge must include, as applicable:

```text
profileId
knowledgeId
unitId / skillId
questionInstanceId
originQuestionInstanceId   // reinforcement/retry lineage
rewardEventId              // exactly-once game reward settlement
```

For reinforcement, retain `originKnowledgeId` as well when needed to verify lineage safely.

The provenance is fixed when the question is presented. The reward bridge consumes it; it does not recreate a second learning engine.

Reload/resume must preserve enough provenance to distinguish:

- genuine reinforcement retrieval;
- due SRS retrieval;
- ordinary adaptive/current-fit practice;
- revealed-answer retry that must remain non-qualifying.

## 5. Dedicated ticket progress state

Do not use shared `additionalCorrectTotal` to grant battle tickets.

Use dedicated per-profile semantic state such as:

```text
extraQualifyingCorrectTotal
extraTicketProgressBucket
```

Requirements:

- only qualifying `extra` events enter the ticket bucket;
- `free` / `okawari` cannot contribute indirectly;
- each milestone settles exactly once;
- the `knowledgeId <= 3 per 5` composition is reload/profile/cloud safe;
- stable semantic event IDs prevent duplicate progress;
- unrelated additional-learning counters (capture-item rewards etc.) remain separate.

## 6. Recovery and intentional miss

Economic values remain binary:

```text
miss = 0
support / explanation = 0
genuine later reinforcement retrieval correct = 1
revealed-answer immediate retry = 0
```

Recovery is never worth more than an ordinary correct.

Intentional demotion receives no difficulty bonus. A `miss -> demotion -> easy correct` sequence must still obey semantic qualification and the `knowledgeId <= 3/5` rule. Existing multi-signal anti-spam/hold remains in force; repeated miss→demotion→rapid-correct patterns are telemetry/anti-spam evidence, not positive reward sources.

## 7. High performer and time

Fast correct is not cheating and is not time-gated. Persistent fast/high-accuracy performance should be handled by Kids Quest adaptive progression.

Learning time is telemetry only. Do not make waiting an optimal action.

Measure foreground answer time for health metrics, excluding background/idle time and capping individual samples for analytics if useful. Review P10/P50/P90 and rolling seven-day learning/game ratios rather than forcing every child-day to satisfy a hard time equation.

## 8. SRS / focused practice / subject diversity

- `mastered + due SRS` = qualifying `1`;
- `mastered + non-due repeat` = `0` ticket progress;
- legitimate unmastered/current-fit focused practice may qualify;
- no fractional same-skill diminishing return;
- no hard subject quota;
- subject concentration remains telemetry.

The `knowledgeId <= 3/5` composition guard prevents formal two-day mastery lag from becoming a same-skill ticket farm while preserving concentrated practice.

## 9. Ticket storage / game-time guardrail

Keep current seven-day TTL / FEFO and no hard daily battle cap.

A soft learning-oriented nudge around nine battles/day may be evaluated as UX tuning; it is not part of the reward formula and must not confiscate tickets or block play.

## 10. End-to-end game economy invariants

The product-change implementation must also restore/verify the existing D-022 invariants identified during review:

- weak bench cannot reduce an ordinary enemy reference below active-only power;
- Battle XP level-gap policy applies consistently to equivalent terminal paths, including pre-KO capture;
- post-KO capture grants no second Battle XP;
- old-area farming remains materially worse XP/ticket;
- played loss/abandon consumes the exact reserved ticket;
- new low-level monster training remains viable.

Known runtime conformance defects are implementation work, not reasons to complicate A+:

- `additionalCorrectTotal` leakage across extra/free/okawari;
- weak-bench active-floor drift;
- terminal/capture XP consistency gaps if still present.

## 11. Day authority hardening

A+ uses the CURRENT canonical profile-day/SRS due source. Reload/profile switching must not re-credit the same semantic retrieval.

Device-clock manipulation is a broader CURRENT platform/SRS concern, not an A+ promotion blocker. Track it as hardening work rather than inventing a separate A+ clock authority.

## 12. Child-facing UX

Keep optimization math hidden and feedback simple:

- `あと2もんで バトルチケット！`
- `このもんだいは もうバッチリ！ つぎへすすもう`
- `きょうは このもんだいを おぼえているかな？`
- `まちがえても、あとでできたらOK！`

Do not show multipliers, waiting timers, or punitive “worth less” language.

## 13. Canonical promotion requirements under D-023

The next product-change PR must synchronize at minimum:

- `design/current/01-LEARNING-REWARDS.md`;
- `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`;
- `design/rebuild/DECISION-LOG.md`;
- runtime learning reward/provenance/idempotency implementation and regression tests.

If battle conformance fixes are included, update `design/current/02-BATTLE-TICKETS-BALANCE.md` only when its product contract changes; otherwise treat them as implementation conformance to the already-current D-022 contract and test them in the same product-change set.

Canonical-Impact for that PR must be `changed` with owning domains declared according to `design/current/canonical-sync-map.json`.

## 14. Promotion verdict

The two blockers from the second independent review are now explicitly resolved in this candidate:

1. same `knowledgeId` contributes at most `3/5` to one earned ticket;
2. stable presentation provenance is defined for `adaptive / srs_due / reinforcement / revealed_retry` with stable lineage/event IDs.

Therefore this candidate is **ready to be promoted to CURRENT through the D-023 synchronized product-change process**. PR #115 itself remains a review artifact and must not be treated as authority merely by being merged.
