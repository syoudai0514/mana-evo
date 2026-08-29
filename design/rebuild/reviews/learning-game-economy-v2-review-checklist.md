# Learning × Game Economy V2 — Second Independent Review Checklist

Status: **SECOND REVIEW COMPLETE / PROMOTION CONDITIONS RESOLVED / NOT CURRENT**

Review target: `design/rebuild/reviews/learning-game-economy-v2-review-candidate.md`

The second independent review returned:

`DESIGN PASS WITH CHANGES — REVISE A+ THEN PROMOTE`

Two promotion blockers were identified and are now incorporated into the candidate:

1. Within each five-answer ticket bucket, no more than three qualifying answers may share the same `knowledgeId`.
2. Presentation-time semantic provenance is explicit and stable: `adaptive | srs_due | reinforcement | revealed_retry`, with stable question/reward lineage IDs.

The reviewer stated that with these two changes the verdict becomes:

`DESIGN PASS — PROMOTE A+ TO CURRENT`

## Canonical promotion checklist

The next D-023 product-change PR must update CURRENT + Decision Log and must not merge until runtime/tests conform.

Required CURRENT changes:

- `design/current/01-LEARNING-REWARDS.md`
- `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
- `design/rebuild/DECISION-LOG.md`

Runtime/test requirements:

- dedicated `extraQualifyingCorrectTotal` / per-ticket composition state;
- only `taskKind=extra` may contribute;
- semantic provenance fixed at presentation;
- `knowledgeId <= 3` within each five-answer ticket bucket;
- due SRS = 1;
- genuine reinforcement retrieval = 1;
- revealed retry = 0;
- mastered non-due = 0;
- free/okawari = 0;
- miss/わからない = 0;
- stable semantic reward IDs and profile-local exactly-once settlement;
- reload/cloud/profile regression coverage;
- preserve existing multi-signal anti-spam hold;
- restore existing D-022 runtime conformance for weak-bench active floor and capture/terminal XP consistency where still drifting.

## Adversarial acceptance

Before merge, tests/review must explicitly cover:

- same-knowledge pre-mastery farming;
- intentional miss -> difficulty demotion -> easy-correct strategy;
- due-SRS retrieval;
- fast genuine mastery;
- struggling learner recovery;
- free/okawari leakage;
- revealed-answer retry;
- replay/reload/profile duplication;
- seven-day ticket storage;
- old-area XP/ticket efficiency;
- high-level active + weak bench;
- pre-KO vs KO/post-KO capture XP settlement.

No further design review is required solely for these two already-resolved blockers. Any material change to the A+ rules requires renewed review.
