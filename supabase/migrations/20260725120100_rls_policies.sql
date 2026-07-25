-- ============================================================================
-- Family Workout — Row Level Security
--
-- Every table's SELECT policy is "any authenticated family member" — this is
-- a shared-visibility app by design (PRODUCT.md §3: show absence, don't hide
-- it). The interesting policies are the mutation ones, which mirror what the
-- UI already enforces today (edit/delete only on your own entries, kudos
-- disabled on your own entries). See BACKEND_PLAN.md §5.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: resolve the calling user's athlete row.
--
-- SECURITY DEFINER so it can read `athletes` regardless of that table's own
-- RLS (standard Supabase pattern for avoiding recursive-policy issues).
-- STABLE because it's safe to evaluate once per statement, not once per row.
-- ----------------------------------------------------------------------------
create or replace function public.current_athlete_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.athletes where auth_user_id = auth.uid();
$$;

alter table public.athletes enable row level security;
alter table public.activity_types enable row level security;
alter table public.activities enable row level security;
alter table public.activity_entry_types enable row level security;
alter table public.comments enable row level security;
alter table public.kudos enable row level security;

-- ----------------------------------------------------------------------------
-- athletes — read-only from the client. Roster changes are admin/service-role
-- only for this milestone (see BACKEND_PLAN.md §8 Open Decisions).
-- ----------------------------------------------------------------------------
create policy "athletes_select_authenticated"
on public.athletes for select
to authenticated
using (true);

-- ----------------------------------------------------------------------------
-- activity_types
-- ----------------------------------------------------------------------------
create policy "activity_types_select_authenticated"
on public.activity_types for select
to authenticated
using (true);

create policy "activity_types_insert_own"
on public.activity_types for insert
to authenticated
with check (created_by = public.current_athlete_id());

-- ----------------------------------------------------------------------------
-- activities — edit own activity, delete own activity.
-- ----------------------------------------------------------------------------
create policy "activities_select_authenticated"
on public.activities for select
to authenticated
using (true);

create policy "activities_insert_own"
on public.activities for insert
to authenticated
with check (athlete_id = public.current_athlete_id());

create policy "activities_update_own"
on public.activities for update
to authenticated
using (athlete_id = public.current_athlete_id())
with check (athlete_id = public.current_athlete_id());

create policy "activities_delete_own"
on public.activities for delete
to authenticated
using (athlete_id = public.current_athlete_id());

-- ----------------------------------------------------------------------------
-- activity_entry_types — follows the parent activity's ownership.
-- ----------------------------------------------------------------------------
create policy "activity_entry_types_select_authenticated"
on public.activity_entry_types for select
to authenticated
using (true);

create policy "activity_entry_types_insert_own_activity"
on public.activity_entry_types for insert
to authenticated
with check (
  activity_id in (
    select id from public.activities where athlete_id = public.current_athlete_id()
  )
);

create policy "activity_entry_types_delete_own_activity"
on public.activity_entry_types for delete
to authenticated
using (
  activity_id in (
    select id from public.activities where athlete_id = public.current_athlete_id()
  )
);

-- ----------------------------------------------------------------------------
-- comments — comment anyone. No update/delete policy: editing/deleting a
-- comment isn't a current feature, and the absence of a policy is the safe
-- default (no policy = no access) rather than an oversight.
-- ----------------------------------------------------------------------------
create policy "comments_select_authenticated"
on public.comments for select
to authenticated
using (true);

create policy "comments_insert_as_self"
on public.comments for insert
to authenticated
with check (athlete_id = public.current_athlete_id());

-- ----------------------------------------------------------------------------
-- kudos — kudos anyone, but not yourself. This resolves the "should
-- self-kudos be blocked at the DB layer too" Open Decision from
-- BACKEND_PLAN.md §8 in favor of yes: the UI already disables the button on
-- your own entries, this is defense in depth, not a UI-only rule.
-- ----------------------------------------------------------------------------
create policy "kudos_select_authenticated"
on public.kudos for select
to authenticated
using (true);

create policy "kudos_insert_not_self"
on public.kudos for insert
to authenticated
with check (
  athlete_id = public.current_athlete_id()
  and activity_id not in (
    select id from public.activities where athlete_id = public.current_athlete_id()
  )
);

create policy "kudos_delete_own"
on public.kudos for delete
to authenticated
using (athlete_id = public.current_athlete_id());

-- ----------------------------------------------------------------------------
-- Table-level grants.
--
-- RLS policies only add row-level filtering on top of base table privileges
-- — they don't replace them. Without these GRANTs, PostgREST returns
-- "permission denied for table ..." before RLS is even evaluated, for every
-- role including service_role (which bypasses RLS via BYPASSRLS, but still
-- needs the underlying SQL privilege to touch the table at all).
--
-- Granted to both `authenticated` (real per-user sessions, once auth lands)
-- and `service_role` (used for all server-side reads today, since there's
-- no session yet — see FRONTEND_INTEGRATION.md).
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;

grant select on public.athletes to authenticated, service_role;
grant select, insert on public.activity_types to authenticated, service_role;
grant select, insert, update, delete on public.activities to authenticated, service_role;
grant select, insert, delete on public.activity_entry_types to authenticated, service_role;
grant select, insert on public.comments to authenticated, service_role;
grant select, insert, delete on public.kudos to authenticated, service_role;
