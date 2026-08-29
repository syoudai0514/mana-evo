# ManaEvo CURRENT — Acceptance / Test Contract

Updated: 2026-08-29  
Status: **CURRENT NORMATIVE BEHAVIORAL ACCEPTANCE CONTRACT**  
Owner: cross-domain release acceptance / regression classification

This document defines the behavioral gates a ManaEvo change must satisfy. It does not make tests, runtime code, PR descriptions, or historical review documents product authority.

## 0. Authority and ownership

Apply authority in this order:

1. explicit user decisions;
2. immutable FINAL-CORRECTED baseline;
3. approved later changes recorded in `design/rebuild/DECISION-LOG.md`;
4. owning `design/current/**` contract;
5. data master;
6. runtime implementation;
7. tests / review history.

This contract must be read together with the owning domain contracts. It summarizes release-level acceptance; it must not silently redefine domain semantics.

Current decisions that materially supersede the original W-108 snapshot include:

- D-016 — validated CANDIDATE art may be progressively production-visible without becoming FORMAL;
- D-017 — child-facing capture devices are ほし/ぎん/きん/にじボール and use throw → contain → temporal four-star → result presentation;
- D-018 — family account, stable profiles, cloud snapshot, conflict/backup/test-mode model;
- D-019 — Vercel is the only production canonical host;
- D-020 — Evolution pacing V5 Battle XP distribution and capture-level buffer;
- D-021 — cloud conflict resolution is Parent-owned, not child gameplay responsibility;
- D-022 — Battle V6 study-first pacing, played-ticket cost, fair-fight scaling, damage tuning, level-gap XP, post-KO capture and new world bands;
- D-023 — protected product changes must keep CURRENT + Decision Log synchronized in the same PR/change set;
- D-026 — A+ semantic extra-ticket qualification plus Battle V6 production-review conformance corrections;
- D-027 — Parent authentication explicitly separates ManaEvo email/password from Google OAuth and preserves cloud ownership across safe verified-email identity linking.

If this file conflicts with a more specific owning CURRENT contract, the owning contract plus later Decision Log entry wins. Fix this file in the same canonical-sync change; do not let the contradiction remain indefinitely.

---

# 1. Test policy

## 1.1 Three test layers

1. **CANONICAL GATE** — approved product behavior. Release-blocking.
2. **TUNING GATE** — currently approved/tuned numeric defaults whose values may later move through an explicit tuning change.
3. **IMPLEMENTATION GUARD** — useful internal regressions that may not redefine product behavior.

A test does not become canonical merely because it existed first.

## 1.2 Observable acceptance

Prefer assertions on:

- user-visible state and navigation;
- allowed/blocked actions;
- persisted learning/game/cloud state;
- reward/ticket/XP settlement;
- stable IDs/master invariants;
- exact production host / PWA behavior;
- actual image/art resolution state;
- browser layout and interaction at supported iPhone widths.

CSS selector names, class names, source regexes, stylesheet import order, cache-version literals and component file structure are not product acceptance by themselves.

## 1.3 Determinism / exactly-once

Random systems use deterministic seeds/boundary injection in tests. Reward settlement, ticket settlement, capture, migrations, save conflict resolution, boss snapshots, unlocks and promotions must be idempotent across render/reload/retry boundaries.

---

# 2. Learning → game reward acceptance

## AC-LRN-001 — Kids Quest remains learning authority

The active child learning flow uses the migrated Kids Quest learning source. ManaEvo may observe learning events and award game rewards, but must not independently replace grade/domain/unit generation, mastery, SRS/review, mistakes, `わからない`, star trial, ahead-learning or stable learning IDs.

`src/study/**` must not silently become a second active learning authority.

## AC-LRN-002 — Daily core completion

On the first transition to all required daily core tasks complete for that day, grant exactly once:

- battle ticket `+3`;
- ほしボール resource (`star` key) `+3`;
- exploration points `+2`.

Reopen/reload/replay must not repeat this package.

## AC-LRN-003 — Additional study is study-first

After daily core completion, qualifying `extra` correct answers are cumulative for the Battle V6/A+ ticket rule:

- **every 5 A+ semantic qualifying extra correct answers → battle ticket +1**;
- only `extra` can advance that ticket bucket; `free` and `okawari` contribute `0` to battle-ticket progress;
- due SRS and genuine later reinforcement retrieval can qualify as ordinary `1`;
- mastered non-due repetition, revealed-answer immediate retry, miss/`わからない`, and duplicate semantic events contribute `0`;
- within the specific 5-answer set composing one ticket, one `knowledgeId` may occupy at most `3` places;
- no minimum-time, difficulty, challenge, speed, hint-use or recovery multiplier exists;
- the earlier D-006 reward **every 3 correct additional-learning answers → star resource +1** remains independent;
- legitimate extra correct answers continue to produce their approved exploration progress signal;
- unit MASTER / hard MASTER rewards remain owned by the learning/reward contract.

The old per-extra-question `ticket +1`, raw-any-5-correct interpretation, and rejected 20-second hard gate are not CURRENT.

## AC-LRN-004 — Reward bridge is idempotent

A semantic learning completion/question milestone has a stable completion identity. Reloading or receiving the same event twice cannot duplicate tickets, capture items, exploration progress or mastery rewards.

## AC-LRN-005 — Presentation provenance is authoritative

Ticket semantics are fixed when the question is presented, not reconstructed after the answer from mutated state. Regression coverage must verify stable `learningIntent` (`adaptive`, `srs_due`, `reinforcement`, `revealed_retry`), `knowledgeId`, question instance identity, reinforcement origin identity and stable reward-event identity across rerender/reload/profile boundaries.

A same-knowledge answer rejected by the 3/5 ticket-bucket cap still updates normal Kids Quest learning/non-ticket rewards and cannot be replayed after the bucket resets to become ticket progress later.

---

# 3. Ticket / Battle lifecycle acceptance

## AC-TKT-001 — Seven-day FEFO lots

Ticket grants retain dated lots and expire under the seven-day rule. FEFO chooses the nearest-expiry usable lot. Day rollover must not zero every ticket.

## AC-TKT-002 — Battle start reserves exactly one

A new battle requires the approved daily-learning gate, unlocked target, valid team and one usable ticket. Starting creates one persisted battle/reservation. Reload/render/re-entry cannot reserve a second ticket for the same battle.

## AC-TKT-003 — Played outcomes consume the ticket

Battle V6 supersedes the old loss/abandon refund rule.

The reservation is committed/consumed exactly once on:

- victory;
- successful live capture;
- loss after the battle was played;
- explicit voluntary abandon/leave.

A stale test expecting defeat or explicit abandon to return a playable ticket is invalid.

## AC-TKT-004 — Technical interruption is not abandon

Reload, crash, Safari/PWA termination and equivalent technical interruption resume the same persisted `activeBattle`. They do not reserve, consume or refund another ticket merely because the process restarted.

## AC-TKT-005 — Terminal settlement is path-independent

A terminal result reached through a move, Protect, switch, failed capture response, status/end-turn damage or other legal action path must converge on the same authoritative battle/ticket/reward settlement. UI action path must not change accounting semantics.

---

# 4. Battle V6 acceptance

Detailed mechanics are owned by `02-BATTLE-TICKETS-BALANCE.md`.

## AC-BTL-001 — Damage constants

Current Battle V6 tuning:

- STAB = `1.25`;
- critical chance = `1/16`;
- critical multiplier = `1.35`;
- damage random multiplier = `0.92..1.00`;
- type immunity still produces zero damage.

Deterministic unit tests must cover lower/upper random boundaries and critical/non-critical branches.

## AC-BTL-002 — Weak bench cannot trivialize normal enemies

Normal encounter reference power is anchored to the monster actually entering first and the strongest other current-team support. The active battler is an absolute floor:

`normalReferencePower = max(activePower, 0.70*activePower + 0.30*strongestSupportPower)`.

A high-level carry paired with low-level reserves must never lower the reference below active-only power.

## AC-BTL-003 — Boss scaling preserves rematch growth

Boss first-normal-encounter snapshot remains authoritative for ordinary rematches. Challenge rematch may rescale separately. Balance-version replacement is persisted once and then re-locked; repeated normal rematches must not continuously chase current player growth.

## AC-BTL-004 — Battle XP pacing V5 + V6

The encounter reward pool remains the reporting source, but settlement follows D-020/D-022/D-026:

- active battler receives 40% of the legacy pool;
- other eligible teammates receive 40% of that active amount (16% of legacy pool before later modifiers, subject to established rounding);
- level-gap multiplier is applied per recipient **before `gainXp` / evolution processing**, using the recipient's pre-settlement level;
- the same level-gap policy applies to KO victory, pre-KO capture, duplicate pre-KO capture and evolution-crossing settlements;
- post-KO capture gives no second Battle XP;
- high-level farming of much weaker enemies is throttled;
- fighting meaningfully stronger enemies may receive the approved positive multiplier;
- loss/abandon grants no victory XP;
- settlement is exactly-once.

Current level-gap multipliers are:

- player `>=15` levels above enemy → `0.15`;
- `>=10` above → `0.25`;
- `>=6` above → `0.50`;
- enemy `>=3` levels above player → `1.15`;
- enemy `>=5` levels above player → `1.25`;
- otherwise `1.00`.

## AC-BTL-005 — Turn/KO presentation gates input

When an action resolves, HP change, move/KO presentation and the next actionable CTA remain synchronized. The UI must not expose post-KO capture, result dismissal or another combat action before the authoritative turn/KO presentation has reached the corresponding state.

## AC-BTL-006 — End-turn KO settles immediately

If poison/burn or another canonical end-turn effect reduces enemy HP to zero during move, Protect, switch or failed-capture paths, terminal victory resolves in that same turn. A 0-HP enemy cannot remain `fighting` and act on the next turn.

---

# 5. Capture / duplicate acceptance

Detailed capture semantics are owned by `03-CAPTURE-DUPLICATES.md`.

## AC-CAP-001 — Stable capture keys and child-facing names

Stable domain keys remain:

- `star`;
- `silver`;
- `gold`;
- `rainbow`.

Child-facing names are:

- ほしボール;
- ぎんボール;
- きんボール;
- にじボール.

Old `○○のわ` child-facing copy must not be reintroduced by stale tests or docs.

## AC-CAP-002 — Probability / attempts

Current fixed boundaries:

- star ×1.00;
- silver ×1.20;
- gold ×1.50;
- rainbow guaranteed;
- non-rainbow final cap 92%;
- maximum three attempts for the whole battle.

Base-chance internals remain tuning/domain-owned unless separately promoted.

## AC-CAP-003 — Live capture window

While a normal capturable enemy is alive, ordinary capture requires enemy HP `<=50%`, remaining attempts and a usable selected capture item. A blocked attempt consumes neither item nor attempt.

## AC-CAP-004 — Post-KO wild capture

Battle V6 adds a second legal opportunity for ordinary capturable wild encounters after KO/win settlement.

Required invariants:

- boss/capture-disabled/special targets do not gain this path merely because HP reached zero;
- the same battle-wide max-three-attempt counter applies;
- the already-settled battle XP is **not awarded again** after post-KO capture success;
- the newly caught instance receives no retroactive XP from that battle;
- post-KO capture is not actionable before KO/turn presentation completes;
- current persisted `game.activeBattle` is authoritative; stale prior/same-battle snapshots are rejected side-effect-free;
- capture settlement/idempotency is checked before ball decrement, so replay cannot consume a second ball.

## AC-CAP-005 — Temporal ball presentation

One attempt presents one ManaEvo-original ball:

`throw → hit/contain → 1→2→3→4 star temporal confirmation → success close/GET or failure release`.

UI must present the already-decided domain result; it must not reroll probability. A test that merely finds four star DOM nodes is insufficient.

## AC-CAP-006 — Duplicate settlement

First catch adds the species/instance through the normal first-catch path. Second and later catches require the canonical choice:

- `なかまにする` → distinct instance;
- `おうえんにかえる` → no new instance, `そだちのかけら +1`.

Three growth shards grant the approved XP amount to one selected eligible monster exactly once. No capture may grant both duplicate branches.

## AC-CAP-007 — Capture evolution pacing buffer

When a captured species has a next level-based evolution threshold, capture initialization must preserve the D-020 minimum buffer: do not hand the child an already-near-instant next evolution solely because the wild enemy level exceeded that threshold. Current contract keeps at least five levels before the next level-evolution threshold where applicable.

---

# 6. Evolution / items / special-form acceptance

## AC-EVO-001 — Active transition integrity

Active scope remains No.001–238 / 83 families with the canonical 155 normal evolution transitions. Stable instance identity is preserved across evolution.

## AC-EVO-002 — Evolution methods

Level, consumable-item and held-item level-up evolution follow `04-EVOLUTION-ITEMS-SPECIAL-FORMS.md`. An implementation may not replace a held-item level-up trigger with an invented fixed level or consume an item twice on reload.

## AC-EVO-003 — Exploration/item acquisition

The approved exploration/pity system remains the canonical evolution-item acquisition system where owned by the evolution contract. A stale test may not re-establish dedicated transition trials as the sole source unless a later explicit decision says so.

## AC-EVO-004 — Evolution pacing

`08-EVOLUTION-PACING.md` and D-020 own current production pacing. Tests must verify the lower Battle XP distribution and capture-level buffer without rewriting existing save levels backwards.

## AC-FORM-001 — Giga/Burst sets and exclusivity

The active master keeps the canonical 12 Giga and 8 Burst eligible species with no overlap. One player battle cannot stack both systems.

## AC-FORM-002 — Form effects

Giga preserves the approved ×1.35 all-stat effect and HP-ratio conversion. Burst preserves approved HP ×2, attack ×1.2, three-turn duration and its canonical move replacement contract. Reversion preserves HP ratio and never revives a 0-HP monster.

---

# 7. World / progression acceptance

Detailed world rules are owned by `05-WORLD-PROGRESSION.md`.

## AC-WLD-001 — Source identity vs adventure placement

Monster source `area` remains master identity evidence and is not rewritten to match adventure placement. Adventure area/zone is a separate layer.

## AC-WLD-002 — Self-evolution-first progression

For applicable non-final evolved forms, first normal acquisition comes from own evolution; qualifying own evolution records `evolutionDiscoveries`; advanced wild access may unlock afterward. Final evolved forms remain unavailable as ordinary wild catches unless a later explicit rule says otherwise.

## AC-WLD-003 — Area/boss progression

Area1–4 remain sequential. Regional boss eligibility uses the approved per-area learning gate (`>=12` points and at least two distinct skills), not a stale five-wild-clear replacement. Earlier areas remain revisit-able.

## AC-WLD-004 — Battle V6 world recommendation bands

Current production bands are:

- Area1: 5–16; zones 5–8 / 9–12 / 13–16;
- Area2: 14–27; zones 14–18 / 19–23 / 24–27;
- Area3: 24–40; zones 24–29 / 30–35 / 36–40;
- Area4: 37–58; zones 37–44 / 45–51 / 52–58;
- EX: 55–100.

These are the current production tuning from D-022. A future tuning PR may change them only through the canonical-sync process; old W-105 bands must not silently return.

---

# 8. Save / profile / cloud acceptance

Detailed semantics are owned by `07-SAVE-PROFILES-PARENT-PWA.md` and D-018/D-021/D-027.

## AC-SAVE-001 — Account vs profile separation

A family Auth account may own multiple stable ManaEvo player profiles. Learning/game progress remains profile-specific. Device-selected current profile is device-local and one device must not steal another device's active selection.

## AC-SAVE-002 — Complete recoverable snapshot

Cloud persistence preserves the versioned profile registry plus each profile's learning state, game state and learning→game reward bridge required to continue play. Local storage remains offline/cache/unsynced continuity rather than being discarded.

## AC-SAVE-003 — Revision conflict is safe

A stale revision may not silently destroy newer progress. Compatible disjoint-profile changes may merge according to the save contract. Same-profile conflicting changes require Parent-owned resolution/backup rather than silent last-write-wins.

## AC-SAVE-004 — Child gameplay does not own cloud conflict UI

When logged in and playing normally:

- no persistent cloud/account conflict FAB is required in child gameplay;
- conflict detection does not automatically force a child-facing conflict modal;
- local progress can continue while attention is pending;
- overwrite/pull/resolve actions remain reachable through the protected Parent surface.

## AC-SAVE-005 — TEST isolation

TEST mode does not become a normal family profile/cloud revision. Entering test preserves the real local state, suppresses normal cloud writes as specified, visibly marks TEST, and exiting restores the preserved real state.

## AC-SAVE-006 — Migration / stable IDs

Migrations preserve stable player/species/instance/learning identities, are idempotent, and do not duplicate tickets, rewards, profiles or monsters. Adding later species must not reinterpret existing IDs by array position.

## AC-SAVE-007 — Parent authentication method is explicit and recoverable

Parent authentication must satisfy all of the following:

- email/password login labels the credential as a **ManaEvo/Supabase password**, not a Google account password;
- a Gmail address alone must never imply that the Google password belongs in ManaEvo's password field;
- Google OAuth is offered as a separate action only when the Supabase Google provider is actually enabled/configured;
- ManaEvo never receives, stores, proxies or validates the user's Google password;
- production Google OAuth returns through the approved Supabase callback/redirect flow to `https://mana-evo.vercel.app/`;
- when an existing verified-email Auth user later signs in through Google with the same verified email, safe identity linking preserves the existing Auth user UUID and therefore the existing `auth.uid()`-owned cloud save;
- an identity that cannot be safely linked must not be silently merged or used to create a second competing cloud-save owner merely from an email-string match;
- existing email/password login and password recovery remain usable after Google OAuth is introduced;
- provider-disabled state is explained as setup pending rather than routing the user into an `Invalid login credentials` trap with a Google password.

Regression evidence must cover provider capability detection, OAuth authorize URL/return URL, account-screen wording, session establishment/reuse, and cloud-owner continuity. Production enablement additionally requires provider configuration evidence; source code alone cannot manufacture Google OAuth credentials.

---

# 9. Monster master / art acceptance

## AC-ART-001 — Active scope

Active monster scope is exactly `m001`–`m238` / 83 families. `m239` remains immutable baseline/reference only and is absent from active dex, normal encounters and required active art scope.

## AC-ART-002 — Identity and visual provenance

Art production uses the rescued baseline visual briefs plus CURRENT description shards. Family continuity/originality/small-size readability rules in `09-MONSTER-MASTER-ART-SPEC.md` apply. Do not invent replacement identities from runtime filenames.

## AC-ART-003 — CANDIDATE ≠ FORMAL

Repository file existence, candidate QA PASS and production visibility do not create FORMAL approval. FORMAL requires explicit approval evidence.

## AC-ART-004 — Progressive production candidate visibility

D-016 permits validated candidates to render in normal production before FORMAL completion, but only by explicit per-species production allowlist/state. The runtime must not infer production eligibility merely from a successful file request, a number range or file extension.

Current main production overlay from PR #98 covers the explicit 184-species allowlist. W-306 electric, W-309 bug, W-313 poison, W-319 dark and m239 were excluded from that rollout until a later merge changes actual production state.

## AC-ART-005 — Replacement remains species-addressable

Replacing `mNNN` art must be one-species-addressable, preserve provenance/checksum evidence where the candidate pipeline requires it, and must not require unrelated manual mapping edits. A future generated production index may remove duplicated hand-maintained lists but must never auto-generate FORMAL approval.

---

# 10. Production host / PWA acceptance

## AC-PWA-001 — Vercel is the only production canonical host

Production canonical is exactly:

`https://mana-evo.vercel.app/`

GitHub remains source/PR/CI authority. GitHub Pages is not a second production authority.

## AC-PWA-002 — Root production identity

Production manifest/canonical/OG/Service Worker/app scope use the Vercel root production identity (`/`), not the old `/mana-evo/` GitHub Pages production base.

## AC-PWA-003 — Offline/update behavior

After a successful online load/install, supported PWA relaunch/update behavior must not strand a stale broken shell. Cache cleanup touches only ManaEvo-owned caches/data.

## AC-PWA-004 — Auth redirects

Production email confirmation, ManaEvo/Supabase password recovery, and Google OAuth return to the approved Vercel production origin. Preview redirect exceptions must never become canonical metadata/PWA identity. Provider secrets must not be placed in the browser bundle or source repository.

---

# 11. iPhone child-flow UI acceptance

Detailed UI ownership is in `06-UI-SCREEN-CONTRACT.md` / D-017 / D-021.

## AC-UI-001 — Supported mobile widths

Critical child journeys must be exercised at least at 390px portrait, with regression coverage for 375px and current wider iPhone-class 430px behavior where layout/safe-area changed.

## AC-UI-002 — Safe-area ownership

Focused Study, Battle, Capture, Evolution and Parent surfaces own safe top/bottom insets. Controls must not collide with status/Dynamic Island/home-indicator regions.

## AC-UI-003 — One dominant child decision

Normal Home/Study/Adventure/Monster screens keep one dominant decision. Home primary remains Study while daily learning is incomplete and Adventure after completion; evolution does not permanently steal Home primary.

## AC-UI-004 — Top-level scroll ownership

Home / Study / Adventure / Monster / HowTo maintain independent top-level scroll state. A destination must not inherit arbitrary scrollY from the previously open destination. Focused flows begin from their owned top position and return to the correct parent context.

## AC-UI-005 — Battle command clarity

Battle visually separates arena/current state/command deck. Japanese labels must not collapse into one- or two-character vertical fragments. Actionability follows the authoritative turn presentation state.

## AC-UI-006 — Capture focused flow

Capture presents ball choice/ease/recommendation/remaining attempts as the focused decision; exact percentage is secondary. The visual throw and temporal star result correspond to exactly one domain attempt.

## AC-UI-007 — Cloud conflict remains adult-owned

Normal child Home/Study/Adventure/Battle flow must not be obstructed by a cloud conflict resolver. Parent retains the protected management route.

---

# 12. Canonical synchronization acceptance

## AC-SYNC-001 — Protected product PR declares canonical impact

When a PR changes a protected runtime/art path mapped by `design/current/canonical-sync-map.json`, its body declares:

```text
Canonical-Impact: changed | none
Canonical-Domains: <domain,...>
Canonical-Reason: <concrete reason>
```

## AC-SYNC-002 — Behavior change updates authority in the same PR

For `Canonical-Impact: changed`:

- every declared owning CURRENT contract is changed in the same PR;
- `design/rebuild/DECISION-LOG.md` is changed in the same PR;
- the owner-facing `design/current/USER-GUIDE.md` is updated in the same product-change when child/product behavior changes;
- implementation/tests/generated state are updated as required;
- CI rejects missing synchronization.

## AC-SYNC-003 — No-impact claim is reviewable

For `Canonical-Impact: none`, a concrete reason is mandatory. CI may permit the declaration, but Reviewer must confirm the protected runtime change truly does not alter the contract.

## AC-SYNC-004 — Machine-readable metadata is not gameplay authority

`canonical-sync-map.json` is process ownership metadata. It cannot be used to invent gameplay rules or approval state.

---

# 13. Release gate

A release/merge claiming current canonical alignment requires, as applicable:

1. `npm test`;
2. `npm run build`;
3. `npm run verify:release`;
4. WebKit E2E / child-flow coverage including relevant 375/390/430 cases;
5. deterministic tests for changed reward/battle/capture/random boundaries;
6. save/reload/idempotency coverage for changed settlement/migration boundaries;
7. active master guard: exactly 238 active species, m239 excluded from active scope but retained in baseline;
8. art scope/integrity checks when image assets or production art eligibility changed;
9. canonical-sync CI gate for protected product changes;
10. owner-facing `USER-GUIDE.md` updated and shown before merge for product-design changes;
11. when Parent Auth changes, provider capability/redirect/session/credential-boundary tests and production provider-configuration evidence where the provider is being enabled;
12. concrete tangible evidence for any manual/visual/device acceptance claimed by the Work Item.

CI PASS alone does not prove specification correctness. Final review must compare the actual changed behavior and tangible artifacts against the owning CURRENT contract and Decision Log.

---

# 14. Stale-test prohibition

The following historical assertions are specifically superseded and must not be resurrected as product truth:

- extra question `ticket +1` per clear — superseded by D-022/D-026 `5 A+ qualifying correct → ticket +1`;
- raw “any five additional correct” including `free`/`okawari` — invalid under D-026;
- hard 20-second per-ticket reward gate from unmerged Draft #111 — **never CURRENT** and explicitly rejected by the independent A+ design review;
- weighted Learning Value multipliers — rejected by the A+ design review and never CURRENT;
- loss/explicit abandon refund — superseded by D-022 played-ticket commit;
- STAB 1.5 / crit 1.5 / random 0.90–1.00 — superseded by Battle V6 values;
- old Area1–4/EX recommendation bands — superseded by D-022 bands;
- capture child-facing `○○のわ` — superseded by D-017 ball naming/presentation;
- capture only while enemy alive — superseded by D-022 post-KO ordinary-wild opportunity;
- GitHub Pages `/mana-evo/` as production canonical — superseded by D-019;
- cloud conflict resolver as child-flow responsibility — superseded by D-021;
- email/password as the only possible Parent Auth method — superseded by D-027; email/ManaEvo-password remains valid but Google OAuth may coexist when configured;
- CANDIDATE forbidden from normal production gameplay in all cases — superseded within D-016's explicit allowlist scope;
- Work Item/PR/CI completion text as sufficient Acceptance evidence — prohibited by D-015.

If an existing test still asserts one of these, update or reclassify that test; do not roll production backward merely to make the stale test pass.

---

# 15. D-026 focused regression matrix

Release is blocked unless automated or equivalent deterministic evidence covers at least:

### Learning A+
- 5 qualifying `extra` answers across a valid composition mint exactly one ticket;
- four answers from one `knowledgeId` do not occupy four places in the same ticket bucket; the fourth still updates ordinary learning/non-ticket accounting;
- after a ticket completes, the next bucket is fresh; the rule is **per ticket**, not a sliding last-five window;
- an event rejected by the 3/5 guard cannot be replayed later to count after bucket reset;
- `free 4 + extra 1` and analogous `okawari` mixtures do not mint a ticket;
- due SRS and genuine reinforcement can qualify; mastered non-due and `revealed_retry` do not;
- genuine fast correct is not time-gated;
- semantic event replay/reload does not double-count;
- profile isolation/cloud roundtrip preserves partial bucket and semantic IDs without cross-profile leakage.

### Battle/capture conformance
- Lv30 active + Lv5 bench reference is not below active-only;
- KO and pre-KO capture use the same recipient level-gap XP ordering;
- player `+6/+10/+15` and enemy `+3/+5` bands remain correct;
- evolution crossing cannot bypass level-gap scaling;
- Protect/switch/failed-capture end-turn DOT enemy KO settles immediately;
- stale post-KO snapshots cannot consume a ball or rewrite authoritative `activeBattle`;
- post-KO success gives no second XP;
- loss/abandon exact reservation, FEFO and expiration behavior remain unchanged.

---

# 16. D-027 focused Parent Auth regression matrix

Release of the Parent Auth change is blocked unless evidence covers at least:

- Google authorize URL uses the configured Supabase origin, `provider=google`, and the intended ManaEvo return URL;
- unsupported OAuth provider names are not accepted by the ManaEvo auth bridge;
- account UI visibly separates `Googleでログイン` from `メールでログイン`;
- email credential is labeled `ManaEvo用パスワード` and explicitly warns not to enter a Google account password;
- provider capability is checked before Google login is actionable;
- provider-disabled state remains usable through existing email/password recovery and does not pretend Google is enabled;
- after Google provider configuration, a same verified-email existing account resolves to the same Auth user UUID/cloud owner before production completion is claimed;
- OAuth callback/session persistence reaches the same cloud-save ownership/RLS boundary as email/password login;
- no Google Client Secret/service-role secret is present in source, generated browser assets, or user-entered ManaEvo fields.
