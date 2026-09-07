-- D-032 / Cloud Sync V2 additive migration.
-- Apply to app-save-hub before releasing a client that can emit recovery candidates.

create table public.app_save_recovery_candidates (
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

create index app_save_recovery_candidates_owner_status_created_idx
  on public.app_save_recovery_candidates (user_id, app_id, slot_id, status, created_at desc);

alter table public.app_save_recovery_candidates enable row level security;

-- Supabase public-schema defaults can be broader than this feature needs.
-- Remove inherited/default browser grants first, then add back the exact V2
-- append/read surface. service_role/admin ownership remains outside this grant.
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
