# ManaEvo Repository Release Guard

Status: **CURRENT OPERATIONAL POLICY**  
Date: 2026-08-31

## Purpose

Protect `main` from accidental untested changes **without adding a manual approval burden to the repository owner**.

This is a one-person-development policy. Safety comes from executable CI and exact scope checks, not from requiring another human reviewer.

## Desired GitHub `main` ruleset

Target branch: `main`

Required:

- changes enter `main` through a Pull Request;
- required status check: `test-and-build` must succeed;
- required approving reviews: **0**;
- force push: disabled;
- branch deletion: disabled.

Not required by default:

- owner approval click;
- external reviewer approval;
- merge queue;
- arbitrary waiting period.

The normal flow remains:

```text
worker branch
→ PR
→ CI automatically runs
→ CI PASS
→ merge
→ production deploy
→ live verification
```

The repository owner should not need to approve each normal release manually.

## No stale-PR merge

Before merge, the worker must confirm the PR is evaluated against the current `main` state.

If `main` moved after branch creation:

1. refresh mergeability/current-base state;
2. allow GitHub PR CI to evaluate the current merge result;
3. do not rely on an old green run for an older merge snapshot;
4. merge only after the current required check is green.

This prevents a change that passed against an old base from silently regressing newer work.

## Expected-change contract

For scoped maintenance, declare the expected change scope before mutation.

Example:

```text
expectedSpecies = [m136]
```

Pre-merge verification must prove both directions:

- **missing expected change = FAIL**;
- **unexpected change = FAIL**.

For Monster Art this means checking at least:

- intended WebP replacement exists;
- intended manifest/provenance/revision update exists;
- no unrelated species binary changed;
- no unrelated FORMAL state changed;
- active registry remains m001-m238 and m239 excluded;
- CI/build are green.

Passing tests alone are not sufficient if the requested file was accidentally omitted from the PR.

## Post-merge verification

After merge:

- fresh-read `main` HEAD;
- verify intended commit/content is actually present;
- verify deployment uses the intended `main` commit;
- verify live revision/content for the changed feature/asset.

`PR merged` and `release completed` are separate gates.

## Owner-interaction rule

Do not introduce a repository rule that requires the owner to manually approve routine worker PRs unless the owner explicitly requests that policy later.

The intended safety model is:

**owner chooses product/art direction; automation proves release integrity.**

## Relationship to Monster Art FAST LANE

See `docs/MONSTER-ART-FAST-LANE.md`.

The FAST LANE uses this release guard so a normal request can be:

```text
「m213をもう少し可愛く」
→ options
→ owner selects one
→ automated QA / PR / CI / deploy / live verify
```

without reopening the old 238-species closeout workflow.
