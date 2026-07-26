-- ============================================================================
-- Family Workout — phone-based auth (replaces email OTP)
--
-- Product decision: this is a private 7-person family app, and email OTP
-- (plus the SMTP/rate-limit/DLT-for-SMS problems that came with it — see
-- DEPLOYMENT.md history) was more auth than the threat model needs. New
-- model: Supabase Auth Anonymous Sign-In (a real, signed session — auth.uid()
-- still works, RLS is unchanged in shape) plus a 10-digit Indian mobile
-- number that acts as a lightweight shared secret, not proof of phone
-- ownership. Deliberately not SMS-verified: no code is ever sent anywhere.
--
-- This is a NEW migration, not an edit to 20260725161000_auth_claim.sql —
-- that migration is already applied to the hosted project, and rewriting
-- migration history that's already been pushed breaks `supabase db push`'s
-- reconciliation against the remote migration-history table. Supersede,
-- don't rewrite.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop the email-based claim function — replaced below by two phone-based
-- RPCs (claim vs. re-sign-in are different operations now, since sign-out no
-- longer destroys the roster linkage the way "email verified" used to imply
-- session = identity).
-- ----------------------------------------------------------------------------
drop function if exists public.claim_athlete(uuid);

-- ----------------------------------------------------------------------------
-- email -> phone_number. Nullable (unclaimed athletes have neither), unique
-- when set, format-checked to exactly +91 followed by 10 digits. CHECK
-- constraints only apply to non-null values, so multiple NULLs are fine
-- alongside the UNIQUE constraint (Postgres treats NULL as distinct).
-- ----------------------------------------------------------------------------
alter table public.athletes drop column email;

alter table public.athletes add column phone_number text unique;

alter table public.athletes
  add constraint athletes_phone_format check (phone_number ~ '^\+91[0-9]{10}$');

-- ----------------------------------------------------------------------------
-- Column-level privacy: phone_number must never be readable via the normal
-- `authenticated`/`service_role` grants, even though the row itself (via
-- athletes_select_claimed, unchanged) is visible to every claimed family
-- member. This is stricter than the old `email` column ever was — worth
-- doing now since phone_number doubles as a login credential, not just
-- contact info. SECURITY DEFINER functions below bypass this entirely (they
-- run as the function owner), so the RPCs still work.
-- ----------------------------------------------------------------------------
revoke select on public.athletes from authenticated, service_role;
grant select (id, auth_user_id, name, created_at) on public.athletes to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- First-time claim: pick an unclaimed name, supply a phone number, done.
-- Same security-definer shape as the old claim_athlete() (see that
-- migration's comment for why security definer, not invoker + RLS policy) —
-- only the input changed from "trust the verified JWT email" to "trust
-- whatever phone number the caller typed," which is the whole point of this
-- milestone's simplified threat model.
-- ----------------------------------------------------------------------------
create or replace function public.claim_athlete_with_phone(
  target_athlete_id uuid,
  phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if phone !~ '^\+91[0-9]{10}$' then
    raise exception 'Enter a valid 10-digit Indian mobile number.';
  end if;

  update public.athletes
  set auth_user_id = auth.uid(),
      phone_number = phone
  where id = target_athlete_id
    and auth_user_id is null
  returning id into updated_id;

  if updated_id is null then
    raise exception 'This profile has already been claimed.';
  end if;
end;
$$;

grant execute on function public.claim_athlete_with_phone(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Re-sign-in (post sign-out, or a new device): the athlete is already
-- claimed, so this re-points auth_user_id at the caller's *current*
-- anonymous session instead of creating a new claim. The phone comparison
-- happens entirely inside this function — the client never receives any
-- stored phone number to compare against client-side, which would either
-- leak every family member's number or require trusting an unenforced
-- client-side check. Same generic error either way (no match / not yet
-- claimed) so this can't be used to probe which names are claimed beyond
-- what athlete_claim_status already exposes on purpose.
-- ----------------------------------------------------------------------------
create or replace function public.login_with_phone(
  target_athlete_id uuid,
  phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if phone !~ '^\+91[0-9]{10}$' then
    raise exception 'That number doesn''t match our records for this profile.';
  end if;

  update public.athletes
  set auth_user_id = auth.uid()
  where id = target_athlete_id
    and phone_number = phone
  returning id into updated_id;

  if updated_id is null then
    raise exception 'That number doesn''t match our records for this profile.';
  end if;
end;
$$;

grant execute on function public.login_with_phone(uuid, text) to authenticated;
