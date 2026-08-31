# ManaEvo iPad / Tablet Support V1.2 — Canonical Promotion Candidate

- Status: **DESIGN REVIEW CANDIDATE — NOT CURRENT AUTHORITY**
- Revision: **V1.2 — CURRENT refresh + D-020 cumulative authority**
- Date: 2026-09-01
- Base: `main` @ `b5f06dc125a85584474a4b6e9f1279043e111e0d`
- Repository: `syoudai0514/mana-evo`
- Scope: product support contract / responsive layout / runtime continuity / PWA orientation / acceptance only
- Out of scope: runtime implementation, CSS, `public/manifest.webmanifest`, Service Worker implementation, test implementation, production deployment

This document is the exact promotion candidate for adding iPad/tablet support to ManaEvo. It does **not** itself change CURRENT authority. Promotion requires an independent `DESIGN PASS` first.

Canonical promotion targets after PASS:

1. `design/current/06-UI-SCREEN-CONTRACT.md`
2. `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
3. `design/current/07-SAVE-PROFILES-PARENT-PWA.md`
4. `design/rebuild/DECISION-LOG.md` as **D-021**

CURRENT already contains **D-020 図鑑FORMAL画像の端末一括保存と連続詳細閲覧**. D-021 is a later cross-cutting tablet contract and does **not** supersede or relax D-020.

---

# 0. Why this change exists

CURRENT product contracts strongly cover the 375–430px iPhone portrait baseline, but iPad/tablet portrait, landscape, reduced multi-window and rotation continuity were not first-class release gates.

Real-device iPad verification exposed two independent implementation failures:

1. the installed Home Screen Web App may stay portrait because CURRENT manifest declares `orientation: portrait-primary`;
2. nested learning components can use `94–96vw` inside a globally bounded approximately `520px` shell while ancestors clip horizontal overflow, allowing required content to disappear without document-level horizontal scroll.

The product-level cause is broader than either selector or manifest field:

> ManaEvo did not have an explicit product contract for supported tablet viewport capability, layout-surface ownership, and runtime continuity across presentation changes.

---

# 1. Three independent product axes

These axes are independent. One must not be inferred from another.

| Axis | Defines | Examples |
|---|---|---|
| Navigation ownership | who owns state and transition | TOP LEVEL / FOCUSED / CONTEXTUAL |
| Layout Surface | how available viewport width/height may be used | Compact / Workspace / Contextual interactive |
| Runtime Continuity | what semantic transaction and active interaction state must survive resize/rotation | question / Capture / Battle / Evolution / Dex context / Parent input |

`FOCUSED_APP_VIEWS`, `.app-shell--focus`, or any CSS class membership must not become Layout Surface authority.

Battle/Capture/Dex/Evolution may be contextual/internal states while still owning Workspace or Contextual-interactive layout.

---

# 2. Exact delta for 06-UI-SCREEN-CONTRACT.md

## 2.1 Supported responsive presentation

The existing **375–430px iPhone portrait** contract remains the mobile baseline and must not regress. It is no longer the exclusive supported presentation range.

ManaEvo supports responsive presentation from the 375px-class mobile baseline through iPad-class full-screen and reduced multi-window viewports, in portrait and landscape where the operating environment permits rotation.

Layout authority is the **current available layout viewport**, not device model or User-Agent.

Do not implement tablet support through iPad UA sniffing, model-name branching, or device-specific patches when a viewport/layout-surface rule can express the requirement.

## 2.2 Layout Surface Contract

### Compact

Target outer ceiling: approximately `520px`.

Default mapping:

- Home
- Study Hub
- Adventure normal/browse
- HowTo
- Monster team/basic management

Compact preserves a focused phone-like child surface even on a wider device. Compact does not imply portrait-only.

### Workspace

Target outer ceiling: approximately `760px`.

Default mapping:

- Activity
- Free
- Review
- Trial
- Dictionary
- Parent
- Dex grid/detail browsing

Individual reading/decision regions may intentionally remain around `620–680px` or another narrower width.

**A Workspace state must not remain globally constrained by the Compact ~520px ceiling merely because it shares the application shell.** On representative tablet width, its owning outer surface must be capable of exceeding Compact while inner content may remain intentionally narrower.

### Contextual interactive

Target outer ceiling: approximately `760px`; primary decision region normally around `620–680px` unless a specific interaction requires otherwise.

Default mapping:

- Battle
- Capture
- Evolution

These surfaces optimize for immediate decision clarity and low-height operability rather than maximum horizontal fill.

**A Contextual-interactive state must not inherit the Compact ceiling merely because it is rendered inside a top-level navigation owner.**

## 2.3 Nested width ownership

For a normal nested layout component inside a bounded parent:

> required child layout width must stay within its containing layout surface unless overflow is an explicitly designed interaction such as an intentional carousel or viewport-owned overlay.

Preferred behavior is parent-relative sizing such as `width:100%` with a component `max-width`, or an equivalent rule.

`vw` is not globally prohibited. It remains valid for viewport-owned art, typography, decorative scale and true viewport overlays. It must not be the independent width authority for a normal bounded nested choice grid, explanation card, form, keypad or interaction region when the containing surface is narrower.

Global `overflow-x:hidden/clip` must not be used as proof that responsive layout is valid and must not be added to hide an oversized required descendant.

## 2.4 Low-height / dynamic viewport / keyboard

Tablet support includes reduced height from landscape, Safari chrome, standalone PWA presentation, software keyboard and multi-window operation.

Primary decisions must remain reachable. Audit at least:

- top/global headers and bottom navigation
- Study progress/back, question, choices, keypad
- fixed/centered learning feedback overlays
- Battle arena + command deck
- Capture decision/throw/result
- Evolution acknowledgement + continue
- Dex search/filter/detail
- Adventure search
- Parent PIN/account/forms

Existing `100vh` usage is an implementation audit target where it can cause browser/keyboard/landscape failure. This contract does not mandate one CSS token.

## 2.5 Safe area

Safe-area ownership applies to supported iPhone and iPad environments, including Safari and installed Home Screen Web App presentation.

Required back/home/answer/command/continue controls must not be hidden beneath status/chrome/home-indicator areas.

## 2.6 Runtime Continuity

Viewport resize, portrait↔landscape rotation and responsive Layout Surface change are **presentation events**, not new gameplay/learning transactions.

Presentation response alone must not replace/remount the active interaction owner when doing so loses meaningful in-progress state.

Meaningful active interaction state includes, where applicable:

- current question identity and unsubmitted input/selection
- current attempt/progress
- open Capture or forced-switch contextual subflow
- current Dex item/detail and owned browse context
- active confirmation/result/reward acknowledgement
- Parent unsubmitted input and meaningful gate state

Presentation change must not by itself cause:

- question regeneration or question-ID change
- unsubmitted input/selection loss
- attempt reset
- duplicate answer submit/reward
- Battle recreation, duplicate turn, duplicate ticket reserve/commit/refund
- Capture silent close/reset/restart, duplicate attempt/result/settlement
- Evolution acknowledgement silent dismissal or duplicate domain execution/reward
- route/profile reset
- loss of current semantic item/context in Dex
- loss of meaningful Parent input/gate state solely because presentation changed

Exact animation-frame preservation is **not** required. Capture/Evolution visual presentation may resume, normalize to an equivalent frame, or complete according to an explicit owner policy. However it must not silently dismiss acknowledgement, repeat execution/settlement, or return to a semantically different transaction.

Exact numeric `scrollY` preservation is not required after reflow. Preserve semantic position: current item/question/detail/anchor and a usable route to the current primary action.

### Dex cumulative authority from D-020

D-021 does **not** replace or weaken CURRENT D-020 Dex browse/history/cache semantics.

For Dex, resize/rotation continuity must preserve the D-020-owned context as applicable:

- area
- type
- search
- filter-panel state
- ordered result set
- selected species
- anchor species
- viewport offset semantics
- browser-history provenance
- Grid→Detail `pushState`
- detail previous/next `replaceState`
- shared `restoreDexContext()` restoration semantics
- same-session remount recovery

AC-RSP is an **additional responsive gate** on top of D-020 / `10-DEX*` / `10A-DEX*`; it is not a substitute and does not relax those gates.

## 2.7 Explicit mapping

| Product state | Navigation owner | Layout Surface |
|---|---|---|
| Home | App shell | Compact |
| Study hub | Study | Compact |
| Activity / free / review / trial / dictionary | Study focused flow | Workspace |
| Adventure map/browse | Adventure | Compact |
| Battle | Adventure/Battle | Contextual interactive |
| Capture | Battle focused substate | Contextual interactive |
| Monster team/box | Monster | Compact |
| Dex | Monster/Dex | Workspace |
| Evolution | Full-screen reward | Contextual interactive |
| HowTo | Help | Compact |
| Parent | Protected adult | Workspace |

This mapping may change only by explicit product decision. It must not be inferred from CSS classes or App-level view membership.

## 2.8 Added anti-patterns

Do not:

- detect iPad layout through UA/device name
- create screenshot-specific tablet fixes when the failure class can be solved by the surface contract
- repair oversized required descendants with additional clipping
- stretch every child surface to full tablet width
- use `FOCUSED_APP_VIEWS` as layout-width authority
- remount/replace active interaction owners solely for presentation when meaningful local state would be lost
- unlock landscape in production before layout/continuity acceptance passes

---

# 3. Exact delta for 08-ACCEPTANCE-TEST-CONTRACT.md

The existing mobile flow remains required. Add the following responsive canonical gate.

## AC-RSP-001 — Representative supported range

Automated representative fixtures include:

- existing mobile baseline: `375 / 390 / 430` portrait
- Compact-boundary smoke: approximately `540–560px` width
- tablet portrait: approximately `820x1180`
- tablet landscape: approximately `1180x820`
- reduced tablet/multi-window: approximately `600px` width
- low-height smoke: approximately `820x600` or equivalent deterministic short-height fixture

These values are representative layout fixtures, not device-model contracts.

## AC-RSP-002 — Mobile baseline non-regression

Tablet support must not regress existing 375–430px first-decision, safe-area, touch-target and screen-ownership behavior.

## AC-RSP-003 — Critical geometry, not document scroll only

`documentElement.scrollWidth` / `body.scrollWidth` alone are insufficient.

For required interactive surfaces, automated geometry must verify required descendants remain inside the intended visible bounds of their relevant bounded/clipping ancestor unless overflow is explicitly approved.

Minimum targets:

- question/passage
- choice grid
- interaction/keypad
- fixed learning feedback where it can cover decisions
- Battle commands
- Capture decision/result
- Evolution continue
- Dex grid/detail/search
- Adventure search where active
- Parent PIN/forms

Ancestor clipping does not convert missing required content into PASS.

## AC-RSP-004 — Layout Surface leakage gate

Representative Compact, Workspace and Contextual-interactive behavior must be observable without asserting a class name.

- Compact stays centered/readable and does not expand without limit.
- Workspace must not remain globally constrained by the Compact ~520px ceiling merely because it shares the app shell; its owning outer surface must be capable of exceeding Compact on representative tablet width.
- Contextual interactive likewise must not inherit Compact solely because it is rendered inside a top-level owner.
- The gate does not require an exact measured `760px`; it prevents Compact-ceiling leakage.

## AC-RSP-005 — Learning deep rotation

Start a deterministic question, create meaningful in-progress state, resize portrait→landscape, verify:

- same question identity/context
- same unsubmitted input/selection where applicable
- same attempt/progress semantics
- active owner/substate not silently reset
- no duplicate submit/reward
- primary action reachable

## AC-RSP-006 — Battle/Capture deep rotation

During deterministic active Battle, resize/rotate and verify:

- same active Battle identity
- no duplicate ticket reserve/turn/settlement
- if Capture or another contextual subflow is open, same semantic subflow remains active
- unsubmitted Capture choice remains semantically preserved where applicable
- exact animation frame may differ, but no throw/result/settlement replay and no silent return to a different Battle state

## AC-RSP-007 — Evolution acknowledgement continuity

While an Evolution reward/reveal is active, resize/rotate and verify:

- same `from → to` reward context
- acknowledgement remains active
- continue action remains reachable
- evolution/domain mutation/reward is not executed again
- exact animation frame need not be identical

Implementation smoke should cover both Monster-origin and Battle-origin evolution paths when their responsive owner structures differ.

## AC-RSP-008 — Dex cumulative D-020 continuity

Responsive Dex acceptance is cumulative with D-020.

Resize/rotation must not weaken the existing D-020 browse/history restoration contract. The test may reuse existing D-020 acceptance rather than duplicate it, but responsive delta must demonstrate that presentation change preserves the applicable:

- area/type/search/filter
- ordered result
- selected/anchor species
- viewport-offset semantics
- history provenance
- shared restore behavior

AC-RSP-008 does not replace `10A-DEX-OFFLINE-ART-PACK-ACCEPTANCE.md` AC-DEX-UX/PERF gates.

## AC-RSP-009 — Semantic position, not exact pixels

For list/detail and top-level return flows, assert current semantic item/anchor and owner restoration rather than requiring the old numeric `scrollY` after reflow.

## AC-RSP-010 — Low-height and keyboard

Representative landscape/low-height checks require:

- current primary CTA/command reachable
- fixed/sticky/feedback/overlay does not permanently cover it
- modal/sheet content remains operable
- Parent PIN/forms, Dex search and Adventure search remain operable with software keyboard
- Parent must not relock solely because responsive presentation changes

## AC-RSP-011 — Actual iPad Safari and standalone

Before production release of orientation unlock, actual-device smoke is required on the release's supported generally available iPadOS target(s) for both:

1. Safari browser
2. Home Screen installed Web App / standalone

Minimum manual smoke:

- portrait launch
- landscape rotation
- Learning rotation
- Battle/Capture rotation
- Evolution acknowledgement rotation
- Parent + keyboard
- Dex/Adventure search + keyboard where applicable
- representative reduced/multi-window behavior where supported

Playwright WebKit resize is necessary evidence but does not replace actual iPadOS standalone-shell verification.

## AC-RSP-012 — Existing installed PWA upgrade release gate

Verify an already-installed ManaEvo Home Screen Web App upgrading from the prior portrait-preference version.

**PASS:** through the supported normal update lifecycle, the existing installed app reaches the target behavior where ManaEvo no longer imposes the prior portrait orientation preference and can use supported portrait/landscape presentation.

Fresh install/reinstall may be diagnostic comparison evidence, but does **not** by itself make the existing-install upgrade gate pass.

If a demonstrated platform limitation prevents target behavior, production release remains **BLOCKED** until a separately reviewed compatibility/remediation policy defines affected clients, acceptable behavior/user action, remediation/communication and release exit criterion.

“Observed/diagnosed” alone is not PASS.

## AC-RSP-013 — Orientation unlock sequencing

The manifest portrait restriction must not be removed/released merely because policy is approved.

Before orientation unlock is available for release verification, AC-RSP-001 through AC-RSP-010 must pass for the implementation candidate.

AC-RSP-011 and AC-RSP-012 are mandatory production-release gates after the orientation change can be tested on actual device/installed client.

## AC-RSP-014 — Visual regression is supplemental

Screenshots may supplement the gate. They do not replace geometry/state assertions. Canonical success is un-clipped usable behavior and transaction/interaction continuity, not pixel identity across viewport classes.

---

# 4. Exact delta for 07-SAVE-PROFILES-PARENT-PWA.md

## PWA orientation and presentation environment

ManaEvo supports portrait and landscape when the operating environment permits them. ManaEvo therefore defines **no preferred application orientation** in canonical PWA policy.

Target manifest state: **omit the `orientation` member** rather than keep `portrait-primary`.

`orientation:any` is not required; the semantic requirement is no ManaEvo-imposed orientation preference. A future explicit value requires separate review.

### Release ordering

CURRENT `orientation: portrait-primary` is a known implementation delta. It must not be removed in isolation.

Required order:

1. D-021 canonical tablet contract approved
2. fail-first responsive/geometry/continuity acceptance exists
3. Compact/Workspace/Contextual behavior passes
4. low-height and active interaction continuity pass
5. then remove portrait preference in implementation candidate
6. actual Safari and installed Home Screen Web App verification
7. existing installed PWA upgrade gate
8. production release only when upgrade is PASS or a separately reviewed compatibility/remediation policy explicitly resolves a demonstrated platform limitation

### Safari vs Home Screen Web App

Safari browser and installed standalone/Home Screen presentation are separate release environments. Do not infer Safari-tab behavior from manifest orientation behavior.

### Existing installed clients

Production acceptance requires more than diagnosis. Existing installed ManaEvo PWA must reach target no-ManaEvo-orientation-preference behavior through the supported normal update lifecycle.

Fresh install/reinstall is diagnostic only and does not substitute for existing-install upgrade PASS.

If a demonstrated platform limitation prevents target behavior, release stays blocked until a separately reviewed compatibility/remediation policy defines:

- affected installed clients
- acceptable interim behavior, if any
- required user action, if any
- communication/remediation approach
- release exit criterion

---

# 5. Exact proposed Decision Log entry

## D-021 iPad/tabletをviewport capabilityとして正式supportする

- Status: **PROPOSED / USER-DECISION — independent design review pending**
- Prior CURRENT: 375〜430px級iPhone portraitがprimary UI/Acceptance contractで、iPad/tablet portrait/landscape/reduced-window/rotationは正式release gateではなかった。CURRENT D-020はDex Offline Art Pack / Detail UXのlater authorityであり、本Decisionはそれを置換しない。
- Runtime before decision: global shellは概ね`max-width:520px`。学習nested layoutには`94–96vw`等が残り、ancestor clippingと組み合わさるとtabletでrequired contentが欠損し得る。manifestは`orientation: portrait-primary`。PlaywrightはiPhone/WebKit中心。またBattle/Capture/Evolution/Dex/Parentにはdomain stateとは別のmeaningful local interaction stateがあり、presentation-only remountで失われる余地がある。
- Evidence of approval: 2026-09-01 iPad実機のportrait lock/right-side clippingを契機に、個別bug修正より先にtablet supportをproduct contract化することをユーザーが承認。独立レビューでNavigation/Layout分離、active interaction continuity、Evolution rotation、non-Compact leakage gate、existing-install pass/failを補強。V1.2ではfresh CURRENT `b5f06dc...` と既存D-020へ再接続。
- Decision — support: existing 375〜430px mobile baselineを維持し、iPad-class full-screen portrait/landscapeおよびreduced multi-windowをsupported presentationへ追加。device/UAではなくcurrent available layout viewportをauthorityとする。
- Decision — axes: Navigation ownership / Layout Surface / Runtime Continuityを独立contractとし、TOP LEVEL/FOCUSED/CONTEXTUALをwidth policyの代用にしない。
- Decision — layout: `Compact ≈520px`、`Workspace outer ≈760px`、`Contextual interactive outer ≈760px / primary decision ≈620–680px`をinitial directionとする。bounded nested componentはparent-relative sizingを基本とし、viewport `vw`を通常bounded childの独立width authorityにしない。Workspace/ContextualをCompact ceilingへ誤拘束しない。
- Decision — continuity: resize/rotation/layout-surface changeはpresentation event。新しいquestion/battle/capture/evolution transactionを開始せず、meaningful active interaction substateもpresentation-only remountで失わせない。exact animation frameは必須でないがsilent dismiss/reset、duplicate execution/settlement/reward/turn/ticketを禁止。semantic positionを維持する。
- Decision — Dex cumulative authority: D-021はD-020のDex cache/browse/history semanticsをsupersede/relaxしない。area/type/search/filter/result order/selected species/anchor/viewport offset/history provenance/shared restore/remount recoveryをresponsive continuityでも維持し、AC-RSPはD-020 acceptanceへの追加gateとする。
- Decision — height/safe area: landscape/keyboard/browser chrome/standalone/reduced-windowでprimary action reachableを要求し、safe areaをsupported tabletにも適用。
- Decision — PWA orientation: canonicalはorientation preferenceを持たず、target manifestは`orientation`を省略。layout/continuity成立後にのみunlockし、Safari/standaloneを別環境で実機確認。
- Decision — existing installed PWA: normal supported update lifecycleで既存installがtarget behaviorへ到達することをrelease PASS条件とする。fresh install/reinstallはdiagnosticのみ。demonstrated platform limitationなら別途reviewed compatibility/remediation policy承認までrelease BLOCK。
- Decision — tests: representative viewport smoke + Compact-boundary smoke + critical clipping-ancestor geometry + deep Learning/Battle-Capture/Evolution continuity + cumulative Dex D-020 continuity + actual iPad Safari/standalone + existing-install gate。
- Rejected: UA/model sniffing、screenshot-specific patch、overflow clipで欠損隠蔽、全画面tablet full-width化、FOCUSED classificationをwidth authority化、state-losing presentation remount、orientation-only release、reinstallだけでupgrade PASS扱い。
- Reason: direct causesはorientationとlayoutで別だが、両方ともtabletがproduct support/acceptance外だったため出荷可能だった。Navigation/Layout/Runtimeを分離し、D-020等のlater domain authorityと累積させることで同種の分類漏れ・state lossを再発させない。
- Affected areas: UI / Study / Battle / Capture / Dex / Evolution / Parent / responsive layout / PWA manifest policy / release acceptance / WebKit + actual-device verification。game rules/save semantics/D-020 Dex cache/history domain contractは変更しない。
- Tests required: existing 375/390/430 / 540–560 boundary / tablet portrait+landscape+reduced+low-height / critical geometry / Learning input continuity / Battle-Capture substate / Evolution acknowledgement / D-020 Dex continuity / keyboard / actual Safari / actual standalone / existing installed upgrade / full regression.

Promotion rule: independent review must return `DESIGN PASS — IPAD/TABLET SUPPORT CONTRACT READY FOR CANONICAL PROMOTION` before D-021 becomes CONFIRMED and before the four target canonical files are synchronized.

---

# 6. Implementation order fixed by design

After canonical promotion only:

1. Contract promotion
2. fail-first acceptance tests
3. explicit Layout Surface ownership
4. nested sizing repair
5. contextual + low-height + safe-area audit/repair
6. runtime continuity proof including meaningful local substate and cumulative D-020 Dex semantics
7. manifest orientation unlock in implementation candidate
8. full unit/WebKit/build regression
9. actual iPad Safari + Home Screen Web App + existing-install gate
10. production release only after all required gates pass

Do not move orientation unlock before steps 2–6.

---

# 7. Independent review gate

Fresh-read at least:

- CURRENT `main`
- `design/rebuild/DECISION-LOG.md` including D-020
- `design/current/06-UI-SCREEN-CONTRACT.md`
- `design/current/08-ACCEPTANCE-TEST-CONTRACT.md`
- `design/current/07-SAVE-PROFILES-PARENT-PWA.md`
- current Dex `10-*` / `10A-*` authority
- `public/manifest.webmanifest`
- `src/navigation/viewOwnership.js`
- `src/App.jsx`
- current Study/Battle/Capture/Dex/Evolution/Parent layout and local-state owners
- responsive and release-PWA WebKit tests

Promotion criterion:

> From 375px-class mobile through full/reduced iPad portrait/landscape, can canonical text alone determine whether the active primary decision remains un-clipped/reachable, the same semantic transaction and meaningful interaction substate survive presentation changes, existing D-020 Dex semantics remain cumulative, and installed-PWA upgrade has a release PASS/BLOCK rule?

Required verdict exactly one:

- `DESIGN PASS — IPAD/TABLET SUPPORT CONTRACT READY FOR CANONICAL PROMOTION`
- `DESIGN PASS WITH CHANGES — REVISE BEFORE PROMOTION`
- `DESIGN BLOCKED — DO NOT PROMOTE OR IMPLEMENT`

No runtime/CSS/manifest/test implementation, canonical synchronization, merge or production deployment is authorized by this candidate.
