-- Shared personal-app backend: generic auth-owned save slots.
-- Intended for a dedicated generic Supabase project shared by ManaEvo and future personal games.

create table if not exists public.app_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  slot_id text not null default 'main',
  revision bigint not null default 1 check (revision >= 1),
  schema_version integer not null default 1 check (schema_version >= 1),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app_id, slot_id),
  check (char_length(app_id) between 1 and 80),
  check (char_length(slot_id) between 1 and 80)
);

alter table public.app_saves enable row level security;
revoke all privileges on table public.app_saves from anon;
grant select, insert, update, delete on public.app_saves to authenticated;

create policy "app_saves_select_own"
on public.app_saves for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "app_saves_insert_own"
on public.app_saves for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "app_saves_update_own"
on public.app_saves for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "app_saves_delete_own"
on public.app_saves for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.app_save_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  slot_id text not null default 'main',
  revision bigint not null default 0 check (revision >= 0),
  schema_version integer not null default 1 check (schema_version >= 1),
  reason text not null default 'manual',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  check (char_length(app_id) between 1 and 80),
  check (char_length(slot_id) between 1 and 80),
  check (char_length(reason) between 1 and 120)
);

create index if not exists app_save_backups_owner_app_created_idx
  on public.app_save_backups (user_id, app_id, slot_id, created_at desc);

alter table public.app_save_backups enable row level security;
revoke all privileges on table public.app_save_backups from anon;
grant select, insert, delete on public.app_save_backups to authenticated;

create policy "app_save_backups_select_own"
on public.app_save_backups for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "app_save_backups_insert_own"
on public.app_save_backups for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "app_save_backups_delete_own"
on public.app_save_backups for delete
to authenticated
using ((select auth.uid()) = user_id);

-- D-032 recovery candidates are deliberately separate from ordinary backups.
-- A browser may append/read its own candidates but cannot update/delete them.
-- This preserves the exact LOCAL and contemporaneous CLOUD inputs for later
-- maintainer/GPT-assisted recovery without letting normal sync rewrite history.
create table if not exists public.app_save_recovery_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  slot_id text not null default 'main',
  schema_version integer not null default 1 check (schema_version >= 1),
  status text not null default 'unresolved' check (status in ('unresolved', 'resolved', 'discarded')),
  reason text not null,
  base_revision bigint null check (base_revision is null or base_revision >= 0),
  base_hash text null,
  cloud_revision bigint not null check (cloud_revision >= 0),
  cloud_hash text not null,
  local_hash text not null,
  device_profile_id text null,
  local_payload jsonb not null,
  cloud_payload jsonb not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  resolution_note text null,
  check (char_length(app_id) between 1 and 80),
  check (char_length(slot_id) between 1 and 80),
  check (char_length(reason) between 1 and 120),
  check (char_length(cloud_hash) between 1 and 128),
  check (char_length(local_hash) between 1 and 128),
  check (base_hash is null or char_length(base_hash) between 1 and 128),
  check (device_profile_id is null or char_length(device_profile_id) between 1 and 160)
);

create index if not exists app_save_recovery_candidates_owner_status_created_idx
  on public.app_save_recovery_candidates (user_id, app_id, slot_id, status, created_at desc);

alter table public.app_save_recovery_candidates enable row level security;
revoke all privileges on table public.app_save_recovery_candidates from anon;
revoke all privileges on table public.app_save_recovery_candidates from authenticated;
grant select, insert on public.app_save_recovery_candidates to authenticated;

create policy "app_save_recovery_candidates_select_own"
on public.app_save_recovery_candidates for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "app_save_recovery_candidates_insert_own"
on public.app_save_recovery_candidates for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- No anon grants. The browser uses only a publishable key plus the signed-in user's JWT.
-- Never expose service_role / secret keys in a game client.
