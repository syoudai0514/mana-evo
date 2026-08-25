# ManaEvo CURRENT — Save / Profiles / Parent / PWA

Status: **CURRENT canonical candidate (W-107)**  
Phase: Rebuild Phase 2 / canonicalization  
Scope: Save ownership, profiles, Parent controls, Kids Quest isolation/import, migrations, GitHub Pages/PWA, monster-asset cache/versioning

## 0. Authority and scope

This document is the CURRENT platform contract for ManaEvo save/profile/Parent/PWA behavior.

Authority order follows `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md`:

1. explicit user decisions
2. exact `design/baseline/FINAL-CORRECTED/source/`
3. later changes with confirmed approval
4. CURRENT canonical documents
5. data master
6. runtime implementation
7. review/completion history

Primary evidence for this document:

- `design/baseline/FINAL-CORRECTED/source/10-BRAND-AND-REPOSITORY-SPEC.md`
- `design/baseline/FINAL-CORRECTED/source/12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`
- `design/baseline/FINAL-CORRECTED/source/13-EXECUTION-FLOW.md`
- `design/baseline/FINAL-CORRECTED/source/99-IMPLEMENTATION-REVIEW-CHECKLIST.md`
- `design/rebuild/DECISION-LOG.md` D-001, D-002, D-005, D-013, D-014
- `design/rebuild/audit/ui-architecture-audit.md`

Runtime files named later in this document are **observations only**. They do not outrank the evidence above.

W-107 is documentation/canonicalization only. It does **not** modify deployment, runtime, `src/**`, `tests/**`, the exact baseline, or another Work Item's output.

---

## 1. Application boundary: ManaEvo and Kids Quest are separate apps

ManaEvo and Kids Quest must coexist as independent applications.

| Concern | ManaEvo | Kids Quest |
|---|---|---|
| Repository | `syoudai0514/mana-evo` | `syoudai0514/kids-quest` |
| Write authority | ManaEvo writes only here | **read-only source** from ManaEvo work |
| Production path | `/mana-evo/` | `/kids-quest/` |
| Normal save writes | ManaEvo-owned namespace only | ManaEvo must not write |
| IndexedDB | ManaEvo-owned stores/databases only | ManaEvo must not modify/delete |
| Cache Storage | ManaEvo-owned cache names only | ManaEvo must not modify/delete |
| Service Worker | scope limited to ManaEvo path | independent Kids Quest scope |
| Progress relationship | optional one-way import | source remains unchanged |

A shared GitHub Pages origin does not make the two apps one save domain. No reset, migration, cache cleanup, Service Worker activation, or backup operation in ManaEvo may mutate Kids Quest state.

The following are prohibited:

- using a Kids Quest localStorage key or IndexedDB store as ManaEvo's normal write target
- deleting or rewriting Kids Quest data during ManaEvo reset/migration
- deleting Kids Quest caches during ManaEvo Service Worker activation
- widening ManaEvo Service Worker scope to cover `/kids-quest/`
- live two-way synchronization between the apps
- importing Kids Quest game-specific monster/battle state without a separately approved safe mapping

---

## 2. Save ownership model

### 2.1 Top-level ownership

ManaEvo save data is organized around a **profile registry + active profile + per-profile learning/game state**.

The implementation may choose the physical envelope layout, but it must preserve these logical ownership boundaries:

### Application/device-level ManaEvo state

This level owns only information that is not one child's learning/game progress, including:

- profile registry / stable profile IDs
- active profile selection
- save-format and migration metadata
- one-way Kids Quest import marker/version metadata
- Parent gate/PIN lock metadata
- ManaEvo cache/schema/version metadata needed for safe loading/updating

Parent PIN is a local guard against child mis-operation, not a child progression value. It must not be used as a key that mixes or selects learning/game data.

### Per-profile learning state

Learning state follows the Kids Quest learning source-of-truth boundary in D-005 and `12-KIDS-QUEST-LEARNING-IMPORT-SPEC.md`. At minimum the profile relationship must preserve the source schema's ownership for:

- current/selectable grade and ahead-learning progression
- learning mastery / unit progress
- SRS / review state / mistake tracking
- star-trial / promotion-related learning state
- English learning progress
- streak/history/daily learning state
- learning settings carried by the imported Kids Quest schema

ManaEvo must not redesign these structures merely to simplify profile storage.

### Per-profile game state

All game progression belongs to the same child profile identity as that child's learning state. This includes, as applicable under the other CURRENT game documents:

- tickets and ticket lifecycle state
- team / box / caught/dex progress
- XP / levels / individual monster state
- items / rings / evolution resources
- world/adventure location and progression
- boss/progression state
- evolution discoveries
- active encounter/battle continuation state
- other game progression owned by that child

W-107 does not redefine those domain rules; it defines **ownership**. A game state from profile A must never be silently paired with learning state from profile B.

### 2.2 Stable profile identity

A profile must have a stable ID independent of its display name.

Changing a displayed name, if supported by a later approved flow, must not create a new save identity or orphan the game envelope. No implementation may use the child's display name as the primary save key.

---

## 3. Profile switching contract

Profile creation/switching is an adult-controlled operation through Parent.

When switching from profile A to profile B:

1. persist/normalize the outgoing profile A learning state;
2. persist/normalize the outgoing profile A game state;
3. change the active profile ID;
4. load profile B learning state;
5. load profile B game state using the **same profile B ID**;
6. continue with no data copied between A and B unless an explicit import/create operation requires it.

Required invariants:

- switching A → B → A restores A's own learning and game progress;
- switching profiles does not duplicate tickets, XP, items, rewards, mastery, or profiles;
- a new profile begins from the approved fresh learning/game defaults rather than cloning the active child's progress;
- profile switching does not rewrite or delete Kids Quest source data;
- migration/import code must preserve stable profile IDs once created.

Profile deletion/rename policy is not defined by W-107 and must not be invented as part of implementing this contract.

---

## 4. Parent gate and adult-only ownership

### 4.1 Parent is a focused adult-only state

The Parent screen is not a normal child gameplay screen. Entry must pass an adult gate/PIN before adult-controlled settings can be changed.

The PIN exists to prevent accidental child changes on the device. The exact recovery challenge or visual treatment is an implementation detail unless a higher-authority source specifies it; runtime behavior alone does not create a permanent product rule.

### 4.2 Controls owned by Parent

The following are adult-only controls and must not be directly mutable from the normal child flow:

- **grade**: current learning grade selection within permitted bounds
- **ahead learning**: unlock/lower selectable grade range and related advance-learning control already defined by Kids Quest learning rules
- **difficulty**: normal/hard or equivalent Kids Quest learning-mode control
- **audio**: TTS/read-aloud, voice choice/download behavior, speech speed/volume, SFX and other imported learning audio settings
- **profile**: create/select/switch child profile
- **backup**: export/import ManaEvo learning/game progress

The learning semantics of grade/ahead/difficulty/audio remain governed by the Kids Quest learning source schema and behavior. ManaEvo may change the shell/branding, but must not silently redefine those learning rules.

Child screens may show read-only consequences such as the current grade or audio result, but may not expose unrestricted mutation of these Parent-owned settings.

### 4.3 Backup ownership

Backup/export/import is Parent-only.

A ManaEvo backup must preserve enough version/profile identity to restore learning and game state without pairing the wrong child's data. Combined backup formats must keep learning and game profile relationships intact.

Backup/import is not a route for writing back into Kids Quest. It writes only ManaEvo-owned storage.

The Parent PIN itself is app/device lock metadata, separate from per-profile learning/game progress. The baseline does not require PIN cloud transfer or PIN recovery through a progress backup; implementations must not invent such behavior as a requirement of W-107.

---

## 5. Optional Kids Quest progress import

Kids Quest progress import is **optional, one-way, read-only, and compatibility-gated**.

If compatible existing Kids Quest learning data is detected and import is offered/performed, the operation must satisfy all of the following:

1. read Kids Quest source data only;
2. copy compatible data into ManaEvo-owned storage;
3. record a ManaEvo-side import marker/version;
4. be idempotent — repeating the same import must not duplicate state or rewards;
5. never delete/update the Kids Quest source;
6. stop synchronizing after import — the two apps progress independently;
7. import only schema-compatible learning/profile/settings data;
8. do not automatically import Kids Quest monster/battle/game state without an approved mapping.

Preferred compatible learning data from the baseline specification includes:

- profile identity/name where safely compatible
- grade / selectable grade progression
- learning mastery
- SRS/review state
- English progress
- streak/history where compatible
- relevant learning settings

Import must not create side-effect rewards merely because old progress is being loaded. Running import/migration repeatedly must not create double XP, tickets, items, mastery records, or profiles.

The trigger UX for optional import is not fixed by W-107. Whatever UX is used, the data-direction and idempotency rules above are mandatory.

---

## 6. Save migrations and idempotency

### 6.1 Version every persisted schema that can evolve

ManaEvo save envelopes and import formats must carry an explicit format/schema version or equivalent migration discriminator.

A load path must be able to distinguish:

- current ManaEvo format;
- known older ManaEvo format(s);
- compatible one-way Kids Quest source data;
- unsupported/invalid input.

### 6.2 Migration rules

A migration must:

- preserve valid existing progress;
- preserve stable profile/monster/learning IDs where the canonical model requires stability;
- map legacy single-profile data to one profile deterministically, once;
- avoid granting gameplay rewards merely as a consequence of migration;
- write only ManaEvo-owned storage;
- leave Kids Quest storage/cache unchanged;
- produce the same logical CURRENT state if safely run again on already-migrated data.

Idempotency means, concretely:

- no duplicate profiles;
- no duplicate tickets/lots/reservations;
- no duplicate caught monsters/items/rewards;
- no duplicate mastery/SRS records;
- no repeated import bonus;
- no repeated legacy-to-current conversion.

The implementation should normalize/migrate first, then persist the CURRENT representation. Existing runtime migration code is evidence of implementation progress, not permission to weaken these invariants.

---

## 7. Official hosting authority: GitHub Pages

The official ManaEvo production host is **GitHub Pages**.

Canonical production URL:

`https://syoudai0514.github.io/mana-evo/`

Production base path:

`/mana-evo/`

Required hosting invariants:

- production Vite build base resolves to `/mana-evo/`;
- router/navigation, if a router is used, respects that base;
- JS/CSS chunks, dynamic imports, icons, fonts, audio and monster images resolve under the ManaEvo base rather than assuming `/`;
- canonical/OG metadata points to the GitHub Pages URL;
- manifest `id`, `start_url`, and `scope` identify the independent ManaEvo app and remain inside `/mana-evo/`;
- Service Worker registration URL and scope remain inside `/mana-evo/`;
- Kids Quest `/kids-quest/` is not redirected, replaced, stopped, or brought under ManaEvo's Service Worker.

Local development may use a tool-specific local root, but the production artifact must be correct when built for `/mana-evo/`.

---

## 8. PWA / manifest / Service Worker / offline contract

### 8.1 Manifest

ManaEvo must ship an independent PWA manifest with:

- ManaEvo branding (`マナエボ` / `ManaEvo`);
- ManaEvo-unique app identity;
- `start_url` and `scope` for the canonical `/mana-evo/` app;
- installable icons including required Apple/PWA icon assets used by the shipped HTML;
- no Kids Quest app identity or scope reuse.

### 8.2 Service Worker ownership

The ManaEvo Service Worker must:

- register from the ManaEvo base;
- control only the ManaEvo scope;
- ignore same-origin requests outside its app path;
- use ManaEvo-owned cache names/prefixes;
- delete only obsolete ManaEvo-owned caches during cleanup;
- never delete or rewrite Kids Quest caches.

### 8.3 Offline expectation

After a successful online install/visit sufficient to populate the required app shell, the PWA must be able to launch the ManaEvo shell offline and serve the assets intentionally covered by its offline strategy.

Offline fallback must stay within ManaEvo's app boundary. An offline failure must not fall through to or hijack Kids Quest paths.

### 8.4 Update expectation

A new ManaEvo deployment must be discoverable by installed PWAs. Updating the Service Worker/app shell must not require origin-wide cache deletion.

The update strategy must preserve both properties:

- **freshness after deployment**: installed clients can receive the newly deployed ManaEvo version;
- **offline continuity**: a previously valid cached app remains usable when the network is unavailable.

Opening `/kids-quest/` and `/mana-evo/` in separate tabs must not make either app's Service Worker/cache/storage corrupt the other.

---

## 9. Formal monster asset cache/versioning contract

This section defines the PWA-side requirement only. Monster identity/status/art approval belongs to W-109 and its asset manifest; W-107 does not approve images.

Phase 1.5 identified a concrete risk: current runtime uses cache-first behavior for `/monsters/`. Replacing an image at the same URL can therefore leave an installed PWA showing the old cached image.

CURRENT requirement:

1. every formal monster asset consumed by the PWA must have an explicit revision identity — for example a content digest, asset revision, versioned filename/URL, or equivalent manifest revision;
2. when an approved formal asset changes, either its effective cache key/URL changes **or** the Service Worker deterministically invalidates that changed asset;
3. merely overwriting bytes at the same cache-first URL without an invalidation/version rule is not acceptable;
4. candidate/placeholder/formal states must not share a cache identity in a way that lets an old placeholder/candidate permanently mask the later formal asset;
5. release/update verification must prove that an already-installed PWA receives the new formal art after the app update while still retaining a valid offline fallback;
6. monster cache cleanup remains ManaEvo-owned and must not touch Kids Quest caches.

W-109's monster asset manifest should supply the asset identity/status/revision data. W-107 consumes that data for caching/update behavior; it does not duplicate or edit W-109's output.

The exact technique (hashed filename, revision query, manifest digest, targeted cache eviction, or equivalent) is an implementation choice as long as these invariants hold.

---

## 10. Vercel status

Vercel is **not** the current hosting authority for ManaEvo.

Existing Vercel URLs, configuration, review notes, or previous deployment records are historical/supporting evidence only. They must not override:

- the GitHub Pages canonical URL;
- the `/mana-evo/` production base;
- the GitHub Pages deployment workflow;
- PWA manifest/SW identity tied to the GitHub Pages app.

Current repository evidence includes a `vercel.json` with Vercel Git deployment disabled. W-107 does not delete historical Vercel references; it classifies them as non-authoritative for CURRENT hosting.

---

## 11. Current runtime observations / implementation deltas

These observations help a later implementation worker locate existing reusable behavior. They are not the reason the rules above are canonical.

| Area | Current observation | Canonical assessment |
|---|---|---|
| Learning save | `src/kids-quest-study/engine/storage.js` writes a ManaEvo-specific learning key and has versioned export/import | useful foundation; must continue Kids Quest isolation/idempotency |
| Profiles | `src/kids-quest-study/state/GameContext.jsx` stores profile snapshots and switches by stable profile ID | direction aligns with per-profile learning ownership |
| Game save | `src/game/saveStore.js` stores a `gameByProfile` envelope and migrates an older game format | direction aligns; migration must remain idempotent and profile-safe |
| Parent gate | `src/parent/ParentGate.jsx` currently uses a device-local 4-digit PIN plus an adult check | gate/PIN direction aligns; exact arithmetic recovery challenge is not promoted to product canonical by runtime alone |
| Parent controls | current Parent UI owns grade/ahead/difficulty/audio/profile/backup controls | aligns with W-107 ownership; learning semantics remain Kids Quest-authoritative |
| GitHub Pages base | Pages workflow builds with `VITE_BASE_PATH=/mana-evo/` | aligns with canonical production base |
| Manifest | current manifest pins `id/start_url/scope` to the GitHub Pages app URL | aligns with hosting/PWA contract |
| Service Worker | current SW uses a ManaEvo cache prefix and ignores paths outside its base | aligns with isolation contract |
| Monster images | current SW caches `monsters/` cache-first | **follow-up implementation must add/verify formal asset revision invalidation contract** |
| Vercel | current `vercel.json` disables Git deployment | consistent with Vercel being historical/non-authoritative |

A dedicated Kids Quest legacy-progress import path must not be claimed complete merely because ManaEvo backup import exists. The implementation phase must verify the baseline one-way source-read contract explicitly before acceptance.

---

## 12. Cross-document interfaces

W-107 owns platform/save boundaries and references other Work Items without editing them:

- **W-101 / Learning & rewards**: learning semantics and reward bridge; W-107 stores the learning state per profile without redefining it.
- **W-102 / Battle & tickets**: active battle/ticket lifecycle belongs to the profile's game state; W-107 ensures persistence/isolation only.
- **W-103 / Capture**: caught/duplicate outcomes belong to profile game state; capture rules are not redefined here.
- **W-104 / Evolution**: item/evolution state belongs to profile game state; evolution rules are not redefined here.
- **W-105 / World**: adventure location/progression belongs to profile game state; world rules are not redefined here.
- **W-106 / UI contract**: Parent is a focused adult-only screen; W-107 defines its data/control ownership.
- **W-108 / Acceptance contract**: should turn the invariants below into behavioral tests.
- **W-109 / Monster art**: provides formal asset identity/status/revision input consumed by W-107 cache/update behavior.

---

## 13. Behavioral acceptance for later implementation

A later implementation can claim W-107 platform alignment only when all applicable checks below pass:

### Profiles / Parent

- [ ] every learning/game save can be attributed to one stable profile ID;
- [ ] switching A → B → A restores each child's own learning **and** game state without leakage;
- [ ] profile switching/creation does not duplicate rewards or progress;
- [ ] grade/ahead/difficulty/audio/profile/backup mutations are Parent-owned;
- [ ] Parent setting mutation requires the adult gate/PIN;
- [ ] child flow cannot silently bypass the Parent-owned controls.

### Kids Quest isolation/import

- [ ] normal ManaEvo operation writes only ManaEvo-owned storage;
- [ ] ManaEvo reset/delete leaves Kids Quest localStorage/IndexedDB/cache unchanged;
- [ ] optional Kids Quest import reads source only and copies only compatible progress;
- [ ] the same import can run twice without duplication;
- [ ] no live sync begins after import;
- [ ] old Kids Quest monster/battle state is not auto-imported without an approved mapping.

### Migrations / backup

- [ ] CURRENT and supported legacy formats are version-discriminated;
- [ ] running migration twice produces the same logical CURRENT result;
- [ ] legacy migration does not duplicate profile/ticket/XP/item/mastery data;
- [ ] backup restore keeps learning/game state paired with the correct profile;
- [ ] backup/import does not write to Kids Quest storage.

### Hosting / PWA

- [ ] official production URL is `https://syoudai0514.github.io/mana-evo/`;
- [ ] production build works under `/mana-evo/` with no root-path asset breakage;
- [ ] manifest `id/start_url/scope` identify ManaEvo and stay inside `/mana-evo/`;
- [ ] Service Worker scope/cache cleanup is ManaEvo-only;
- [ ] installed ManaEvo launches offline after required shell caching;
- [ ] an installed client can receive a later deployment without clearing the entire origin;
- [ ] Kids Quest `/kids-quest/` remains operational and unaffected.

### Formal monster assets

- [ ] formal art has a revision identity consumed by PWA caching;
- [ ] replacing formal art cannot remain permanently hidden behind an old cache-first response;
- [ ] placeholder/candidate cache entries cannot mask later formal art under an unchanged immutable identity;
- [ ] installed-PWA update verification confirms the latest approved formal asset is shown after update;
- [ ] offline mode still has a valid previously cached asset when the network is unavailable.

### Hosting authority

- [ ] no Vercel URL/config is treated as CURRENT production authority;
- [ ] GitHub Pages deployment/configuration remains the canonical production path.

---

## 14. Non-decisions / do not invent

W-107 does not create new product rules for:

- profile deletion or rename UX;
- cloud accounts/cloud synchronization;
- encrypted/cloud PIN recovery;
- the exact adult-check puzzle used for PIN reset;
- a new Kids Quest ↔ ManaEvo live-sync model;
- automatic mapping of Kids Quest game monsters/battles into ManaEvo;
- a specific hashed-filename technology for monster art.

If a later implementation requires one of these as a product decision rather than a technical detail, recover approved evidence first; otherwise escalate it instead of silently inventing behavior.
