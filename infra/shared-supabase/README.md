# Shared personal-app Supabase backend

This directory defines the generic backend contract used by ManaEvo and intended for future personal games/apps.

## Boundary

- Supabase Auth is shared at the project level.
- Each application partitions save data by `app_id`.
- ManaEvo uses `app_id = mana-evo` and `slot_id = main`.
- Player/child profiles remain inside the application payload; the device's currently selected player is local-only and is not cloud authority.
- `family-ops` is not this backend and must remain isolated.

## Security

Apply `app-save-hub.sql` to a new generic Supabase project. Existing projects apply the additive migration files for later schema changes.

All exposed tables enable RLS and require `(select auth.uid()) = user_id`. `anon` privileges are explicitly revoked even if the project has broader public-schema defaults. The web client uses only browser-safe public credentials; secret/service-role credentials must never be placed in this repository or browser bundle.

`app_save_recovery_candidates` is intentionally more restrictive than ordinary backups: the authenticated browser may **insert and select only its own rows**. It receives no authenticated update/delete grant. This makes recovery candidates append-only from normal application code so a later sync cannot rewrite the evidence needed for manual/GPT-assisted recovery.

## Cloud Sync V2 / D-032 deployment order

Cloud Sync V2 treats cloud as the normal cross-device authority but never silently discards a divergent LOCAL snapshot.

Before a divergent LOCAL is replaced by CLOUD, the client inserts a recovery candidate containing both the exact LOCAL payload and the contemporaneous CLOUD payload plus revision/hash metadata. The cloud apply occurs only after that insert succeeds. If the insert fails, sync fails closed and LOCAL remains on the device.

For an existing backend, apply:

`cloud-sync-v2-recovery-candidates.sql`

**before** releasing a client that can emit recovery candidates. The migration is additive; no existing save/backup row is rewritten.

Future automatic merge/recovery rules are intentionally deferred to GitHub Issue #159. Do not add generic deep-merge, max-value, newest-field-wins, or similar snapshot merging to the browser client without a later explicit decision.

## Browser configuration

Production/dev builds run `scripts/fetch-shared-cloud-config.mjs` before Vite. It calls the shared project's `public-client-config` bootstrap Edge Function using a non-secret application bootstrap header and writes a generated `.env.local` containing only the browser-safe project URL/anonymous key. `.env.local` is ignored by git.

The production browser origin is `https://mana-evo.vercel.app/`. Vercel Preview deployments use the same browser-safe Supabase project configuration for controlled testing. The generated browser key is not authorization by itself; RLS plus the signed-in user's JWT controls table access.

## Auth URLs

Supabase Auth production Site URL must be:

`https://mana-evo.vercel.app/`

Production confirmation/password-recovery redirects return to that origin. Vercel Preview redirect URLs may be added only when an Auth flow needs to be tested on a PR Preview. GitHub Pages is no longer a production/canonical Auth return target under D-019.

Hosted Supabase projects enable email confirmation by default, so this URL configuration is required before treating signup/password recovery as rollout-complete.

## Verification before rollout

1. Apply SQL/migrations and explicit anon revocation.
2. Run Supabase security advisors and resolve relevant findings.
3. Verify an authenticated user can create/read/update only their own `app_saves` row.
4. Verify another authenticated identity cannot read or overwrite that row.
5. Verify unauthenticated requests cannot access saves/backups/recovery candidates.
6. Verify an authenticated browser can insert/select only its own recovery candidates and cannot update/delete them.
7. Verify recovery-candidate persistence failure leaves LOCAL untouched and does not commit sync metadata.
8. Verify ordinary fresh-device/cloud-only switches auto-pull without a child save chooser.
9. Verify local-only changes against the same trusted revision still push with optimistic revision protection.
10. Verify email confirmation, password reset, refresh-session persistence and logout after Auth URLs are configured.
11. Verify ManaEvo full snapshot round-trip, backup restore and test-mode isolation.
12. Verify the Vercel production PWA installs/updates from the root origin and does not depend on `/mana-evo/`.
