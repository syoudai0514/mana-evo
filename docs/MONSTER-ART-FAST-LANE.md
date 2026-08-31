# ManaEvo Monster Art — FAST LANE

Status: **CURRENT OPERATIONAL DESIGN**  
Date: 2026-08-31

## 1. Purpose

The 238-species mass-production / final-closeout workflow is finished. It must **not** be reused as the normal procedure for a small visual change such as:

- `m042をもう少し可愛くしたい`
- `m136の最終形だけもっとかっこよくしたい`
- `m213の顔だけ少し優しくしたい`

For an existing FORMAL species, the normal maintenance experience should be:

```text
USER REQUEST
  ↓
CURRENT/FAMILY AUTO-READ
  ↓
2〜3 IMAGE OPTIONS
  ↓
USER SELECTS ONE
  ↓
AUTO FINALIZE + QA
  ↓
SCOPED PR + CI
  ↓
MAIN
  ↓
VERCEL
  ↓
LIVE SHA / VISUAL VERIFY
```

The user's normal interaction target is **two decisions only**:

1. say what they want changed;
2. choose the preferred image.

The user should not need to prepare ZIPs, manifests, SHAs, provenance files, promotion commands, PR details or deployment commands for an ordinary one-species replacement.

## 2. Why the 2026-08-31 closeout took hours

That work was not a normal image replacement. Several one-time problems were being solved at the same time:

- first-time 238-species global audit;
- CANDIDATE / PLACEHOLDER → FORMAL state reconciliation;
- approximately 40 finished images whose FORMAL state had not been completed;
- mixed historical ZIPs and missing manifests;
- wrong image dimensions such as the 1024×1024 m160 artifact;
- background plates / detached artifacts / collage-like binaries;
- m235 identity ambiguity requiring canonical metadata recovery;
- final registry, main, Vercel and live revision closeout.

Those are **closeout/migration costs**, not the expected cost of future targeted maintenance.

Now that the baseline is FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0, future replacements start from a stable approved binary and known provenance.

## 3. FAST LANE eligibility

Use FAST LANE when all are true:

- target is normally 1 species; up to 3 tightly related species is acceptable;
- species is already FORMAL;
- request is primarily visual/art direction;
- no species ID, family, evolution chain, gameplay rule or canonical identity change is requested;
- CURRENT metadata can determine the identity unambiguously.

Examples: cuteness, coolness, facial expression, pose, silhouette emphasis, ornament reduction, final-stage presence, small style cleanup.

Do **not** use FAST LANE for:

- roster-wide restyling;
- family/master data changes;
- unresolved identity changes;
- new active species;
- global asset schema changes;
- a replacement that would require guessing what the species is.

Escalation from FAST LANE must be explicit. Do not silently expand a one-species request into a global audit.

## 4. Step A — understand one short request automatically

A request such as:

```text
m136、最終形らしくもう少しかっこよくして
```

is sufficient input.

The worker must automatically fresh-read:

- current `main` HEAD;
- target manifest entry and current FORMAL SHA;
- species name/type/family/stage/motif;
- immediate family members and current images when family continuity matters;
- current target image;
- provenance/history;
- global style lock.

The user must **not** be asked to restate metadata already available in CURRENT.

If the target is a final stage, previous family stages are automatically treated as continuity references. The user does not need to upload them again unless CURRENT evidence is unavailable.

## 5. Step B — generate options without touching GitHub

Before any repository mutation:

- create 2〜3 clearly different but CURRENT-compatible options;
- keep one species per image;
- keep transparent/background-free composition;
- preserve family identity;
- change only the visual axis requested by the user;
- show the options for selection.

Examples of distinct options:

- A: minimal change / current identity strongly preserved;
- B: balanced change;
- C: stronger cute/cool/final-stage emphasis.

At this stage there is **no GitHub write, no CANDIDATE registration, no PR and no deployment**.

This avoids repository churn while the user is simply choosing an art direction.

## 6. Step C — user's selection is the visual approval event

When the user says, for example, `Bで`:

- that selection is explicit approval of the chosen visual direction;
- only the selected image proceeds;
- unselected generations are discarded from the release path;
- no second manual FORMAL approval click is required from the user.

The selected image still has to pass technical and identity QA. User selection does not waive binary safety checks.

## 7. Step D — automatic finalization

The selected image is automatically finalized to the release contract:

- exact 512×512;
- RIFF/WEBP;
- true alpha;
- safe transparent margin;
- no accidental crop/edge contact;
- no baked checkerboard/background plate/scenery;
- no extra creature/detached artifact/collage boundary;
- hidden RGB at alpha=0 normalized when applicable;
- final decoded WebP visually rechecked;
- bytes and raw SHA-256 computed.

**Normal FAST LANE must not require a ZIP.** ZIP/manifest handoff remains an exception for cross-environment transport only.

## 8. Step E — FORMAL replacement without a 238-species re-closeout

For an already-FORMAL target, the selected approved replacement should enter the PR as a **FORMAL replacement**, not by sending the whole roster back through the old candidate-production pipeline.

Required repository work for the target only:

1. preserve old FORMAL SHA/binary through Git history and required provenance/history;
2. install the new `public/monsters/mNNN.webp`;
3. append old → new provenance;
4. update that species' FORMAL SHA and approval evidence;
5. regenerate revision data;
6. keep global state at FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0.

No unrelated species should be re-promoted or re-registered.

## 9. PR omission / regression guard

Every FAST LANE release defines an **expected species scope** before repository mutation.

For example:

```text
expectedSpecies = [m136]
```

Before merge, prove:

- every expected species binary changed when a change was intended;
- every expected manifest/provenance/revision update exists;
- no unexpected species binary changed;
- no unexpected FORMAL state changed;
- active roster remains m001〜m238;
- m239 remains excluded;
- generated runtime/revision output is fresh;
- current full CI has zero failures;
- production build passes.

A missing expected update is a **FAIL**, not a partial success.

An unexpected species change is a **FAIL**, even if tests otherwise pass.

If `main` moved after the branch was created, mergeability/current-base checks must be refreshed before merge. Do not rely on a stale PR snapshot.

## 10. Merge policy for one-person development

Desired `main` protection is intentionally lightweight:

- PR required;
- required CI (`test-and-build`) must succeed;
- force-push disabled;
- branch deletion disabled;
- required approving reviews: **0**.

This means the owner does **not** have to press an approval button for every release. The safety gate is executable CI and scope verification, not repeated human ceremony.

The repository worker may merge after all required automated gates are green and the selected image has explicit user approval.

## 11. Release completion

A FAST LANE task is not complete at PR merge.

Completion requires:

```text
SELECTED
→ FINAL WEBP QA PASS
→ FORMAL REPLACEMENT
→ PR CI PASS
→ MAIN
→ PRODUCTION DEPLOYED
→ LIVE REVISION MATCH
→ LIVE VISUAL VERIFY
```

The final report should be short:

```text
m136 replacement complete
old SHA: ...
new SHA: ...
CI: PASS
main: ...
production: READY
live revision: MATCH
unexpected species change: 0
```

## 12. Rollback

If the new image looks wrong after production:

1. identify the immediately previous FORMAL raw SHA from Git/provenance;
2. restore that exact previous binary on a new scoped branch;
3. update FORMAL manifest/provenance/revision back to the previous approved binary;
4. run the same scope guard and CI;
5. merge to `main`;
6. deploy production;
7. verify live revision and image match the restored SHA.

Do not leave Vercel rolled back to a different commit from GitHub `main` for an extended period. Production and repository authority must converge again through a normal PR/main release.

## 13. Expected future user experience

Normal example:

```text
User: m213、もう少し可愛くしたい
Assistant: [A] [B] [C]
User: Bがいい
Assistant: （QA / scoped PR / CI / deploy / live verifyを実施）
Assistant: m213、本番差し替え完了。unexpected change 0。
```

Final-stage example:

```text
User: m162だけ最終進化らしくもっとかっこよく
Assistant: CURRENTの前段m160/m161を自動参照して[A][B][C]を提示
User: C
Assistant: （以降は自動）
```

This is the target maintenance model. The final-closeout workflow is retained for audit/history, not used as the default UX for ordinary art iteration.

## 14. Principle

**Make the common case easy and the dangerous case impossible to do silently.**

- art choice should be easy;
- repository bookkeeping should be automatic;
- global re-audit should not happen for a local cosmetic request;
- CI should catch missing/unexpected changes;
- the user should make product/art decisions, not perform release bookkeeping.

Related:

- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/MONSTER-ART-FINAL-HANDOFF-20260831.md`
- `design/current/09-MONSTER-MASTER-ART-SPEC.md`
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
