-- ============================================================================
-- Family Workout — self-serve profile claiming
--
-- Replaces the original invite-only model (an admin pre-created each
-- auth.users row via scripts/invite-family.mjs; a trigger auto-linked it to
-- the matching public.athletes row by email) with a "claim your profile"
-- onboarding: anyone can request an OTP for any email — Supabase Auth
-- sign-up is open now — but that account can only ever attach itself to
-- ONE of the 7 existing, still-unclaimed athlete rows, never create a new
-- one. The roster itself stays fixed and admin-managed either way; only
-- *how an account attaches to a roster row* changed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Public, pre-auth-safe view of the roster: name + claimed status only.
-- The /login "claim your profile" screen needs this to render the family
-- list and grey out already-claimed names *before* the visitor has signed
-- in at all — so it's readable by the `anon` role, unlike the real
-- `athletes` table (see the tightened policy below). Deliberately excludes
-- `email` — someone picking a name to claim has no legitimate reason to
-- see everyone else's registered address.
-- ----------------------------------------------------------------------------
create view public.athlete_claim_status as
select id, name, (auth_user_id is not null) as claimed
from public.athletes;

grant select on public.athlete_claim_status to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Claiming: security definer, not invoker.
--
-- First attempt used `security invoker` plus an `athletes_claim_unclaimed`
-- UPDATE policy (using: auth_user_id is null; check: auth_user_id =
-- auth.uid()) and thought that was sufficient. It wasn't: Postgres RLS
-- applies a table's SELECT policy to identify candidate rows for an
-- UPDATE *in addition to* the UPDATE policy's own USING clause. The
-- tightened SELECT policy below requires current_athlete_id() is not
-- null — which is exactly false for the not-yet-claimed user running this
-- claim — so the not-yet-claimed row was invisible to the UPDATE before
-- its own USING clause ever got a chance to allow it, and the update
-- silently matched zero rows every time. Confirmed with RAISE WARNING
-- debug output showing auth.uid() and the target id both correct, but a
-- plain `select ... where id = target` under the same role also returning
-- zero rows — a Postgres RLS behavior, not a bug in the update's WHERE
-- clause.
--
-- `security definer` sidesteps this cleanly: the function runs with its
-- owner's privileges (bypasses RLS for its own internal query), so there's
-- no SELECT-policy visibility problem to work around. It's still scoped
-- tightly: the WHERE clause only ever matches the one target id, only when
-- unclaimed, and auth_user_id is always set to the caller's own auth.uid()
-- (never a client-supplied value) — a security definer function isn't a
-- blanket bypass, it's "run this exact, narrow, hardcoded operation with
-- elevated privilege." No table-level grant or RLS policy is needed for
-- this path at all, which is simpler than the first attempt, not just a
-- workaround for it — nothing outside this function can UPDATE athletes.
-- ----------------------------------------------------------------------------
create or replace function public.claim_athlete(target_athlete_id uuid)
returns public.athletes
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_row public.athletes;
begin
  update public.athletes
  set auth_user_id = auth.uid(),
      email = auth.jwt() ->> 'email'
  where id = target_athlete_id
    and auth_user_id is null
  returning * into claimed_row;

  if claimed_row.id is null then
    raise exception 'This profile has already been claimed.';
  end if;

  return claimed_row;
end;
$$;

grant execute on function public.claim_athlete(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Tighten read access. Sign-up is no longer invite-gated, so "authenticated"
-- alone no longer implies "is a family member who claimed a profile" the
-- way it did under the old invite-only model — a stranger could otherwise
-- self-verify any email, never claim anyone, and still read every
-- activity/comment/kudos via a direct API call even though the app's own
-- UI would never show them anything (fetchCurrentAthlete() redirects to
-- /login with no linked athlete). Every table's SELECT policy now also
-- requires a claimed profile.
-- ----------------------------------------------------------------------------
drop policy "athletes_select_authenticated" on public.athletes;
create policy "athletes_select_claimed"
on public.athletes for select
to authenticated
using (public.current_athlete_id() is not null);

drop policy "activity_types_select_authenticated" on public.activity_types;
create policy "activity_types_select_claimed"
on public.activity_types for select
to authenticated
using (public.current_athlete_id() is not null);

drop policy "activities_select_authenticated" on public.activities;
create policy "activities_select_claimed"
on public.activities for select
to authenticated
using (public.current_athlete_id() is not null);

drop policy "activity_entry_types_select_authenticated" on public.activity_entry_types;
create policy "activity_entry_types_select_claimed"
on public.activity_entry_types for select
to authenticated
using (public.current_athlete_id() is not null);

drop policy "comments_select_authenticated" on public.comments;
create policy "comments_select_claimed"
on public.comments for select
to authenticated
using (public.current_athlete_id() is not null);

drop policy "kudos_select_authenticated" on public.kudos;
create policy "kudos_select_claimed"
on public.kudos for select
to authenticated
using (public.current_athlete_id() is not null);
