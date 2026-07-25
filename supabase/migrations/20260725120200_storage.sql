-- ============================================================================
-- Family Workout — Storage
--
-- One private bucket for proof photos. Path convention: {athlete_id}/{file}
-- so ownership and RLS can key off the first path segment via
-- storage.foldername(). See BACKEND_PLAN.md §4.
--
-- This creates the bucket and its access policies; nothing uploads to it
-- yet. The Add Activity form's "Proof Photo" field stays a UI placeholder
-- until Milestone 10 wires up an actual upload call.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activity-photos',
  'activity-photos',
  false,
  10485760, -- 10 MiB; adjust if phone photos routinely exceed this
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "activity_photos_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'activity-photos');

create policy "activity_photos_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'activity-photos'
  and (storage.foldername(name))[1] = public.current_athlete_id()::text
);

create policy "activity_photos_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'activity-photos'
  and (storage.foldername(name))[1] = public.current_athlete_id()::text
);
