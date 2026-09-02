# ManaEvo UX Bundle A — Canonical Delta Candidate

Status: **DESIGN CANDIDATE — IMPLEMENTATION + INDEPENDENT REVIEW REQUIRED BEFORE MERGE**  
Date: 2026-09-02  
Branch: `implementation/ux-bundle-a-20260902`  
Parent backlog: #149  
Scope: #143 low-risk profile/IA, #144 Study UX, #146 visual-only Adventure/Capture fixes, #148 common chrome.

## 0. Authority

This candidate follows:

1. `REBUILD-START-HERE.md`
2. `design/rebuild/DECISION-LOG.md`
3. `design/current/00-START-HERE.md`
4. owning CURRENT contracts:
   - W-106 `06-UI-SCREEN-CONTRACT.md`
   - W-107 `07-SAVE-PROFILES-PARENT-PWA.md`
   - W-108 `08-ACCEPTANCE-TEST-CONTRACT.md`
   - W-103 `03-CAPTURE-DUPLICATES.md` for capture boundaries
5. 2026-09-02 real-device user decisions.

Runtime/tests are evidence only and do not override these contracts.

## 1. Explicit user decisions from 2026-09-02 device review

The following are treated as explicit product changes for this candidate:

- child-facing brand copy should be natural Japanese; candidate copy is **`まなぶと、進化する。`**
- profile display names can be changed later without changing stable profile identity
- child-facing default `ぼうけんしゃ 1` style names should not be shown as the normal profile-creation experience
- major child screens should make the active player obvious
- children may switch safely among existing sibling/family player profiles without entering Parent PIN
- Study daily required learning should return to a one-primary-action, automatic/continue experience rather than making the child choose among remaining subjects every time
- optional Study modes should not be hidden behind a collapsed `ほかの まなび` disclosure
- the Star Trial / chapter-end progression goal should be visually understandable as the goal
- child-facing `たんげん` should be replaced by age-appropriate wording
- Adventure map/stage-card overlap should be repaired
- selected Capture throw CTA must visibly look enabled
- common top/bottom chrome should be thinner while retaining iOS safe-area and usable tap targets.

## 2. Questions that are NOT silently promoted to decisions

The user asked whether children should also be able to perform cloud login/data-sync operations. That was a question, not an explicit authorization to move account/restore/destructive cloud controls into the child surface.

Therefore Bundle A keeps these adult-only:

- family email/password sign-in, password recovery/change
- cloud conflict overwrite/pull decisions
- TEST-mode entry/exit
- backup restore/import/destructive overwrite
- grade/ahead-learning/difficulty settings
- profile creation and rename

Normal background autosync after a parent has already signed in remains automatic and does not require child interaction.

Children may switch **existing** profiles only. This changes the earlier W-107 `profile switching is Parent-controlled` boundary, but does not change Auth ownership or cloud conflict/destructive ownership.

## 3. Profile identity / switching contract

### 3.1 Stable identity

- display-name rename never changes `profileId`
- learning state, game state, pending learning→game rewards, cloud profile slice and device-local selected profile continue to use stable IDs
- A → B → A restores each profile's own learning + game state
- switch does not duplicate tickets, XP, items, mastery, capture resources, rewards or profiles.

### 3.2 Child switch surface

- ordinary top-level child screens show a compact active-player control in shared chrome
- the child can open a simple player chooser and switch among already-existing profiles
- profile switching is unavailable during focused/transactional flows such as active learning activity, active Battle/Capture, Evolution acknowledgement or other states where switching could abandon an in-progress transaction
- changing the active player updates the device-local preferred-profile authority as well as the live learning/game pairing.

### 3.3 Profile creation/rename

- Parent remains the place to create/rename profiles
- create requires a non-empty display name; no new `ぼうけんしゃ N` fallback should normally be created through UI
- legacy saves that already contain `ぼうけんしゃ N` remain readable; migration must not invent a new identity merely to rename them.

## 4. Parent / Cloud information architecture

The current `Parent -> floating cloud button -> second PIN -> TEST/backup/profile` path creates redundant gates.

Bundle A candidate:

- ParentGate remains the one adult verification boundary for Parent flow
- ParentScreen adds a first-class **Cloud / Backup / TEST** shortcut/section entry
- when cloud controls are opened from an already-unlocked ParentScreen, the cloud modal must recognize that Parent is already verified and must not ask the same local PIN again
- outside ParentScreen, adult cloud controls still require the Parent PIN
- cloud attention/error state may still surface an alert entry, but destructive resolution stays adult-only
- child profile switch is removed from the adult-cloud-only requirement because it has its own safe child switch surface.

Recommended Parent shortcut order by frequency/importance:

1. Profile / player management
2. Learning grade / ahead learning
3. Difficulty
4. Audio / voice
5. Cloud / backup / TEST
6. Monster offline-image storage
7. lower-frequency advanced controls.

## 5. StudyHub contract delta

W-106 already requires one dominant child decision and `つづきの まなび / 次のrequired task` as primary CTA. Bundle A makes that concrete.

### Required learning

- if daily core is incomplete, show one dominant **`おまかせで まなぶ！` / `つづきから まなぶ！`** action
- start the current canonical `daily.coreTasks[daily.coreIndex]`; do not redesign Kids Quest scheduling/SRS/learning semantics
- remove the normal requirement for the child to reorder core subjects with `PICK_CORE_TASK`
- progress can still show which required learning remains, but remaining subjects are progress information, not competing primary CTAs.

### Other learning

Always visible on StudyHub:

- じゆうべんきょう
- とっくん
- ほしのしれん
- えいごずかん

Do not hide them behind a closed `<details>` control.

### Goal visibility

- present `ほしのしれん` as the visible goal of the current grade progression
- show readiness/progress (`あと○こ`) using child language
- replace child-facing `たんげん` with `まなび`, `できること`, `あと○こ` or similarly comprehensible wording
- Parent/technical screens may retain `単元` when needed for adult precision.

## 6. Adventure / Capture visual-only delta

Bundle A does **not** modify capture probability, eligibility, item multipliers, 92% cap, rainbow guarantee, three-attempt accounting or settlement semantics.

Visual repairs only:

- world-route connector must not visually cross labels/nodes in a misleading way, including the EX node wrapping case
- daily encounter rank/number badge must not cover the monster art
- monster art should remain readable at 375/390/430 and supported iPad layouts
- selected-and-ready Capture throw CTA must use a clearly enabled primary visual state; disabled remains clearly disabled
- preserve current child-facing ★/recommendation + exact-%-under-details hierarchy.

### Capture probability is explicitly deferred

W-103 fixes only:

- HP eligibility `<= 50%`
- star/silver/gold multipliers `1.00/1.20/1.50`
- rainbow guaranteed
- non-rainbow cap `0.92`
- max attempts `3`.

W-103 explicitly does **not** promote CURRENT runtime's exact base formula `0.34 + missingHpRatio*0.62 - catchRank*0.07` to product rule. FINAL-CORRECTED contains an older rank-rate formula, but that formula belonged to the superseded victory-only capture mode and older multipliers.

Therefore Bundle A must not tune `89%` to a guessed replacement. Bundle B will independently review and canonicalize baseChance before changing runtime/tests.

## 7. Common chrome delta

- reduce visual height of shared game header and bottom navigation
- preserve safe-area insets
- preserve at least approximately 44px interactive target height
- keep resource counts and active tab readable
- landscape/low-height gets more usable content height
- do not globally stretch iPad Compact surfaces; D-022-wide-layout backlog #142 remains separate
- no UA/device-model sniffing, no `!important`, no new catch-all override stylesheet that steals visual authority.

## 8. Non-regression / acceptance

Bundle A candidate must pass, on one implementation head:

### Profile
- existing profile list can be switched from child top-level UI without PIN
- switch is blocked/absent during active Battle/Capture/focused learning
- A → B → A preserves separate learning state and game state
- device-local preferred profile follows the switch
- Parent can rename a profile while stable ID and state remain unchanged
- UI profile creation rejects empty name and does not create a normal `ぼうけんしゃ N` fallback

### Parent / cloud
- Parent entry requires local Parent gate as before
- opening Cloud/Backup/TEST from already-unlocked Parent does not ask for Parent PIN twice
- opening adult cloud controls outside verified Parent still requires PIN
- TEST/restore/conflict/account actions remain adult-only

### Study
- daily incomplete state has exactly one dominant required-learning start action
- it starts current canonical core task without changing SRS/task semantics
- other four learning modes are visible without expanding details
- Star Trial goal/readiness visible
- no child-facing `たんげん` in StudyHub.

### Adventure/Capture visual
- 375/390/430 + tablet representative geometry: rank badge and enemy art do not overlap
- route connector does not obscure node/label decision surfaces
- capture selected throw CTA is visually enabled and clickable
- capture probability and accounting tests remain unchanged in Bundle A.

### Chrome
- header/nav honor iOS safe-area
- tap target remains >=44px-equivalent
- low-height viewport gains content space
- no horizontal overflow or D-021 continuity regression.

### Cumulative regression
- D-020 Dex startup/cache/history remains intact
- D-021 tablet rotation/runtime continuity remains intact
- full iPhone 375/390/430 WebKit regression remains green
- unit/integration, Vite build and release readiness remain green.

## 9. Review gate

This design/runtime candidate must not merge solely because CI is green.

Independent review should explicitly answer:

1. Did Bundle A preserve W-103 capture semantics and correctly defer baseChance tuning?
2. Does child profile switching preserve stable ID + device-local selection + learning/game pairing without exposing adult cloud/destructive controls?
3. Does Parent cloud integration remove redundant PIN without weakening the adult boundary?
4. Does StudyHub change UI ownership only, without making ManaEvo a second learning scheduler?
5. Are Adventure/Capture changes visual-only and geometry-tested?
6. Does chrome compaction preserve safe-area/tap targets/mobile baseline and D-021 continuity?

Only after review PASS + final CI may Bundle A be merged/released.
