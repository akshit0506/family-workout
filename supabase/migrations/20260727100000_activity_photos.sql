-- ============================================================================
-- Family Workout — Activity photos
--
-- Replaces the single nullable `activities.photo_path` placeholder (never
-- read or written by any code — see FRONTEND_INTEGRATION.md) with a proper
-- one-to-many table, since the product requirement is "one or more photos
-- per activity", not one. Storage path convention:
--   {athlete_id}/{activity_id}/{photo_id}.jpg
-- which satisfies the existing `activity-photos` bucket policies in
-- 20260725120200_storage.sql (they key off the first path segment via
-- storage.foldername(), unchanged here).
-- ============================================================================

alter table public.activities drop column photo_path;

create table public.activity_photos (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  storage_path text not null unique,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index activity_photos_activity_idx on public.activity_photos (activity_id, position);

alter table public.activity_photos enable row level security;

-- Same shared-visibility shape as every other table (BACKEND_PLAN.md §5):
-- anyone signed in can see whose activities have photos, only the owning
-- athlete can attach or remove them. `athlete_id` is stored directly
-- (rather than derived via a join on every check) so it can double as the
-- storage folder key the client uploads/deletes against.
create policy "activity_photos_select_authenticated"
on public.activity_photos for select
to authenticated
using (true);

create policy "activity_photos_insert_own"
on public.activity_photos for insert
to authenticated
with check (
  athlete_id = public.current_athlete_id()
  and activity_id in (
    select id from public.activities where athlete_id = public.current_athlete_id()
  )
);

create policy "activity_photos_delete_own"
on public.activity_photos for delete
to authenticated
using (athlete_id = public.current_athlete_id());

grant select, insert, delete on public.activity_photos to authenticated, service_role;
