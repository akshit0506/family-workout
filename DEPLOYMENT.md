# Deployment

How to take this from "running on `npx supabase start` on one laptop" to
"the actual family can open it on their phones," starting from a
completely clean production database — no demo history, no test
comments, no seeded kudos. See `SUPABASE_SETUP.md` for local dev (still
the right place to iterate on schema/RLS), `BACKEND_PLAN.md` for the
architecture this follows, and `FRONTEND_INTEGRATION.md` for what's
actually implemented.

## Development seed vs. production bootstrap

Two separate SQL files, deliberately not one file with a flag:

| | `supabase/seed.sql` | `supabase/production_bootstrap.sql` |
|---|---|---|
| **Audience** | Local development only | A brand-new hosted project, once |
| **Run by** | `supabase db reset` / `supabase start`, automatically (`config.toml`'s `[db.seed]`) | An admin, manually, once — never automatic |
| **Contains** | 7 athletes, ~30–45 days of realistic activity history, comments, kudos, two demo custom activity types (Cardio, Pickleball) | 7 athletes (unclaimed, placeholder emails), the 5 default activity types |
| **Never contains** | — | Any activity, comment, kudos, or custom activity type |

Why two files instead of one seed with a `--demo` flag: `supabase db push`
(the command that applies migrations to a hosted project) never runs any
seed file at all, by design — so there was never a risk of the dev seed
accidentally reaching production through the normal deploy path. The
actual risk was a *human* one, running the wrong file by hand against the
wrong database. Two files with unmistakably different names and header
comments — one describing itself as "local dev only," the other as "run
this once against a freshly-migrated hosted project" — makes that mistake
harder to make than a shared file with a mode switch would.

## 1. Create the hosted Supabase project

Create a new project at [supabase.com](https://supabase.com) (or your
org's Supabase account). Note the project ref, database password, and
region.

## 2. Run migrations

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

`db push` applies every file in `supabase/migrations/*` — schema, indexes,
RLS policies, the storage bucket, and the `claim_athlete()` auth-claim
mechanism. It does **not** run any seed file (neither `seed.sql` nor
`production_bootstrap.sql`) — that's the next, separate step.

## 3. Run the production bootstrap

Open Studio's SQL editor for the hosted project (or connect with `psql`
using the project's connection string) and run the entire contents of
`supabase/production_bootstrap.sql`.

This inserts exactly: the 7 real athlete rows (unclaimed, with unique
placeholder emails — **no email here needs to be correct**; whatever a
person types into `/login` when they claim their profile becomes that
row's real, permanent email via `claim_athlete()`), and the 5 default
activity types the logging form needs to have something to show on day
one. Nothing else — no activities, no comments, no kudos.

**Do not run `supabase/seed.sql` against production.** It's the local dev
file — realistic-looking activity history, comments, and kudos that would
have your family staring at a fabricated month of workouts (and, worse, a
fabricated leaderboard ranking) that never happened. If this ever runs
against a hosted project by mistake, the fix is to manually delete the
affected rows from `activities` (`comments`/`kudos`/`activity_entry_types`
cascade-delete with them) — there's no automated undo.

Verify before moving on:

```sql
select name, email, auth_user_id is not null as claimed from public.athletes order by name;
-- expect: 7 rows, all claimed = false

select count(*) from public.activities; -- expect: 0
select count(*) from public.activity_types; -- expect: 5
```

## 4. Configure authentication

1. **URL Configuration** (Studio → Authentication → URL Configuration):
   set **Site URL** to your real production URL (e.g.
   `https://family-workout.vercel.app`). No redirect URL to add beyond
   that — sign-in is a typed 6-digit code (`verifyOtp`), not a clicked
   link, so there's no callback route to allow-list.
2. **Rate limits** (Studio → Authentication → Rate Limits): the local dev
   default was raised to 30 emails/hour in `config.toml` for testing (that
   file isn't read by a hosted project); check the hosted project's own
   default isn't so low it blocks a 7-person household using the app
   normally.
3. **Email template** (Studio → Authentication → Email Templates → Magic
   Link): paste in the same customization as
   `supabase/templates/magic_link.html` — the 6-digit `{{ .Token }}`
   surfaced prominently. Local dev's `config.toml`-referenced template
   file isn't read by a hosted project, so this has to be set again by
   hand here. Worth a further copy/branding pass so it doesn't read like a
   generic SaaS email to non-technical family members, but the code needs
   to be there before day one, not just as later polish.

> **Email is intentionally immutable for v1.** Once `claim_athlete()`
> succeeds, `athletes.email` is permanent — there's no "change your
> email" flow, by design, not an oversight (`claim_athlete()`'s `where
> auth_user_id is null` check means the same profile can never be
> re-claimed with a different address either). If someone claims the
> wrong profile or types a typo'd email, the only fix today is an admin
> manually clearing `auth_user_id` back to `null` for that row in Studio
> (and, if their `auth.users` account should also be removed, deleting it
> via Studio → Authentication → Users) so they can claim again. Worth
> mentioning to the family before rollout so nobody's surprised by it —
> get the right name and email on the first try.

## 5. Configure SMTP

Set up a real SMTP provider (Studio → Authentication → SMTP Settings).
The local Mailpit catch-all doesn't exist in production, and without a
configured SMTP provider, Supabase's own default email sending has low
rate limits meant for auth-flow testing, not real household usage. This
is the one step in this whole guide that has no local-dev equivalent to
copy from — local dev deliberately never sends real email at all.

## 6. Configure environment variables

Just two variables, both safe to expose to the browser (that's what RLS
is for) — there's no service-role key to manage, since sign-up and
profile claiming are self-serve (no admin script needs elevated access):

| Variable | Where it's used | Where it's read from |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/{server,client}.ts`, `src/proxy.ts` | Studio → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above | Same as above |

## 7. Deploy to Vercel

1. Import the repo into Vercel.
2. Set the two environment variables from §6 in Vercel's project settings.
3. Build command / output: defaults (`next build`) are already correct —
   no config changes needed. Every `(main)` route is already
   `force-dynamic`, so nothing gets incorrectly statically prerendered
   against build-time-unavailable data.
4. Deploy. Confirm the deployed URL matches what you set as Supabase's
   Site URL in §4.1 — a mismatch here is the most likely cause of
   `site_url`-derived links elsewhere in Supabase's own auth emails
   pointing somewhere wrong, even though the app's own sign-in flow
   doesn't depend on it for the code itself.
5. If using a custom domain, update Supabase's Site URL (§4.1) to match
   the custom domain, not the `*.vercel.app` one.

## 8. Production verification checklist

Repeat this by hand once, for real, against the production URL with at
least two real family members' inboxes — this is the manual version of
the automated end-to-end passes run locally throughout development (see
`FRONTEND_INTEGRATION.md`):

**First-time production state**
- [ ] Database matches the bootstrap exactly: 7 athletes, all unclaimed;
      5 activity types; zero activities/comments/kudos (re-run the §3
      verification queries against production directly if there's any
      doubt)
- [ ] Home shows an empty feed with the "no activity yet" message, not a
      blank section
- [ ] Board loads without error and shows all 7 athletes at 0 workout days
- [ ] Any athlete's Profile shows a 0-day streak, not an error

**Claiming and auth**
- [ ] Visiting the production URL while signed out redirects to `/login`
- [ ] First use: pick a name from the family list, enter a real email,
      confirm the 6-digit code actually delivers **to the real inbox**
      (no Mailpit hint should appear here — that's local-dev only) and
      shows prominently, not just as a clickable link
- [ ] A confirmation dialog appears before the profile is actually
      claimed, naming the correct person; cancelling it does not claim
      anything
- [ ] Confirming shows the success celebration, then lands on Home
      showing the right person's name
- [ ] Trying to claim that same name again from a different
      browser/session is rejected with a clear message
- [ ] Sign out, sign back in with the same email — lands straight on Home
      with no name list shown (auto-resolved)
- [ ] Refreshing the page keeps the session (no bounce back to `/login`)
- [ ] Closing and reopening the browser (not just refreshing) keeps the
      session too
- [ ] Visiting `/login` directly while already signed in redirects to
      Home rather than showing the sign-in form again

**First real workout and derived stats**
- [ ] Add an activity, confirm it appears in the feed after a hard refresh
- [ ] Streak becomes 1 day, Board reflects the new workout day, Profile's
      month calendar marks the day logged — all three derived from the
      one write, none hand-set
- [ ] Edit that activity, confirm the change survives a refresh
- [ ] Delete it, confirm it's gone after a refresh (and derived stats drop
      back to zero correctly)
- [ ] Give kudos on someone else's entry; confirm you cannot kudos your
      own
- [ ] Post a comment

**Multi-user and sign-out**
- [ ] Sign out; confirm you're bounced back to `/login` and a hard refresh
      of `/` doesn't leak the previous session's data
- [ ] Repeat sign-in/sign-out as a **second** family member; confirm their
      name, streak, and feed are theirs, not the first person's
- [ ] Confirm you still can't edit someone else's activity as the second
      person — this was verified against local RLS already; a quick sanity
      check here just confirms the same policies were part of `db push`,
      not a full re-proof

## 9. PWA deployment checklist

**Built.** The app is a real installable PWA — manifest, icons, service
worker, offline shell, and safe-area/mobile polish are all in place and
verified locally across Chrome Desktop, simulated Chrome Android, and
WebKit/Safari (see `FRONTEND_INTEGRATION.md` for the automated pass).
Nothing below needs code changes before a production deploy; treat this
as the "confirm it on real hardware once, for real" checklist, same spirit
as §8.

- [x] Manifest (`src/app/manifest.ts`, auto-served at
      `/manifest.webmanifest`) — name, short_name, `display: "standalone"`,
      `orientation: "portrait"`, `theme_color`/`background_color` matching
      `globals.css`'s `--paper` (`#f1ece1`)
- [x] Icon set — 192×192 and 512×512 `any`-purpose PNGs plus a dedicated
      512×512 maskable variant with adaptive-icon safe-zone padding for
      Android (see "Icon requirements" below)
- [x] `<link rel="manifest">`, `theme-color`, and viewport meta —
      auto-injected by Next.js from the `manifest.ts`/`viewport`/
      `metadata` exports in `src/app/layout.tsx`, including
      `viewportFit: "cover"` (required for safe-area insets to report
      non-zero) and `appleWebApp` (`capable: true`,
      `statusBarStyle: "black-translucent"`) for iOS's home-screen-app
      meta tags
- [x] Service worker (`public/sw.js`) — precaches the static app shell
      (JS/CSS bundles, icons, manifest) and the `/offline` fallback page
      on install; cache-first for static assets, network-falling-back-to-
      `/offline` for navigations; bumps and evicts its own cache version
      on every deploy that changes precached content. Registered from
      `src/components/pwa/ServiceWorkerRegistration.tsx`, production
      builds only (`NODE_ENV === "production"`) — it deliberately never
      registers under `next dev`, so local development is unaffected.
- [x] "Add to Home Screen" verified functionally in Chrome (desktop +
      simulated Android) and WebKit via Playwright — **still do a real
      on-device pass** (see §10) before telling the family to install it;
      emulation is strong evidence, not a substitute for one real iPhone
      and one real Android phone.
- [x] Confirmed via Playwright + CDP safe-area-inset emulation: Masthead,
      NavBar, and BottomSheet all correctly pad for a simulated Dynamic
      Island / home indicator (`env(safe-area-inset-*)`, gated on
      `viewport-fit=cover`) rather than leaving content under a notch or
      behind the home-indicator bar.

### Icon requirements

| File | Size | Purpose |
|---|---|---|
| `src/app/icon.png` | 512×512 | Favicon / general browser icon (Next.js auto-detects and tags) |
| `src/app/apple-icon.png` | 180×180 | iOS home-screen icon (Next.js auto-detects and tags) |
| `public/icons/icon-192.png` | 192×192 | Manifest icon, `purpose: "any"` |
| `public/icons/icon-512.png` | 512×512 | Manifest icon, `purpose: "any"` |
| `public/icons/icon-maskable-512.png` | 512×512 | Manifest icon, `purpose: "maskable"` — full-bleed art with extra inset padding so Android's adaptive-icon mask (circle/squircle/rounded-square, varies by OEM launcher) doesn't clip the logo |

All five share the same mark (an ascending 3-bar chart, rust `#9c3b32`
background, paper `#f1ece1` bars) so the icon reads consistently whether
it's cropped as a circle, a squircle, or shown square. If the brand mark
ever changes, regenerate all five from the same source art — an
inconsistent icon between, say, the browser tab and the home-screen icon
reads as broken, not intentional.

### Browser support notes

| Browser | Install | Standalone launch | Service worker | Safe-area insets |
|---|---|---|---|---|
| Chrome (Android) | Full — native "Install app" / "Add to Home Screen" prompt | Yes, no URL bar | Yes | Yes |
| Chrome (Desktop) | Full — omnibox install icon | Yes (windowed app) | Yes | N/A (no notch) |
| Safari (iOS) | Manual only — Share sheet → "Add to Home Screen"; **no automatic install prompt exists on iOS**, by Apple's design, for any web app | Yes, via `appleWebApp` meta (`black-translucent` status bar) | Yes (iOS 16.4+; Safari's service worker support is more recent and more limited than Chrome's — background sync and push are notably unsupported regardless of this app's needs) | Yes, this is exactly what `viewport-fit=cover` + `env(safe-area-inset-*)` targets |
| Firefox (Android/Desktop) | Partial — Firefox does not support the install prompt / manifest-driven install UI the same way Chromium does | Runs fine as a regular tab | Yes, service workers are supported | N/A / not tested |

The three browsers named in the milestone's testing requirement (Chrome
Desktop, Chrome Android, Safari iPhone) are fully covered. Firefox works
as an ordinary responsive site but wasn't part of the install/standalone
verification pass.

### Known limitations

- **No offline write queueing, by design.** If a write (logging an
  activity, posting a comment, giving kudos) is attempted while offline,
  it fails immediately and surfaces through the existing optimistic-
  update rollback + error Toast in `AppStateProvider` — same as any other
  failed write. There is no background sync, no retry queue, and no
  "pending" state. The milestone that added PWA support explicitly scoped
  this out ("offline workout syncing is not required... show a clear
  message rather than implementing queueing").
- **Offline navigation only replays the app shell and the `/offline`
  fallback, not prior personalized pages.** The service worker
  deliberately does not cache full page HTML for Home/Board/Profile,
  because every `(main)` route is `force-dynamic` and per-session; caching
  a rendered response risks one family member's device later showing a
  stale snapshot of a *different* family member's data on a shared
  device. Practical effect: opening a previously-visited screen while
  fully offline shows the `/offline` page, not that screen's last-seen
  content, even though the screen's static assets (JS/CSS/icons) are
  served instantly from cache once connectivity returns.
- **iOS Safari has no install prompt.** Unlike Chrome, iOS never shows an
  automatic "install this app" banner for any website — installation is
  always a manual Share → "Add to Home Screen" action. There's no code
  path that can change this; it's a platform restriction. Worth a line in
  the family-facing rollout instructions.
- **iOS service worker support has real gaps** even where installed:
  background sync and push notifications are unsupported on iOS
  regardless of this app's own code, and Safari has historically been
  more aggressive about evicting a PWA's cache storage under memory/disk
  pressure than Chrome is. The precached app shell is small, so this is a
  minor risk, not a functional gap today — noted here because there's no
  way to guarantee it never affects the "launches offline" guarantee.
- **No push notifications.** Not implemented, and no code exists toward
  it — see recommendations for future enhancements in the milestone
  summary.
- **Automated cross-browser testing so far is emulation-based**
  (Playwright's Chromium/WebKit engines + device-descriptor emulation and
  CDP-level safe-area-inset overrides), not a real physical iPhone or
  Android device. §10 below is the real-hardware pass that should happen
  once before broad family rollout.

## 10. Real-device PWA verification

Do this once, on the two actual device/browser combinations the family
will use, before telling everyone to install it (the automated Playwright
pass covers functional correctness; it cannot confirm how the OS itself
renders the install prompt, splash screen, or status bar on real
hardware):

**iPhone, Safari**
- [ ] Share → "Add to Home Screen" offers the correct name and icon
- [ ] Launching from the home screen opens standalone (no Safari
      chrome/URL bar), with a black-translucent status bar over the
      app's own paper-colored background rather than a hard color seam
- [ ] Content doesn't sit under the Dynamic Island / notch, and the home
      indicator doesn't overlap the bottom nav or a bottom sheet's buttons
- [ ] Force-quit and relaunch from the home screen icon — session
      (sign-in) persists, lands on Home directly
- [ ] Enable Airplane Mode, relaunch — previously-loaded static assets
      still render (no blank white screen); navigating to a screen not
      yet cached shows the `/offline` page, not a browser error page
- [ ] Turn Airplane Mode back on mid-session and try logging an activity
      — confirm the existing error Toast appears and nothing silently
      "succeeds" and then vanishes on next load

**Android, Chrome**
- [ ] Native install prompt (or manual "Add to Home Screen" via the menu)
      shows the correct name and icon
- [ ] Launching from the home screen opens standalone, no address bar
- [ ] Adaptive icon (maskable variant) isn't clipped oddly by the
      launcher's icon mask shape
- [ ] Force-close and relaunch — session persists
- [ ] Enable Airplane Mode, relaunch — same expectations as iOS above
- [ ] After a fresh deploy, relaunch the already-installed app and confirm
      it picks up the new version (service worker activates the new
      cache and evicts the old one) without the user needing to manually
      uninstall/reinstall
