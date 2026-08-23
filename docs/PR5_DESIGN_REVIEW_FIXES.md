# PR #5 design-led review fixes — 2026-08-23

Source review: `mana-evo-pr5-design-led-rereview-20260823`
Target: PR #5

## User-approved decisions

- Ticket: start reserves one; **loss and explicit quit refund**; win/capture keep it consumed; technical interruption resumes.
- Ring config: star 1.00 / silver 1.20 / gold 1.50 / rainbow 100%; non-rainbow cap 92%.
- Learning rings: daily +3 star; every 3 extra correct +1 star; unit MASTER +1 silver; hard MASTER +1 gold.

## P0 fixes

1. Wrong answer + explanation acknowledgement alone no longer completes a daily requirement. A correct retry is required. If fast-wrong behavior marked the session suspicious, a separate reinforcement question must also be answered correctly.
2. Carried tickets cannot open a new battle until the current day's baseline five questions are complete. This gate exists in the domain `startBattle`, not UI only.

## P1 fixes

1. Battle tickets are date-granted inventory with 7-day TTL; nearest expiry is consumed first. Legacy integer saves migrate safely.
2. Four rings use different capture performance; rainbow is guaranteed; non-rainbow max is 92%.
3. Learning now grants rings through the reward domain.
4. Real playable species/stages now include level, stone and held-item+level evolution. Stage rewards supply the actual evolution items; detail UI exposes inventory/equip/evolve.
5. Documentation no longer calls known Giga/Burst/ring rules unresolved. `design/` is included as the review baseline with SHA-256 metadata.

## Ticket lifecycle details

- `startBattle`: consumes nearest-expiry grant and records `ticketSource` in `activeBattle`.
- `lost`: refunds at most once using `ticketRefunded`.
- `abandonBattle`: refunds at most once.
- `won` / `caught`: no refund.
- reload: `activeBattle` survives; no second consume.

## Verification

Acceptance tests include:

- fast/wrong taps cannot unlock reward
- acknowledgement-only cannot complete
- remediation correct retry
- suspicious reinforcement
- carried-ticket daily gate
- TTL day 6/day 7 and nearest-expiry
- loss refund / explicit quit refund / win consumes / capture consumes
- ring ordering and rainbow worst-RNG guarantee
- learning ring economy
- real stone and held-item E2E evolution
- snapshot import integrity, SRS, difficulty, MASTER and save migration
