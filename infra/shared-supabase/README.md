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

Both tables enable RLS and require `(select auth.uid()) = user_id`. There are no `anon` table grants. The web client uses only the project URL and a publishable key. Never put a secret/service-role key in this repository or browser bundle.

## Browser configuration

ManaEvo reads:

- `VITE_SHARED_SUPABASE_URL`
- `VITE_SHARED_SUPABASE_PUBLISHABLE_KEY`

The publishable key is browser-safe when RLS is correctly configured. For the canonical static GitHub Pages build, the same public values may be committed through `src/platform/sharedSupabasePublicConfig.js` and used as a fallback once the shared project is provisioned; secret keys must never be committed.

## Auth URLs

Configure Supabase Auth Site URL / Additional Redirect URLs for every supported ManaEvo host used by confirmation and password recovery, especially the canonical GitHub Pages URL. Preview hosts should only be added when needed for controlled testing.

## Verification before rollout

1. Apply SQL.
2. Run Supabase security advisors and resolve RLS/security findings relevant to these tables.
3. Verify an authenticated user can create/read/update only their own `app_saves` row.
4. Verify another authenticated user cannot read or overwrite that row.
5. Verify unauthenticated requests cannot access saves/backups.
6. Verify email confirmation, password reset, refresh-session persistence and logout.
7. Verify ManaEvo full snapshot round-trip, multi-device conflict protection, backup restore and test-mode isolation.
