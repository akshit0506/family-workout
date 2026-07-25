-- ============================================================================
-- Family Workout — core schema
-- Tables, constraints, and indexes only. RLS is enabled and policies are
-- added in the next migration (20260725120100_rls_policies.sql) so this
-- file stays focused on structure.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- athletes
--
-- One row per family member. `auth_user_id` is nullable and deliberately
-- decoupled from creation time: the full 7-person roster is seeded before
-- anyone has signed in, and each row is "claimed" (auth_user_id populated)
-- the first time that person actually signs in via magic link, matched by
-- email. See BACKEND_PLAN.md §2 and the deviation notes in this milestone's
-- summary for why this isn't a hard 1:1 FK to auth.users from day one.
-- ----------------------------------------------------------------------------
create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint athletes_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.athletes is
  'Family roster. auth_user_id is populated on first sign-in, not at seed time.';

-- ----------------------------------------------------------------------------
-- activity_types
--
-- Shared, family-wide list. `created_by` is null for the seeded defaults
-- (Gym / Run / Walk / Cycle / Yoga) and set for "Add Your Own" custom types,
-- which become visible to the whole family once created (see Open Decision
-- in BACKEND_PLAN.md §8, resolved here in favor of shared visibility).
-- ----------------------------------------------------------------------------
create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_by uuid references public.athletes (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so "Gym" and "gym" can't both exist.
create unique index activity_types_label_lower_key on public.activity_types (lower(label));

-- ----------------------------------------------------------------------------
-- activities
--
-- One row per logged activity entry (maps to the frontend's `FeedEntry`).
-- Multiple rows may share an athlete_id + calendar date — that's the
-- "multiple activities per day" feature, not a bug; unique-day counting for
-- streaks/leaderboards happens in the query layer (see BACKEND_PLAN.md §6),
-- not via a schema constraint.
-- ----------------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  logged_at timestamptz not null,
  duration_label text,
  notes text,
  achievement_note text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_athlete_logged_at_idx on public.activities (athlete_id, logged_at desc);
create index activities_logged_at_idx on public.activities (logged_at);

-- Keep updated_at honest on every edit.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- activity_entry_types
--
-- Join table: an activity can carry multiple types (the frontend's
-- multi-select "Gym + Run" case). ON DELETE RESTRICT on the type side means
-- a type in active use can't be silently deleted out from under history.
-- ----------------------------------------------------------------------------
create table public.activity_entry_types (
  activity_id uuid not null references public.activities (id) on delete cascade,
  activity_type_id uuid not null references public.activity_types (id) on delete restrict,
  primary key (activity_id, activity_type_id)
);

create index activity_entry_types_type_idx on public.activity_entry_types (activity_type_id);

-- ----------------------------------------------------------------------------
-- comments
-- ----------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  text text not null check (char_length(btrim(text)) > 0),
  posted_at timestamptz not null default now()
);

create index comments_activity_posted_at_idx on public.comments (activity_id, posted_at);

-- ----------------------------------------------------------------------------
-- kudos
--
-- Composite primary key doubles as the uniqueness guarantee behind the
-- frontend's toggle behavior: at most one kudos row per (activity, athlete).
-- ----------------------------------------------------------------------------
create table public.kudos (
  activity_id uuid not null references public.activities (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, athlete_id)
);
