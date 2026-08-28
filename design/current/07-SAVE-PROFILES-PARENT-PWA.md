# ManaEvo CURRENT — Save / Profiles / Parent / Cloud / PWA

Status: **CURRENT normative contract (W-107 + D-018 + D-019 normalization)**  
Phase: Rebuild / platform normalization  
Scope: save ownership, profiles, Parent controls, Kids Quest isolation/import, cloud persistence, backups, migrations, test-mode isolation, Vercel production/PWA, monster-asset cache/versioning

## 0. Authority and scope

This document is the CURRENT platform contract for ManaEvo save/profile/Parent/cloud/PWA behavior.

Authority order follows `REBUILD-START-HERE.md` and `design/rebuild/DECISION-LOG.md`:

1. explicit user decisions;
2. exact `design/baseline/FINAL-CORRECTED/source/`;
3. approved later changes;
4. CURRENT canonical documents;
5. data master;
6. runtime implementation;
7. review/completion history.

This normalization incorporates the later explicit decisions in **D-018** (shared account/cloud save/test data) and **D-019** (Vercel as the sole production canonical host). Those decisions supersede the earlier W-107 GitHub Pages/local-only assumptions where they conflict.

Runtime files named later are implementation evidence. They do not outrank the contract.

---

## 1. Application boundary: ManaEvo and Kids Quest remain separate apps

ManaEvo and Kids Quest are independent applications and save domains.

| Concern | ManaEvo | Kids Quest |
|---|---|---|
| Repository | `syoudai0514/mana-evo` | `syoudai0514/kids-quest` |
| Write authority | ManaEvo writes only ManaEvo-owned local/cloud state | read-only source from ManaEvo work |
| Production authority | Vercel ManaEvo project | independently owned by Kids Quest |
| Normal save writes | ManaEvo-owned namespace + ManaEvo `app_id` cloud rows | ManaEvo must not write |
| IndexedDB/localStorage | ManaEvo-owned keys/stores only | ManaEvo must not modify/delete |
| Cache Storage/SW | ManaEvo Vercel origin and ManaEvo cache prefix | independent Kids Quest scope |
| Progress relationship | optional one-way import | source remains unchanged |

The apps no longer need to share a production origin. Isolation is a data-ownership rule, not a pathname trick.

ManaEvo must never:

- use a Kids Quest localStorage key or IndexedDB store as its normal write target;
- delete or rewrite Kids Quest data during reset/migration;
- delete Kids Quest caches;
- create a Service Worker intended to control Kids Quest;
- create live two-way synchronization between the apps without a later explicit decision;
- automatically import Kids Quest game-specific monster/battle state without an approved mapping.

---

## 2. Identity and save ownership model

### 2.1 Auth account and player profile are different identities

A Supabase Auth account is the **family/parent account** used to access shared cloud persistence. A player profile is an in-app ManaEvo identity such as a parent or child.

One Auth account may own multiple stable ManaEvo player profiles. Creating another child profile does not require another Auth user.

A player profile must have a stable ID independent of display name. Display-name changes, if later supported, must not create a new save identity or orphan game/learning data.

### 2.2 Device-local state

The following are device/application concerns rather than shared player progression:

- which player profile this device normally opens;
- Parent gate/PIN metadata;
- local cache/offline metadata;
- local cloud-sync metadata needed for conflict detection;
- TEST-mode marker and exact pre-test return snapshot.

**Current player selection is device-local authority.** Selecting one profile on an iPad must not switch the active player on another device.

Parent PIN is a local guard against child mis-operation. It is not a cloud account password and must not be used as a player save key.

### 2.3 Per-profile learning state

Learning state remains governed by the Kids Quest learning source-of-truth boundary in D-005. Cloud/local persistence must preserve the profile relationship for at least:

- current/selectable grade and ahead-learning progression;
- learning mastery / unit progress;
- SRS / review / mistake tracking;
- star-trial and promotion-related learning state;
- English learning progress;
- streak/history/daily learning state;
- applicable learning settings.

ManaEvo must not redesign learning semantics merely to simplify persistence.

### 2.4 Per-profile game state

Game progression belongs to the same stable profile identity as that profile's learning state. It includes, as owned by the other CURRENT game contracts:

- tickets and ticket lifecycle state;
- team / BOX / caught / dex progress;
- individual monster identity, species, level, XP and held-item state;
- capture/evolution resources and other items;
- world/adventure location and progression;
- boss/progression state;
- evolution discoveries;
- active encounter/battle continuation state;
- other game progression owned by that player.

A game state from profile A must never be silently paired with learning state from profile B.

### 2.5 Learning-to-game bridge

Unconsumed/processed learning-to-game reward bridge state is part of the recoverable ManaEvo snapshot. Changing devices must not lose pending reward state or allow the same reward to be granted again.

---

## 3. Profile switching contract

Profile creation/switching is Parent-controlled.

When switching A → B:

1. persist/normalize A learning state;
2. persist/normalize A game state;
3. change the **device-local** selected profile;
4. load B learning state;
5. load B game state using the same stable B ID;
6. copy nothing between A and B unless an explicit import/create operation requires it.

Required invariants:

- A → B → A restores A's own learning and game progress;
- switching does not duplicate tickets, XP, items, rewards, mastery or profiles;
- a new profile starts from approved fresh defaults, not a clone of the active player;
- switching never writes to Kids Quest source data;
- migration/import preserves stable profile IDs once created.

Profile deletion/rename product policy remains unresolved unless separately approved.

---

## 4. Parent gate and adult-only ownership

Parent is a focused adult-only state. Existing child gameplay must not directly mutate Parent-owned controls.

Adult-only controls include:

- grade/current learning-grade controls within Kids Quest rules;
- ahead-learning controls;
- difficulty;
- audio/TTS settings owned by Parent;
- profile creation/selection/switching;
- cloud conflict resolution;
- TEST-mode entry/exit;
- backup creation/restore/import;
- account logout and other destructive account/save actions.

Email/password sign-in may be offered on a fresh device so the family can recover its cloud save, but mutation of Parent-owned player/test/restore controls remains behind the local Parent gate.

The exact adult-check puzzle is an implementation detail unless a higher-authority decision fixes it.

---

## 5. Cloud persistence contract

### 5.1 Backend boundary

ManaEvo uses the generic personal-app Supabase backend created under D-018, separate from Family Ops.

The generic backend may be shared by future personal apps, but data must be partitioned by application identity. ManaEvo uses:

- `app_id = mana-evo`;
- its own save slot(s)/payload contract;
- the signed-in Auth user's `auth.uid()` as ownership boundary.

No browser bundle may contain a Supabase secret/service-role credential. Browser-safe project configuration is not authorization; RLS plus the signed-in JWT is the access boundary.

All exposed save/backup tables must have RLS. An authenticated user may read/write only rows whose `user_id` equals `(select auth.uid())`. Anonymous table access is not permitted.

### 5.2 Complete versioned snapshot

Cloud save is a recoverable, versioned ManaEvo snapshot, not a progress summary.

A cloud revision must preserve enough information to restore:

- profile registry;
- all included per-profile learning state;
- the matching game envelope;
- learning-to-game reward bridge state;
- save schema/content version metadata.

The device-local selected profile is **not** cloud authority and must not be allowed to make devices fight over which player is currently open.

### 5.3 Local storage role

ManaEvo local storage remains required as:

- fast local runtime state;
- offline continuity/cache;
- temporary unsynced work;
- source for exact TEST-mode return state.

Cloud persistence is the cross-device durable layer. A temporary network/Auth failure must not erase already-valid local progress.

### 5.4 Session persistence and recovery

Normal cloud authentication is parent/family **email + password**.

After successful sign-in, the browser session may persist/refresh so every app launch does not require a password. Password recovery and email-confirmation flows use Supabase Auth and must return to the canonical Vercel production origin for production use.

Account password and local Parent PIN are separate concepts.

### 5.5 First-device / fresh-device behavior

- cloud empty + valid local progress: upload may initialize cloud;
- genuinely fresh local device + existing cloud: download/adopt cloud state;
- both sides contain divergent meaningful progress without trusted common revision: do not guess—surface an adult conflict decision.

### 5.6 Concurrency and revision guard

Cloud saves carry revision identity. A write based on an older revision must not silently overwrite a newer device's progress.

Stable player profiles are independent conflict domains inside the family snapshot. If cloud advanced while local also has unsynced changes, and the changed profile IDs are disjoint, ManaEvo may deterministically merge each profile's **learning + game + learning-to-game reward bridge** slice and commit the merged snapshot against the current cloud revision. This allows, for example, one device to advance a parent profile while another device advances a child profile without creating a false household conflict.

If the **same stable profile** changed differently on both devices, or a registry/schema change cannot be proven compatible, stop and surface an adult conflict decision rather than guessing. Before destructive overwrite/pull/restore boundaries, preserve a backup according to the backup contract.

Silent last-write-wins that can destroy another device's progress is prohibited.

---

## 6. Backup, restore and migrations

### 6.1 Backup ownership

Backup/restore is Parent-only.

ManaEvo supports cloud backup history in addition to any manual export/import compatibility flow. Backups must preserve profile identity and learning/game pairing.

At minimum, backups should exist around destructive boundaries such as:

- manual backup request;
- conflict overwrite/pull;
- restore;
- future destructive migrations.

Automatic periodic snapshots may be retained where storage limits permit.

A restore must first preserve the current cloud state when practical, then restore the chosen version without writing to Kids Quest.

### 6.2 Version every persisted schema that can evolve

ManaEvo save envelopes/imports/cloud payloads must carry an explicit schema/format version or equivalent migration discriminator.

A load path must distinguish current format, supported older ManaEvo formats, compatible one-way Kids Quest source data, and unsupported/invalid input.

### 6.3 Migration invariants

A migration must:

- preserve valid existing progress;
- preserve stable profile/monster/learning IDs;
- map legacy single-profile data deterministically once;
- avoid granting gameplay rewards merely because migration ran;
- write only ManaEvo-owned storage/cloud rows;
- leave Kids Quest unchanged;
- be idempotent when rerun on already-migrated state.

Concretely: no duplicate profiles, tickets, monsters, items, rewards, mastery/SRS records or import bonus.

### 6.4 Future monster/content expansion

Species/monster identity must be stable-ID based, not array-position based.

Adding new species to a later content version must not require old saves to contain explicit false entries for every future species. New IDs absent from an old save may naturally appear as unseen/unowned after content upgrade.

If an existing ID is removed, merged or remapped, use an explicit versioned migration rather than changing historical meaning silently.

---

## 7. TEST-mode isolation

TEST data is not a normal family profile and must never become normal cloud progress.

Entering TEST mode must:

1. capture the exact current real local learning/game/reward/device-selection state;
2. persist a TEST marker and return snapshot locally;
3. pause cloud autosync;
4. load a deterministic fixture;
5. display a persistent visible TEST indicator.

Exiting TEST mode restores the exact pre-test local state and clears the TEST marker/return snapshot only after restoration succeeds.

Initial required fixtures:

- **all-open**: all active species viewable/owned as needed for broad UI/game checking, current areas/stages/resources available;
- **stage1-evolution-ready**: every current first-stage source with a valid next transition prepared immediately before its real evolution trigger;
- **stage2-final-evolution-ready**: every current second-stage source with a valid final transition prepared immediately before its real trigger.

Fixtures should derive from CURRENT species/evolution masters, not a stale manually copied list, so additions/transition changes are reflected automatically.

TEST writes must never reach `app_saves` or backup history as real progress.

---

## 8. Optional Kids Quest progress import

Kids Quest import remains **optional, one-way, read-only and compatibility-gated**.

A valid import must:

1. read Kids Quest source data only;
2. copy compatible data into ManaEvo-owned state;
3. record an import marker/version;
4. be idempotent;
5. never delete/update Kids Quest source;
6. stop synchronizing after import;
7. import only compatible learning/profile/settings data;
8. not auto-import Kids Quest monster/battle/game state without an approved mapping.

Loading/importing old learning progress must not mint side-effect rewards merely because the data was imported.

---

## 9. Official hosting authority: Vercel

Under D-019, the official and only ManaEvo production canonical host is **Vercel**.

Canonical production URL:

`https://mana-evo.vercel.app/`

Production base path / PWA scope root:

`/`

Responsibility split:

- **GitHub** — source code, PRs and CI;
- **Vercel** — ManaEvo production and PR Preview deployments;
- **Supabase** — Auth, DB, Cloud Save and backup storage.

Required production-hosting invariants:

- production Vite build resolves from root `/`;
- JS/CSS chunks, dynamic imports, icons, fonts, audio and monster images resolve correctly from the Vercel production origin;
- canonical/OG metadata is exactly the stable Vercel production URL, never a Preview URL;
- PWA manifest `id`, `start_url` and `scope` identify `https://mana-evo.vercel.app/`;
- Service Worker registration/scope is owned by the ManaEvo Vercel production origin;
- production code does not depend on the historical `/mana-evo/` GitHub Pages base;
- GitHub Pages main-push production deployment is not part of the release path.

Vercel Preview deployments are review/test environments, not canonical production identity. A Preview URL must never be written into canonical metadata, PWA identity or durable product contracts.

---

## 10. Supabase Auth URL authority

For production authentication:

- Supabase Auth **Site URL** points to `https://mana-evo.vercel.app/`;
- production email-confirmation/password-recovery redirects return to that origin;
- Vercel Preview redirect URLs may be added only when an Auth flow must be tested on a Preview;
- historical GitHub Pages URLs are not a production Auth return target.

A Preview host may be temporary or protected; therefore Preview allowance does not make it canonical.

---

## 11. PWA / manifest / Service Worker / offline contract

### 11.1 Manifest

ManaEvo ships an independent PWA manifest with:

- ManaEvo branding;
- ManaEvo-unique app identity;
- canonical Vercel `id/start_url/scope`;
- installable Apple/PWA icons;
- no Kids Quest identity reuse.

### 11.2 Service Worker ownership

The ManaEvo Service Worker must:

- register from the Vercel ManaEvo production origin;
- use ManaEvo-owned cache names/prefixes;
- delete only obsolete ManaEvo-owned caches during cleanup;
- not manipulate Kids Quest storage/cache;
- support update discovery without origin-wide cache deletion.

### 11.3 Offline expectation

After a successful online visit sufficient to populate the required shell, the installed ManaEvo PWA should launch its previously valid shell offline and serve assets intentionally covered by its offline strategy.

### 11.4 Update expectation

The update strategy must preserve both:

- **freshness** — installed clients can receive a newly deployed production version;
- **offline continuity** — a previously valid cached app remains usable when network access is unavailable.

A canonical-origin change must bump/invalidate the ManaEvo app-shell cache as needed so an old installation does not remain permanently pinned to obsolete metadata/assets.

---

## 12. Formal monster asset cache/versioning contract

This section defines PWA caching only. Monster identity/status/art approval belongs to W-109/D-014/D-016.

Every FORMAL monster asset consumed by the PWA must have explicit revision identity (digest, versioned URL, manifest revision or equivalent).

When an approved FORMAL asset changes, either its effective cache identity changes or the Service Worker deterministically invalidates the changed asset.

Merely overwriting bytes at an immutable cache-first URL without invalidation is not acceptable.

Candidate/placeholder/formal states must not share cache identity in a way that lets an older candidate/placeholder permanently mask the later FORMAL asset. Production-visible CANDIDATE behavior remains governed by D-016 and does not itself promote the asset to FORMAL.

Offline mode may fall back to a previously valid cached asset when network access is unavailable, while an online update must be able to obtain the newest approved FORMAL revision.

---

## 13. Current implementation observations

These observations are useful for locating reusable implementation and are not independent specification authority.

| Area | Current direction | Canonical assessment |
|---|---|---|
| Learning save | ManaEvo-specific versioned learning storage/export | reusable; preserve Kids Quest semantics |
| Game save | `gameByProfile` envelope | aligns with stable profile ownership |
| Reward bridge | persisted learning→game envelope | must be included in cloud revision |
| Profiles | stable profile snapshots | aligns; selected device profile stays local |
| Parent gate | local 4-digit PIN + adult check | valid local safety boundary |
| Cloud | generic Supabase `app_id=mana-evo` + revisioned snapshot | D-018 direction |
| Backup | manual/destructive-boundary cloud snapshots | D-018 direction |
| TEST | local-only exact return snapshot and fixtures | D-018 direction |
| Hosting | Vercel stable production domain + Preview deployments | D-019 production authority |
| GitHub Pages | historical hosting path only; main auto-deploy retired | not production authority |
| Manifest/SW | canonical Vercel root identity / ManaEvo cache prefix | D-019 direction |
| Monster cache | FORMAL revision identity + candidate network-first behavior | must preserve W-109/D-016 semantics |

A dedicated Kids Quest legacy-progress import path must not be claimed complete merely because ManaEvo backup import exists.

---

## 14. Cross-document interfaces

W-107 owns platform/save/hosting boundaries and does not redefine other domain rules:

- **W-101 / Learning & rewards** — learning semantics and reward bridge;
- **W-102 / Battle & tickets** — active battle/ticket lifecycle persisted per profile;
- **W-103 / Capture** — capture/duplicate settlement state persisted per profile;
- **W-104 / Evolution** — item/evolution state persisted per profile;
- **W-105 / World** — adventure location/progression persisted per profile;
- **W-106 / UI** — Parent remains focused adult-owned UI;
- **W-108 / Acceptance** — behavioral acceptance machinery;
- **W-109 / Monster art** — formal/candidate identity and revision input for PWA caching.

---

## 15. Behavioral acceptance

### Profiles / Parent

- [ ] every learning/game save is attributable to a stable profile ID;
- [ ] switching A → B → A restores each profile's own learning and game state without leakage;
- [ ] profile switching/creation does not duplicate progress/rewards;
- [ ] device A selecting a player does not force device B to switch player;
- [ ] player/test/conflict/restore controls are Parent-owned;
- [ ] child flow cannot silently bypass Parent controls.

### Cloud / Auth

- [ ] signed-in user can access only own save/backup rows under RLS;
- [ ] anonymous clients cannot read/write save/backup rows;
- [ ] browser bundle contains no secret/service-role credential;
- [ ] full learning + game + reward bridge round-trips through cloud;
- [ ] fresh device adopts existing cloud state;
- [ ] disjoint edits to different stable profiles merge without losing either profile;
- [ ] divergent edits to the same stable profile surface a conflict rather than silent overwrite;
- [ ] session persists/refreshes correctly;
- [ ] email confirmation and password recovery return to Vercel production for production flows.

### TEST / backup / migrations

- [ ] TEST mode performs no cloud write;
- [ ] exiting TEST restores exact pre-test state;
- [ ] all-active fixture follows current active species master;
- [ ] stage1/stage2 fixtures follow current evolution transitions;
- [ ] backup restore preserves correct profile learning/game pairing;
- [ ] destructive restore/overwrite retains a recoverable pre-change backup;
- [ ] migrations are versioned/idempotent and preserve stable IDs;
- [ ] later species additions do not corrupt old saves.

### Kids Quest isolation/import

- [ ] normal ManaEvo operation writes only ManaEvo-owned storage/backend rows;
- [ ] ManaEvo reset/delete leaves Kids Quest data/cache unchanged;
- [ ] optional Kids Quest import reads source only and is idempotent;
- [ ] no live two-way sync begins after import;
- [ ] Kids Quest monster/battle data is not auto-imported without an approved mapping.

### Hosting / PWA

- [ ] official production URL is exactly `https://mana-evo.vercel.app/`;
- [ ] production build works from root `/` with no `/mana-evo/` dependency;
- [ ] canonical/OG metadata points only to Vercel production;
- [ ] manifest `id/start_url/scope` exactly identify Vercel production;
- [ ] GitHub Pages main auto-deployment is absent from production workflow;
- [ ] Service Worker uses ManaEvo-owned cache identity and root production scope;
- [ ] installed PWA can launch from a valid offline cache and later receive an update;
- [ ] Vercel Preview URLs are never treated as canonical.

### Monster assets

- [ ] FORMAL art has revision identity consumed by PWA caching;
- [ ] replacing FORMAL art cannot remain hidden behind an older cache-first response;
- [ ] candidate/placeholder cache entries cannot mask later FORMAL art;
- [ ] production candidate rollout does not falsify FORMAL state;
- [ ] offline fallback retains a valid previously cached asset where available.

---

## 16. Non-decisions / do not invent

This contract does not independently define:

- profile deletion/rename UX;
- encrypted/cloud Parent-PIN recovery;
- the exact adult-check puzzle;
- a Kids Quest ↔ ManaEvo live-sync model;
- automatic mapping of Kids Quest game monsters/battles into ManaEvo;
- a mandatory technology for FORMAL art revisioning beyond the required invariant;
- a custom domain replacing `mana-evo.vercel.app`;
- paid Vercel/Supabase upgrades.

If a later implementation needs one of these as a product decision, recover or obtain explicit approval rather than inferring it from runtime.
