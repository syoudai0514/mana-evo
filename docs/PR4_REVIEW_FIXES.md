# PR4 review fixes

Source review: `mana-evo-pr4-review-20260823`
Implementation PR: `#5 fix: PR4レビュー P0/P1対応`
Review commit: `15357479412d1c624c2b87ccd7ab64bbfa069afb`

## Fixed P0

- Daily baseline can no longer be bypassed through free study. Free-study correct answers grant no battle ticket until the daily five-subject baseline is complete.
- Five wrong taps no longer complete daily learning or grant three tickets. A miss requires the explanation/remediation acknowledgement before that learning item is complete; the miss remains recorded as a miss.
- Very fast wrong answers are recorded (`fastWrong`) and can mark the daily session `suspicious`; this does not itself punish the child or award completion.

## Fixed P1

- Daily question IDs and completed IDs are persisted, so quit/reload resumes the same five-subject requirements.
- Unit mastery now derives the required item variety from actual unit content, so one-item units are reachable while multi-item units keep the variety gate.
- Due SRS items are prioritized during selection.
- Kids Quest difficulty skill now affects daily/free question selection.
- The copied Kids Quest learning snapshot keeps its original UI source and resolves all relative imports through learning-only compatibility shims. No Kids Quest battle/monster/weapon content was copied.
- Battle HP is stored per team member. Switching no longer heals; fainted members cannot be switched in.
- Battle lifecycle is explicit: one ticket is committed when battle starts; `activeBattle` is persisted and resumed after reload; defeat or explicit quit consumes that started battle.
- A healthy teammate keeps battle alive after the active monster faints and requires a forced switch.
- Capture inventory has four `わ` types and a hard maximum of three throws per battle. Failed throws consume a turn and allow the enemy to act.
- Normal evolution is data driven and supports `level`, `stone`, and `held_item_level` condition types.
- Giga/Burst persistence uses permanent ownership data (`gigaKeyOwned`, `gigaCoreSpecies`, `burstMarks`) rather than consumable global counters.
- Unknown/removed species in saves are discarded during normalization instead of crashing later rendering.

## Verification

- Local: `node --test tests/*.test.js` = 38/38 PASS.
- GitHub Actions PR #5 run #36: Install dependencies / Test / Build = all SUCCESS.

## Still intentionally unresolved / next review targets

1. Exact acquisition conditions for `ギガキー`, species `ギガコア`, and `キョダイバースト` marks.
2. Balance differences among the four capture-ring types. Inventory/types and the three-throw lifecycle exist, but different success multipliers are not invented yet.
3. Full all-grade Kids Quest content/UI connection into Mana Evo. The snapshot is present and import paths are closed, but all screens are not yet routed from the current vertical-slice UI.
4. Final character names/art are placeholders and stay independent from `speciesId`.
5. PWA/offline installation polish, unified TTS runtime, device E2E and lockfile reproducibility remain P2 work.

Do not merge solely on this note: external re-review GO is required before `main` merge.

---

## Superseded note — 2026-08-23

The earlier ticket sentence in this document (`defeat or explicit quit consumes`) is superseded by the user's later explicit decision:

- defeat => refund one reserved ticket
- explicit quit/escape => refund one reserved ticket
- win/capture => consume
- technical interruption => resume active battle

Current authoritative implementation note: `docs/PR5_DESIGN_REVIEW_FIXES.md` and `design/`.
