# Acceptance checklist — design-led re-review

## Learning / P0

- [x] dailyは5教科の固定queue
- [x] wrong tapだけではcompletion 0
- [x] explanation acknowledgementだけでもcompletion 0
- [x] wrong → explanation → correct retryで通常ケースは1項目完了
- [x] suspicious fast-wrongでは別reinforcement正解まで未完了
- [x] daily未完了free studyはticket 0
- [x] daily途中離脱→同じ残りを再開
- [x] SRS dueが出題へ効く
- [x] difficultyが出題へ効く
- [x] 1-item unit含め全vertical-slice normal unitがMASTER可能

## Ticket lifecycle

- [x] daily未完了 + carried ticket => new battle拒否
- [x] ticket TTL = 7 days
- [x] day+6 valid / day+7 expired
- [x] nearest-expiry first
- [x] start reserve / activeBattle stores source
- [x] reload preserves activeBattle
- [x] loss refunds once
- [x] explicit quit refunds once
- [x] win keeps consumed
- [x] capture success keeps consumed
- [x] legacy integer ticket migration

## Capture / rings

- [x] 4 inventory types
- [x] star < silver <= gold
- [x] rainbow 100%, worst RNG capture succeeds
- [x] non-rainbow <= 92%
- [x] max 3 attempts
- [x] failed capture gives enemy turn
- [x] daily grants star+3
- [x] extra 3 correct grants star+1
- [x] unit MASTER grants silver+1
- [x] hard MASTER grants gold+1
- [x] rings have no TTL logic

## Evolution / data

- [x] real master includes level
- [x] real master includes stone
- [x] real master includes held_item_level
- [x] stone inventory → evolution → consumed
- [x] held item inventory → equip → level evolution → item remains equipped
- [x] unknown species save fails closed

## Kids Quest snapshot

- [x] exact source SHA retained
- [x] relative imports resolve
- [x] SRS/difficulty delegated to snapshot
- [x] game-specific battle/monster/weapon content not copied

## Design traceability

- [x] `design/` included
- [x] SHA-256 manifest included
- [x] Star Awakening explicitly not adopted
- [x] known Giga/Burst rules not mislabeled unresolved

## CI gate

- [x] local `node --test tests/*.test.js` = 52/52 PASS before push
- [x] GitHub Actions Test — run #38 SUCCESS
- [x] GitHub Actions Build — run #38 SUCCESS
