# ManaEvo Canonical Draft — UI Screen Contract

- Phase: Rebuild Phase 1.5 / Worker 5
- Status: **CANONICAL DRAFT — implementation locked**
- Date: 2026-08-25
- Scope: UI/UX screen purpose, state ownership, navigation and disclosure contract only. `src/**`, CSS, tests and PWA implementation are out of scope.

## 0. Authority and evidence

This draft follows the rebuild authority order: user explicit decisions > FINAL-CORRECTED baseline > approved later changes > current canonical > data master > runtime > historical reviews.

Commander review confirms the exact FINAL-CORRECTED archive contains 32 original files and specifically identifies `00-START-HERE.md`, `03-screens-catch-and-raise.md`, `08-gameplay-state-spec.md`, `09-implementation-traceability.md`, `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md`, and `13-EXECUTION-FLOW.md` as baseline sources.

Baseline facts relevant to this contract that have been independently confirmed in Phase 1 evidence:

- The product loop is learning → ticket → adventure → battle → capture/GET → raise → evolution → next place.
- FINAL-CORRECTED used a post-victory CAPTURE state machine; later user decision UDE-002 explicitly supersedes this with in-battle capture once enemy HP is 50% or lower, max three throws, and current ring multipliers.
- Capture UI must make the selected ring's real success chance, owned quantity and throw count visible before throwing and has a four-stage star judgment presentation.
- Raising/detail must expose the next normal evolution and the remaining level or required item when that information is actionable.
- Later user-approved world/self-evolution direction in `design/20-world-map-evolution-progression.md` is retained: children should feel that they met, raised and evolved their own monster rather than simply collecting already-strong final forms.
- No.239 is source/reference only; active game/dex scope is No.001–238 (UDE-001).

The immutable exact baseline payload has not yet landed on the Worker 5 branch, so this draft does **not** invent line-level claims for unavailable original files. Where later design and runtime disagree with recovered baseline/user evidence, the higher authority above wins.

---

# 1. Cross-screen rules

## 1.1 One child decision per normal state

Every normal child-facing screen must answer one question first. Secondary choices are progressively disclosed after the child acts. A screen is not allowed to expose every available feature just because the data exists.

## 1.2 Navigation ownership

Permanent child navigation owns only the top-level destinations:

- Home
- Study
- Adventure
- Monster
- HowTo

Parent is protected and entered intentionally, not a normal child tab.

Battle, Capture, Dex and Evolution are contextual states/destinations, not additional permanent bottom tabs.

## 1.3 Progressive disclosure

Normal state must show what is necessary for the next decision. Search, filters, detailed rules, full move lists, advanced special-form explanation, reward economy and long tutorial prose belong behind explicit secondary actions unless immediately required.

## 1.4 Visual authority

A screen contract owns its visual hierarchy. CSS load order, stronger selectors and `!important` are not allowed to define product authority. A later implementation phase must converge legacy/new layers rather than add another override layer.

## 1.5 Art authority

Monster presentation must eventually resolve through one MonsterArt contract: formal art when available, explicitly marked placeholder otherwise. Screen code must not independently choose among multiple formal/legacy/generated sources.

---

# 2. Home

## PURPOSE
Let the child understand **what to do next today** within one glance while preserving the emotional pull of the current partner, current place and next evolution.

## PRIMARY CTA
Exactly one contextual primary CTA:

- daily learning incomplete → `まなぶ！`
- learning complete + usable ticket → `ぼうけんへ！`
- an immediately actionable evolution is the strongest pending reward → `シンカする！`

Other top-level destinations remain available through navigation but must not compete visually with the primary CTA.

## MUST SHOW
- current partner art, name and Lv
- today's learning completion/progress in compact form
- usable ticket count
- actual current adventure location (area/zone), not merely highest unlocked area
- next evolution target/progress when one exists
- one clear primary CTA

## MUST NOT SHOW
Normal Home must not show:

- the full six-step game loop as a permanent strip
- a permanent multi-line game manual
- full capture rules or ring economy
- full evolution-method tutorial
- full special-form tutorial
- multiple same-weight primary CTA buttons
- Parent settings detail
- giant status dashboards whose values do not change the next action

## CHILD DECISION
`いま、まなぶ？ ぼうけんする？ それともシンカする？` — the UI chooses which one deserves primary emphasis from state.

## ENTRY
- app launch/resume when no focused flow is active
- top-level Home navigation
- completion of a flow that explicitly returns Home

## EXIT
- primary contextual CTA
- top-level navigation
- protected Parent entry from a secondary link/menu

## OVERLAY/MODAL
- small one-time reward/unlock toast is allowed
- no tutorial modal on every entry
- no nested navigation modal

## STATE
- `LEARNING_REQUIRED`
- `ADVENTURE_READY`
- `EVOLUTION_READY`
- `NO_TICKET_AFTER_CLEAR`
- `GENERAL`

## KEEP
- partner prominence
- current location
- next evolution motivation
- compact learning/ticket state
- clear route into Study/Adventure

## REMOVE
- permanent six-step explanation panel
- permanent game-explanation panel
- duplicated status information already present in header
- verbose Parent/HowTo descriptions on Home

## REBUILD
Home hierarchy from “dashboard of everything” to “today's next action + partner motivation.”

---

# 3. Study

## PURPOSE
Complete today's required learning with minimal friction while preserving the Kids Quest learning logic/source-of-truth behavior.

## PRIMARY CTA
`つづきの まなび` / the next required task. If multiple required subjects are intentionally selectable, those required tasks are the first decision surface.

## MUST SHOW
- grade/profile context in child-readable form
- today's required progress
- remaining required subjects/tasks
- question count or effort estimate where useful
- completion/reward result after required work is finished
- `わからない` where the learning engine defines it

## MUST NOT SHOW
Normal required-study state must not show:

- “Kids Quest 学習エンジン” implementation terminology to children
- every optional mode at equal visual weight before required work
- game-wide capture/evolution instructions
- Parent-only difficulty/advance configuration controls
- duplicate progress produced by both `kids-quest-study` and `src/study`

## CHILD DECISION
`つぎに どの ひつような まなびを やる？`

## ENTRY
- Home primary CTA when learning is required
- top-level Study navigation
- return from an activity/review/trial subflow

## EXIT
- after daily completion: reward confirmation → Home or Adventure
- top-level navigation when not inside a focused question activity

## OVERLAY/MODAL
- question feedback/hint/audio controls may be local overlays
- completion reward may be a short focused celebration
- Parent configuration must not be an overlay inside child Study

## STATE
- `REQUIRED_IN_PROGRESS`
- `REQUIRED_COMPLETE`
- `FREE_STUDY`
- `REVIEW`
- `TRIAL`
- `DICTIONARY`
- `ACTIVITY_FOCUS`

## KEEP
- Kids Quest learning engine behavior and learning records
- required-task progression
- free study/review/trial/dictionary as valid secondary modes
- reward handoff to the game

## REMOVE
- child-facing engine/migration terminology
- equal-weight optional-mode menu before the required task decision
- visual shell switch that makes Study feel like a different app

## REBUILD
Unify ManaEvo shell around the existing learning logic. Required learning first; secondary learning modes revealed after or via a secondary action.

---

# 4. Adventure

## PURPOSE
Choose **where to go and what one ticket is worth spending on** while making world progression and danger understandable.

## PRIMARY CTA
After selecting an encounter: `バトルへ` / `ちょうせんする`.

## MUST SHOW
- one world/area navigation representation
- current area and current zone
- zone recommended Lv/danger
- locked/unlocked state and concise unlock reason when relevant
- normal “today's encounters” limited to at most five meaningful candidates
- ticket cost before battle start
- candidate monster/encounter art as the visual focus
- `ほかも さがす` as an explicit transition into browse mode

## MUST NOT SHOW
Normal Adventure state must not show:

- **world map route and duplicate Area tabs at the same time**
- search box permanently
- kind/type filters permanently
- a huge all-stage list initially
- all zones, all stages, all rules and all unlock conditions simultaneously
- duplicate navigation back to Home that competes with global nav unless required by focused-state ownership
- full Dex-like metadata on each encounter card

## CHILD DECISION
First: `どこへ いく？` Then, within the selected zone: `きょう どれに 1まい つかう？`

## ENTRY
- Home primary CTA after learning/ticket condition
- top-level Adventure navigation
- Battle result returning to the same saved area/zone

## EXIT
- encounter selection → Battle
- top-level navigation while no battle is active

## OVERLAY/MODAL
- encounter detail sheet may show expanded rewards/unlock info before confirmation
- full browse/search is a distinct `BROWSE_ALL` state, not an always-visible layer

## STATE
- `WORLD_SELECT`
- `ZONE_SELECT`
- `TODAY_ENCOUNTERS`
- `BROWSE_ALL`
- `LOCKED_EXPLANATION`

The implementation may combine WORLD_SELECT/ZONE_SELECT visually, but it must not duplicate the same area selector twice.

## KEEP
- world-first sense of place from design/20–22
- entrance/mid/deep zone progression
- recommended Lv/danger cue
- at-most-five normal encounter candidates
- saved `adventureLocation`
- “other search” as an intentional secondary mode

## REMOVE
- simultaneous `.world-area-route` + `.world-area-tabs`
- always-visible `.stage-filters`
- always-visible `.monster-search`
- normal full master-stage list

## REBUILD
A single progressive path: world/area → zone → up to five encounters → battle. Browse-all is entered only on request.

---

# 5. Battle

## PURPOSE
Make one tactical choice at a time while clearly showing the battle state and preserving the emotional focus on the two monsters.

## PRIMARY CTA
State-dependent action surface:

- normal turn → one of the available moves
- forced switch → choose next teammate
- capture available and child opens capture → Capture state
- result → continue/map or immediate Evolution if ready

## MUST SHOW
- enemy and active ally art
- names/Lv/types as needed for decision
- HP and clear HP bars
- available moves/actions for the current turn
- immediate boss telegraph or special active state when it changes the decision
- compact access to `わを なげる` when capture is eligible
- concise result/reward after battle finishes

## MUST NOT SHOW
Normal battle turn must not show:

- expanded ring grid before the child chooses Capture
- permanent full capture tutorial
- permanent four-point “battle tips” panel
- permanent full team list when no switch decision is required
- every special-form explanation rather than only usable action/status
- long scrolling battle log competing with current action
- result controls before battle ends

## CHILD DECISION
`このターン、なにをする？`

## ENTRY
- Adventure encounter confirmation consumes ticket and creates active battle

## EXIT
- win/catch/loss result → Adventure at same location
- immediate Evolution when earned/ready
- explicit abandon path under battle refund rules

## OVERLAY/MODAL
- Capture is a focused battle substate/overlay
- forced-switch chooser may replace normal action area
- Evolution after result is a full-screen overlay/state
- abandon confirmation may be modal

## STATE
- `TURN`
- `BOSS_TELEGRAPH`
- `FORCED_SWITCH`
- `CAPTURE_FOCUS`
- `WON`
- `CAUGHT`
- `LOST`
- `RESULT`

## KEEP
- battle arena and monster prominence
- four-move model where game rules define it
- protect/special actions when actionable
- HP<=50% capture eligibility from UDE-002
- direct evolution CTA on result when ready

## REMOVE
- permanent expanded capture panel
- permanent battle tips
- permanent team switch list
- verbose special-form descriptions during ordinary turns

## REBUILD
Turn-focused command area that swaps content by battle state instead of stacking every subsystem vertically.

---

# 6. Capture

## PURPOSE
Choose one ring with full information, throw it, and experience the four-stage capture judgment without distraction.

## PRIMARY CTA
Select a ring → `なげる`.

## MUST SHOW
Before throw:
- enemy HP/current eligibility
- four ring choices
- owned count for each
- actual success chance for each available ring
- current throw count / remaining attempts (`0/3`–`3/3` equivalent)
- selected ring clearly

During throw:
- temporal four-stage star/judgment presentation
- success/failure outcome

After failure:
- clear return to battle/enemy response according to game rules

## MUST NOT SHOW
- normal move grid simultaneously active behind the capture decision
- full battle tips
- full team management
- world navigation
- irrelevant evolution/special-form explanations
- all four star results prefilled before the animation resolves

## CHILD DECISION
`どの「わ」を つかう？`

## ENTRY
- Battle when enemy HP is 50% or below, capture is allowed, and attempts remain

## EXIT
- success → caught/result state
- failure → Battle turn flow after enemy response
- cancel before throw → Battle turn
- attempts exhausted → Battle without capture action

## OVERLAY/MODAL
Capture is a focused in-battle sheet/full-screen substate. Underlying battle content may remain visually contextual but must be noninteractive.

## STATE
- `SELECT_RING`
- `THROWING_STAGE_1`
- `THROWING_STAGE_2`
- `THROWING_STAGE_3`
- `THROWING_STAGE_4`
- `SUCCESS`
- `FAILURE`
- `EXHAUSTED`

## KEEP
- four rings
- real chance display
- owned quantity
- max three throws
- UDE-002 multipliers/HP rule
- four-stage judgment presentation

## REMOVE
- permanently expanded capture controls from ordinary Battle
- capture explanation repeated every turn

## REBUILD
Capture as a short focused decision-and-reward sequence, not a permanent Battle section.

---

# 7. Monster

## PURPOSE
Choose a teammate to **raise/manage now**, with the team and next evolution as the primary motivation.

## PRIMARY CTA
Contextual to selected monster:
- evolution ready → `いま シンカする！`
- otherwise the strongest relevant management action (team change / needed item equip) is secondary; selection itself remains the main interaction.

## MUST SHOW
- current 3-member team first
- selected monster art, name, Lv, type
- concise core stats
- next normal evolution/progress/required item
- team membership controls when relevant
- explicit links/modes for Box and Dex without rendering them all at once

## MUST NOT SHOW
Normal team/detail state must not show:

- Team + entire Box + entire Dex simultaneously
- permanent full move encyclopedia unless requested
- permanent “three evolution methods” tutorial
- permanent “why evolution matters” tutorial
- full Giga/Burst eligibility/rule explanation for every selected monster
- large explanatory prose that does not change the current management decision

## CHILD DECISION
`だれを そだてる／チームにする？`

## ENTRY
- top-level Monster navigation
- capture result shortcut if appropriate
- Home partner shortcut

## EXIT
- top-level navigation
- Evolution when selected monster meets conditions
- Dex/Box as local modes

## OVERLAY/MODAL
- Evolution full-screen state
- move detail, item equip or special-form detail may be sheets

## STATE
- `TEAM`
- `DETAIL`
- `BOX`
- `DEX_ENTRY`
- `SPECIAL_DETAIL`
- `EVOLUTION_READY`

## KEEP
- team-first presentation from design/22
- large formal art
- name/Lv/type/stats
- next evolution as highest-value raising information
- Box and Dex access

## REMOVE
- permanently expanded evolution method guide
- permanently expanded evolution explanation card
- permanently expanded Giga/Burst cards
- duplicated detail beneath every list mode

## REBUILD
Team first, one selected monster detail, secondary detail on demand. Separate conceptual jobs even if kept within one routed feature.

---

# 8. Dex

## PURPOSE
See discovery/collection progress and inspect a species without turning Monster management into a database screen.

## PRIMARY CTA
Select a species tile to inspect it.

## MUST SHOW
- `GET x/238`
- `はっけん x/238`
- grid-first species overview
- unknown silhouette / seen / caught distinction
- No.001–238 active scope only
- species art/name/No. when unlocked by discovery rules

## MUST NOT SHOW
Normal Dex state must not show:

- No.239 in active progress denominator/list
- search + all filters as mandatory permanent first-view chrome if they crowd the grid
- team management controls
- full raising/evolution tutorial
- every species' full stats/moves inline in the grid

## CHILD DECISION
`どのモンスターを みる？`

## ENTRY
- Monster → Dex
- contextual unlock/registration shortcut after Evolution/Capture may enter a species detail

## EXIT
- back to Monster
- close species detail to Dex grid

## OVERLAY/MODAL
- species detail sheet/page
- filter/search controls can expand on request

## STATE
- `GRID`
- `SEARCH_FILTER`
- `SPECIES_DETAIL`

## KEEP
- three-column-style compact grid direction where device width allows
- unknown/seen/caught visual distinction
- collection counts
- formal art when available

## REMOVE
- active No.239
- database-like always-expanded controls

## REBUILD
Grid first; search/filter/detail progressively disclosed.

---

# 9. Evolution

## PURPOSE
Deliver the emotional payoff that **the child raised this monster into its new form** and clearly communicate what became stronger/unlocked.

## PRIMARY CTA
`つづける！`

## MUST SHOW
- before → after identity/art
- new species name
- clear evolution celebration
- meaningful stat gains
- newly unlocked discovery/location information when applicable
- wording that reinforces self-raised evolution

## MUST NOT SHOW
- bottom navigation during the reveal
- unrelated Monster tabs/Box/Dex controls
- long evolution-method tutorial
- special-form tutorial unless the evolution itself unlocks a relevant next step, and then only concise context
- multiple competing CTAs

## CHILD DECISION
No strategic choice during the reveal; the intended action is to enjoy the reward and continue.

## ENTRY
- Monster evolution action
- Battle result immediate-evolution action

## EXIT
- return to originating context with updated species and unlock state

## OVERLAY/MODAL
Full-screen focused state/overlay with modal semantics and background interaction disabled.

## STATE
- `INTRO`
- `TRANSFORM`
- `REVEAL`
- `REWARD_SUMMARY`

## KEEP
- full-screen celebration direction
- before/after art
- stat gains
- Dex/area unlock feedback

## REMOVE
- ordinary page chrome/navigation during evolution
- explanatory clutter

## REBUILD
Treat evolution as a reward sequence with temporal stages, not merely a detail-card mutation.

---

# 10. HowTo

## PURPOSE
Answer the child's current “how do I…?” question quickly and let them return to play.

## PRIMARY CTA
Context-sensitive `つづけて あそぶ` leading to the most relevant current destination; otherwise the selected help topic itself is the first action.

## MUST SHOW
- short core loop
- current partner/next evolution hint when useful
- clear help topics: learning, adventure, battle/capture, raising/evolution, special forms/rewards
- concise answer first, detail on expansion

## MUST NOT SHOW
Normal HowTo landing state must not show:

- all seven+ steps fully expanded
- all evolution methods fully expanded
- all reward economy cards fully expanded
- full Giga/Burst manual fully expanded
- repeated copies of rules already visible contextually in Battle/Monster
- implementation terminology

## CHILD DECISION
`なにを しりたい？`

## ENTRY
- top-level HowTo navigation
- contextual help link from a screen when needed

## EXIT
- return to originating screen where possible
- relevant destination CTA after answer

## OVERLAY/MODAL
Accordion/topic detail is preferred; no deep modal stack.

## STATE
- `TOPICS`
- `TOPIC_DETAIL`
- `CONTEXTUAL_HELP`

## KEEP
- child-readable language
- contextual next-evolution help
- direct links back into gameplay

## REMOVE
- always-expanded manual wall
- duplicated exhaustive reward/special-form explanations on landing

## REBUILD
Topic-based progressive help. “Answer the current question” rather than “show the whole design document.”

---

# 11. Parent

## PURPOSE
Protect adult-only configuration and present settings without leaking adult controls into the child flow.

## PRIMARY CTA
Locked state: `保護者メニューを ひらく` after valid PIN/adult check. Unlocked state: the adult's selected settings action.

## MUST SHOW
- clear protected/adult-only identity
- PIN/adult check flow
- recovery/reset path under the established local protection model
- adult settings only after unlock
- explicit exit that relocks

## MUST NOT SHOW
- Parent as a normal child bottom-navigation destination
- child game CTA competing with the gate
- adult settings before successful gate
- child tutorial content inside the Parent settings screen

## CHILD DECISION
None. This is an adult-controlled destination; the child should encounter only a clear protected boundary.

## ENTRY
- secondary protected entry from Home/menu

## EXIT
- explicit close/back relocks and returns to Home/origin

## OVERLAY/MODAL
The gate is a focused screen. Settings may use adult dialogs as needed after unlock.

## STATE
- `PIN_SETUP`
- `PIN_LOCKED`
- `RECOVERY`
- `UNLOCKED`

## KEEP
- ParentGate concept
- 4-digit PIN/local lock behavior
- adult check for setup/recovery
- grade/advance/difficulty/audio/profile/backup settings ownership

## REMOVE
- implicit Kids Quest visual-shell switch as a product boundary
- any child-facing navigation inside adult settings

## REBUILD
Keep the gate behavior, but present the unlocked adult area as a deliberate ManaEvo adult shell rather than a transplanted app screen.

---

# 12. State ownership map

| Product state | Owner | Permanent top-level nav? |
|---|---|---|
| Home | App shell | Yes |
| Study hub | Study | Yes |
| Study activity/free/review/trial/dictionary | Study focused flow | No separate tab |
| Adventure map | Adventure | Yes |
| Battle | Adventure/Battle flow | No |
| Capture | Battle focused substate | No |
| Monster team/box | Monster | Yes |
| Dex | Monster/Dex local route | No separate bottom tab |
| Evolution | Full-screen reward state | No |
| HowTo | Help | Yes |
| Parent | Protected adult flow | No child tab |

# 13. Implementation gate for Phase 2

UI implementation remains locked until commander promotes/reconciles this draft into current canonical specs. When unlocked, acceptance must verify behavior rather than CSS order:

1. At 390px iPhone width, each normal screen exposes one dominant child decision above unnecessary detail.
2. Adventure normal state has one area-navigation representation, no permanent search/filter, and at most five encounter candidates.
3. Battle normal turn does not permanently expose Capture, tips and team management together.
4. Capture shows chance/count/attempts before throw and runs a four-stage temporal judgment.
5. Monster normal state does not show Team, Box, Dex, evolution tutorial and special-form tutorial simultaneously.
6. Home does not become the game's manual.
7. Study retains Kids Quest learning behavior but no longer feels like a second app shell.
8. Evolution is a focused reward state.
9. Parent is isolated from child navigation.
10. Tests assert child flow, first-viewport hierarchy and state ownership; no test may make CSS load order itself the product contract.
