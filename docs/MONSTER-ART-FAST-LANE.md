# ManaEvo Monster Art — FAST LANE

Status: **CURRENT OPERATIONAL DESIGN**  
Date: 2026-08-31

## 1. Purpose

The 238-species mass-production / final-closeout workflow is finished. It must **not** be reused as the normal procedure for small visual changes such as:

- `m042をもう少し可愛くしたい`
- `m162だけ最終進化らしくもっとかっこよくしたい`
- `この3段進化を家族感を残したまま全部描き直したい`

The normal user experience is:

```text
SHORT REQUEST
  ↓
CURRENT / FAMILY AUTO-READ
  ↓
2〜3 IMAGE OPTIONS（or 2〜3 FAMILY SETS）
  ↓
USER SELECTS
  ↓
ART READY ZIP / FOLDER
  ↓
AUTO BINARY + VISUAL QA
  ↓
TRANSACTIONAL FORMAL REPLACEMENT
  ↓
SCOPED PR + CI
  ↓
MAIN → VERCEL → LIVE VERIFY
```

The user should normally make only product/art decisions: **what to change** and **which option to use**. ZIP transfer between ChatGPT sessions/workers is welcome when convenient. The user should not have to calculate SHA, edit manifests, update provenance, run promotion commands, or assemble PR bookkeeping by hand.

## 2. Why the final closeout took hours

The 2026-08-31 closeout combined several one-time problems: first global 238-species audit, 40 unfinished FORMAL states, stale/mixed handoff ZIPs, wrong dimensions, background plates, detached artifacts, m235 identity recovery, registry reconciliation, production deployment and live verification.

Those are **migration/closeout costs**, not the normal cost of changing one picture. The stable baseline is now FORMAL 238 / CANDIDATE 0 / PLACEHOLDER 0, so ordinary visual maintenance starts from known approved bytes and history.

## 3. Two FAST LANE shapes

### A. Single species

Use when one existing FORMAL image changes. Examples: cuteness, coolness, face, pose, silhouette, decoration amount, final-stage presence.

Example:

```text
User: m162、最終形だけもっとかっこよく
Worker: CURRENT m160/m161/m162を自動参照 → A/B/C
User: B
Worker: BだけをART READY化してreleaseへ
```

### B. One evolution family, up to 3 species

Use when a 2-stage/3-stage family is intentionally changed as one visual set. All targets must belong to the same CURRENT family.

For a multi-species bundle, each image must pass individual visual QA **and** the complete set must pass `familyVisualQa=PASS` for:

- recognizable family identity;
- natural stage progression;
- no accidental species swap;
- final stage visibly more developed when intended;
- one species per file.

A 3-species set is treated as **one transaction**. It is not three unrelated best-effort updates. If a post-write gate fails, the tool restores all touched binaries/manifest/provenance/revision files to their pre-run state.

Unrelated species must use separate bundles/PRs. This makes scope errors visible.

## 4. FAST LANE eligibility

Use FAST LANE only when:

- scope is 1 existing FORMAL species, or 2–3 members of one CURRENT evolution family;
- the requested change is visual/art direction;
- species IDs, family ownership, evolution/game rules and canonical identity are unchanged;
- CURRENT metadata determines identity unambiguously.

Do not use FAST LANE for new species, roster expansion, family/master redesign, unresolved identity changes, or roster-wide restyling. Those use the separate Roster Expansion / design-change lane.

## 5. ChatGPT-first workflow

A short request is enough. The worker must fresh-read the current `main` HEAD, target FORMAL SHA, species/family metadata, current art, adjacent family art, provenance/history and style lock. Do not ask the user to repeat information already in CURRENT.

Before repository mutation, generate 2–3 distinct but compatible options. For a family rewrite, present 2–3 **sets**, not a mixture of independently selected stages unless the user explicitly wants stage-by-stage selection.

The user's selection is the visual approval event. Unselected generations do not enter GitHub.

## 6. ART READY handoff

ZIP is allowed and useful for cross-chat/cross-worker transfer. It is only a transport envelope; the receiver must verify the actual contents.

Normal bundle after extraction:

```text
manifest.json
mNNN.webp
```

or for a 3-stage family:

```text
manifest.json
mNNN.webp
mNNN.webp
mNNN.webp
```

`manifest.json` schema:

```json
{
  "schema": "ManaEvo.formal-art-replacement.v1",
  "scope": ["m160", "m161", "m162"],
  "familyVisualQa": "PASS",
  "approval": {
    "approved": true,
    "approvedBy": "repository owner via ChatGPT selection",
    "approvedAt": "2026-08-31T00:00:00Z",
    "source": "selected family option B"
  },
  "species": {
    "m160": {
      "file": "m160.webp",
      "sha256": "...",
      "bytes": 123456,
      "visualQa": "PASS"
    }
  }
}
```

The manifest is expected metadata, not proof. The consumer recomputes bytes/SHA and decodes the WebP again.

## 7. Automated FORMAL replacement tool

Canonical command after ZIP extraction:

```bash
npm install
npx playwright install webkit
npm run replace:monster-art -- --bundle-dir /path/to/bundle
```

The first run is a **dry-run**. It performs no repository mutation.

After the exact dry-run scope is reviewed:

```bash
npm run replace:monster-art -- --bundle-dir /path/to/bundle --execute
```

`scripts/monster-art/formal-replacement.mjs` performs these gates before writing:

1. bundle scope is exactly 1–3 species;
2. actual `.webp` filenames exactly match scope — no extra image is silently accepted;
3. each target already exists and is FORMAL;
4. multi-target scope belongs to one CURRENT family;
5. current FORMAL files still match their manifest SHA;
6. current revision manifest matches current FORMAL SHA before replacement;
7. incoming RIFF/WEBP bytes and SHA match bundle declarations;
8. WebKit decodes the **actual incoming binary**;
9. decoded image is exact 512×512;
10. actual transparency exists;
11. visible pixels exist and do not touch canvas edges;
12. provenance exists before any replacement write.

Semantic checks such as “cute enough”, species identity, scenery/collage, extra creature and family continuity remain visual QA decisions and therefore require `visualQa=PASS`, plus `familyVisualQa=PASS` for multi-species bundles.

## 8. What execute changes

For each actually changed target only:

- preserve previous FORMAL binary in history if not already archived;
- replace `public/monsters/mNNN.webp`;
- append old → new provenance with explicit FORMAL-replacement evidence;
- keep state FORMAL and update the current `formalSha256` / approval evidence;
- regenerate `public/monster-asset-revisions.json`;
- verify the complete FORMAL repository remains internally consistent.

Byte-identical input is `ALREADY_MATCHES`: no duplicate archive, provenance event or revision churn is created.

The tool compares the before/after FORMAL binary map and fails if the actually changed species are not exactly the planned changed species.

## 9. Transaction / rollback behavior

For a family bundle, all files that may be touched are snapshotted before mutation. If revision generation or a post-write consistency gate fails, the tool restores:

- target WebPs;
- target provenance;
- newly created history artifacts;
- canonical manifest;
- revision manifest.

This protects against ordinary process failures. A machine/process hard crash can never be made perfectly transactional with plain filesystem writes, so normal work still happens on a branch/PR and is never treated as released until CI/main/live verification completes.

## 10. PR omission and regression guard

Every release has an explicit expected species scope. Missing expected change is FAIL. Unexpected species change is FAIL.

Before merge verify:

- intended WebP(s) are actually in the PR;
- intended manifest/provenance/revision changes exist;
- no unrelated species binary/state changed;
- CURRENT roster/counts remain valid;
- generated runtime/revisions are fresh;
- current PR CI/build passes against the current `main` merge result, not an old green snapshot.

After merge, fresh-read `main`, verify the intended content survived the merge, then verify Vercel commit/revision/live image.

## 11. Production completion and rollback

Completion remains:

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

If the image looks wrong after production, restore the immediately previous FORMAL bytes from history on a new scoped branch and run the same PR/CI/main/deploy/live-verify path. Do not leave Vercel permanently on a commit that differs from GitHub `main`.

## 12. Expected user experience

Single image:

```text
User: m213、もう少し可愛くしたい
Assistant: [A] [B] [C]
User: Bがいい
Assistant/worker: ART READY ZIP → dry-run → execute → PR → CI → deploy → live verify
Assistant: m213、本番差し替え完了。unexpected species change 0。
```

Family set:

```text
User: この3段進化、全部もう少し統一感を出したい
Assistant: [Family A] [Family B] [Family C]
User: Family B
Assistant/worker: 3体bundleを1 transactionで処理
Assistant: 3/3本番差し替え完了。family QA PASS / unexpected species change 0。
```

## 13. Principle

**Make the common case easy and the dangerous case impossible to do silently.**

The user chooses art. The system handles bookkeeping, SHA/history/revision and release gates.

Related:

- `docs/MONSTER-ART-MAINTENANCE-RUNBOOK.md`
- `docs/MONSTER-ROSTER-EXPANSION-LANE.md`
- `docs/REPOSITORY-RELEASE-GUARD.md`
- `design/rebuild/asset-production/PHASE-4-STYLE-LOCK.md`
