# Shared personal-app Supabase backend

This directory defines the generic backend contract used by ManaEvo and intended for future personal games/apps.

## Boundary

- Supabase Auth is shared at the project level.
- Each application partitions save data by `app_id`.
- ManaEvo uses `app_id = mana-evo` and `slot_id = main`.
- Player/child profiles remain inside the application payload; the device's currently selected player is local-only and is not cloud authority.
- `family-ops` is not this backend and must remain isolated.

## Security

Apply `app-save-hub.sql` to the generic Supabase project.

Both tables enable RLS and require `(select auth.uid()) = user_id`. `anon` privileges are explicitly revoked even if the project has broader public-schema defaults. The web client uses only browser-safe public credentials; secret/service-role credentials must never be placed in this repository or browser bundle.

## Browser configuration

Production/dev builds run `scripts/fetch-shared-cloud-config.mjs` before Vite. It calls the shared project's `public-client-config` bootstrap Edge Function using a non-secret application bootstrap header and writes a generated `.env.local` containing only the browser-safe project URL/anonymous key. `.env.local` is ignored by git.

This keeps project secrets out of the repository while allowing the same static build model to work for Vercel and GitHub Pages. The generated browser key is not authorization by itself; RLS plus the signed-in user's JWT controls table access.

## Auth URLs

Configure Supabase Auth Site URL / Additional Redirect URLs for every supported ManaEvo host used by confirmation and password recovery. The production host should be the Site URL; canonical/preview hosts can be additional redirects as needed.

Hosted Supabase projects enable email confirmation by default, so this URL configuration is required before treating signup/password recovery as rollout-complete.

## Verification before rollout

1. Apply SQL and explicit anon revocation.
2. Run Supabase security advisors and resolve relevant findings.
3. Verify an authenticated user can create/read/update only their own `app_saves` row.
4. Verify another authenticated identity cannot read or overwrite that row.
5. Verify unauthenticated requests cannot access saves/backups.
6. Verify email confirmation, password reset, refresh-session persistence and logout after Auth URLs are configured.
7. Verify ManaEvo full snapshot round-trip, multi-device conflict protection, backup restore and test-mode isolation.
