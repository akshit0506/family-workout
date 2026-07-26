# Family Workout

A mobile-first, installable PWA that helps a 7-person family stay
consistent with working out — by making each other's effort visible.
Calm and motivating rather than competitive or judgmental:
accountability through visibility, not pressure.

Log a workout in a couple of taps, see the family's activity feed, check
the leaderboard, and track your own streaks and history — all from a
home-screen app, not just a website.

## Features

- **Home** — today's stats, an activity sparkline, and a live feed of the
  family's recent workouts
- **Board** — leaderboard with podium view and full rankings, multiple
  time periods
- **Profile** — per-athlete streaks, a month calendar of logged days,
  activity breakdown, and ranking history
- **Self-serve onboarding** — pick your name from the family list, enter
  your mobile number, and you're in — no admin invite step, no OTP/email
- **Installable PWA** — add-to-home-screen on iOS/Android, standalone
  launch, offline app-shell caching, safe-area-aware layout for notches
  and home indicators

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [Supabase](https://supabase.com) — Postgres, Row Level Security, Auth
  (Anonymous Sign-In + phone-number RPC), Storage
- Tailwind CSS v4
- TypeScript

## Getting started

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- Docker (required by the Supabase CLI to run Postgres locally)

### 1. Install dependencies

```bash
npm install
```

### 2. Start local Supabase

```bash
npx supabase start
```

This spins up a local Postgres instance, runs the migrations in
`supabase/migrations/`, and seeds it with realistic demo data
(`supabase/seed.sql`) — 7 athletes, weeks of activity history, comments,
and kudos, so the app looks alive from the first run. See
[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the full local-dev setup.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the two values from `npx supabase status` (or Studio → Project
Settings → API for a hosted project):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pick any of the
seeded family members' names and enter any 10-digit number to claim that
profile — there's no code to look up anywhere, local or otherwise.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |

## Project documentation

This repo is documentation-heavy on purpose — the "why," not just the
"what," lives in these files:

| File | Covers |
|---|---|
| [`PRODUCT.md`](./PRODUCT.md) | Product spec: scope, assumptions, open questions |
| [`DESIGN.md`](./DESIGN.md) | Visual language and design tokens |
| [`ROADMAP.md`](./ROADMAP.md) | Milestone history and what's next |
| [`BACKEND_PLAN.md`](./BACKEND_PLAN.md) | Supabase schema/RLS architecture decisions |
| [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) | Local Supabase dev workflow |
| [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md) | What's actually wired up vs. mock data |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Production deployment guide, PWA checklist, browser support, known limitations |

## Deployment

Not yet deployed to production. `DEPLOYMENT.md` has the full runbook —
hosted Supabase project setup, production data bootstrap (a clean slate,
no demo content), auth/SMTP configuration, and Vercel deployment — along
with a PWA-specific checklist and browser compatibility notes.

## License

Private family project — not licensed for reuse.
