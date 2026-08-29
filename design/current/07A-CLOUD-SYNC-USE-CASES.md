# ManaEvo CURRENT — Cloud Sync Use Cases

Status: **CURRENT normative companion to W-107 / D-018 / D-021 / D-028**  
Scope: local-first persistence, cloud autosync timing, cross-device reconciliation, conflict ownership, profile switching, offline recovery

## 1. Core rule

ManaEvo always protects the child's current device progress first.

1. A learning/game mutation is written to ManaEvo-owned local persistence immediately.
2. Cloud sync is asynchronous and must not block normal child play.
3. Normal autosync is scheduled about 800ms after the latest local save.
4. Continuous local changes must not postpone cloud sync indefinitely: an outstanding local change must trigger a cloud sync attempt no later than 4 seconds after the first unsynced save in that burst.
5. App start/session recovery, network `online`, window `focus`, return from background, and profile-switch boundaries trigger an immediate sync attempt.
6. Entering background (`visibilitychange` to hidden) requests an immediate best-effort sync. Failure must never discard valid local state.
7. TEST mode never writes its fixture state to normal cloud save.

The cloud copy is the durable cross-device layer. Local persistence remains the immediate/offline safety layer.

## 2. Reconciliation authority

Every sync compares:

- current local payload hash and per-profile slices;
- last-known synced revision/hash metadata for this Auth user;
- current cloud revision/payload.

No decision may be based on wall-clock recency alone. A device with a later clock is not automatically authoritative.

Allowed outcomes are:

- **NOOP** — local and cloud already represent the same meaningful state;
- **PUSH** — only local has meaningful unsynced change and cloud has not advanced incompatibly;
- **PULL** — local has no meaningful unsynced change and cloud is newer, or this is a genuinely fresh device adopting an existing cloud save;
- **MERGE** — local and cloud changed disjoint stable profiles, so each profile's learning + game + reward-bridge slice can be combined deterministically;
- **CONFLICT** — the same stable profile changed differently on both sides or registry/schema compatibility is not provable. Child play remains locally saved; Parent resolves later.

## 3. Child-visible cloud status policy

Cloud state is normally invisible in child gameplay.

Do **not** show a cloud control/status surface for ordinary healthy states such as:

- autosync debounce waiting;
- an in-flight sync;
- a brief offline period;
- a background best-effort retry;
- a successful/no-op/push/pull/merge cycle.

A small non-destructive `保存確認` warning may appear in child-facing UI only when the app has a **real attention state**:

- same-profile conflict is confirmed; or
- an automatic startup/recovery sync has ended in an explicit persistent sync error.

The child warning must say or imply that the current device save is still protected. It must not expose destructive choices such as cloud-vs-device overwrite. Those actions remain Parent-owned and PIN-protected. A transient `クラウド同期待ち` state alone is not sufficient to show the child warning.

## 4. Use-case matrix

| # | Situation | Automatic action | User-visible behavior | Safety invariant |
|---|---|---|---|---|
| U1 | Local changed; cloud still equals last synced revision | PUSH local snapshot | Usually silent | Never wait for cloud before continuing play |
| U2 | Cloud changed on another device; this device has no local unsynced change | PULL cloud | Usually silent; reload/adopt only after validated payload | Do not overwrite a local unsynced change |
| U3 | Fresh/reinstalled device with valid login; cloud exists | PULL/adopt cloud | Family progress is restored | Fresh defaults must not overwrite an existing cloud save |
| U4 | Cloud empty; this device has valid local progress | PUSH-NEW | Usually silent | Initial cloud creation uses the full versioned snapshot |
| U5 | Local and cloud both changed, but on different stable profiles | MERGE | Usually silent; merged state then becomes local+cloud authority | Learning, game, and reward bridge for each profile move together |
| U6 | Local and cloud both changed the same stable profile differently | CONFLICT | Child may see only a small `保存確認` warning; Parent screen later asks which side to keep | No silent last-write-wins; no destructive child action |
| U7 | Device is offline while child learns/plays | LOCAL ONLY; queue sync need implicitly via changed state | No blocking error and normally no cloud UI | Local progress remains valid and recoverable |
| U8 | Network returns after offline progress | Immediate sync/reconcile | Usually silent | Re-run U1–U6 decision; do not assume local automatically wins |
| U9 | App returns to foreground/focus | Immediate sync/reconcile | Usually silent | Detect changes made by another device while this device slept |
| U10 | App enters background / user leaves app | Best-effort immediate sync | No waiting screen | Failure is acceptable because local data already exists; next resume retries |
| U11 | Child makes many rapid saves continuously | Debounced sync at ~0.8s, but force an attempt by max 4s from first unsynced save | No visible interruption | Repeated activity cannot postpone cloud persistence forever |
| U12 | Profile A is active and user switches to Profile B | Flush/sync A before reload/switch boundary, then load B | Profile switch may wait briefly for the explicit boundary sync, but must not discard A locally on failure | A and B never copy progress into each other |
| U13 | Profile A changed on iPhone; Profile B changed on iPad | MERGE | Usually silent | Different-profile progress is preserved from both devices |
| U14 | Same child/profile changed on iPhone and iPad while both were offline | CONFLICT when both reconnect | Child flow continues; small save warning allowed; Parent decision required | Never guess which child's progress is more valuable |
| U15 | Cloud request fails/timeouts/server unavailable | Keep local state; retry later | Brief/transient failure stays silent; explicit persistent sync error may show `保存確認` | Network failure cannot erase local progress |
| U16 | Sync is already in flight and more local saves occur | Coalesce/serialize; after current sync settles, another reconciliation must observe newest local state | Silent | Do not allow stale in-flight completion to falsely mark newer local state as synced |
| U17 | User presses “今すぐ同期” | Immediate reconciliation using same authority rules | Status shown in Parent/account UI | Manual sync does not bypass conflict protection |
| U18 | TEST mode active | NO normal cloud write | TEST banner remains visible | Fixture state must never contaminate family save |
| U19 | Restore/overwrite/conflict resolution is chosen by Parent | Backup current cloud where practical, then guarded write/pull | Adult-only confirmation | Destructive boundary preserves recoverability |
| U20 | Browser reload/crash occurs before autosync timer fires | Local save survives; next app start performs immediate reconciliation | Normal recovery | Reload must not turn an already-local save into lost progress |

## 5. Profile-switch boundary

Profile switching is a stronger boundary than ordinary autosync.

Before switching A → B:

1. A's learning state and game state are already persisted locally;
2. cancel pending autosync timers;
3. make an immediate cloud reconciliation attempt for the current full household snapshot;
4. if cloud sync succeeds, continue switch;
5. if cloud sync fails because of network/server error, A remains safe locally and the switch may continue only if runtime preserves that unsynced local state for the next reconciliation;
6. if reconciliation detects same-profile conflict, do not silently overwrite either side. Preserve local state and surface Parent conflict handling.

A profile switch must never copy A state into B or change the selected profile on another device.

## 6. In-flight sync / race handling requirement

Autosync must behave as a serialized reconciliation process, not independent fire-and-forget requests.

Required behavior:

- at most one authoritative reconciliation write sequence is in flight per app instance;
- local changes occurring during an in-flight sync remain dirty relative to the just-captured payload;
- when the in-flight sync finishes, if local state changed after its capture, schedule/perform another reconciliation;
- a stale response must not update sync metadata as though it represented the newest local payload;
- optimistic cloud revision guards remain authoritative for writes.

## 7. What must never happen

- Losing valid local progress because cloud is unavailable.
- Treating the newest timestamp/device clock as automatic winner.
- Silent last-write-wins for the same profile.
- Merging learning from one profile with game state from another.
- Sending TEST fixture state to the normal family cloud slot.
- Allowing continuous gameplay to defer cloud attempts forever.
- Allowing a profile-switch reload to discard an unsynced current-profile mutation.
- Marking newer local changes as synced because an older in-flight request completed later.
- Showing routine cloud noise to the child.
- Asking the child to choose cloud-vs-device overwrite.

## 8. Acceptance evidence required before release

At minimum tests/review must cover U1, U2, U3, U5, U6, U7→U8, U11, U12, U14, U15, U16, U18 and U20, plus the child-warning boundary, existing RLS/backup/profile-isolation tests and iPhone WebKit regression.
