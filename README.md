# Lilac Official Web

Site for the annual **Lilac** company event. Visitors watch an ad, fill out a
form, verify their email, and enter a raffle. An admin manually triggers a draw;
winners are emailed a confirmation and listed publicly.

Built as an academic/demo project — see the note at the end of
`../lilac-official-web-brief.md`.

## Stack

| Concern           | Choice                                                    |
| ----------------- | -------------------------------------------------------- |
| Framework         | Next.js (App Router), full-stack — UI + API routes       |
| Data / Storage / Auth | Supabase (Postgres, Storage, magic-link Auth)        |
| Styling           | Tailwind CSS, utility classes only — every component hand-built, no component library |
| Verification email | Brevo (free tier 300/day)                               |
| Winner email      | Resend (free tier 100/day) — separate from Brevo         |
| Bot protection    | Cloudflare Turnstile (not provisioned yet)               |
| Error monitoring  | Sentry — inert until `NEXT_PUBLIC_SENTRY_DSN` is set     |
| Hosting           | Vercel                                                   |

## Build progress

All nine stages of the brief's suggested build order are complete (Stage 4's
admin auth was built minimally alongside Stage 5).

- [x] **1. Supabase schema + RLS policies** (staging) — `supabase/migrations/0001_init.sql`
- [x] **2. Public flow** — ad step → entry form (zod, Turnstile) → `/api/entry` → Brevo email → `/verify` → confetti success screen. Design tokens + hand-built UI components (`components/ui`, `components/flow`).
- [x] **3. Static pages** — About / Privacy / Terms as marked-draft content pages (`ContentPage` + `Prose`); Contact with a working form → `/api/contact` → emails the admin via Brevo (no DB table, not stored).
- [x] **4. Admin auth** — passwordless email sign-in (Supabase OTP) + signed 24h session cookie; `requireAdmin()` guard. AdminShell.
- [x] **5. Draw + winners** — `/admin/draw` (crypto-random from verified, non-winner entries); winner emails run as a **background job** (`winners.email_status` queue → `/api/admin/winners/process` drains it in self-chaining batches via `after()`, so draw size never risks the function timeout); admin alert on failure; `/admin/winners` per-row resend + "Send pending now"; two CSV exports. Audit rows for login / draw / resend / export.
- [x] **6. Results + analytics** — public `/results` (winner names + ticket codes, live confirmed-entry count); admin dashboard **funnel** (ad views → ad completed → entries → verified, with conversion %); admin `/admin/entries` (paginated, searchable, status filter). New `events` table + `POST /api/track` fired from the flow.
- [x] **7. Security + monitoring** — CSP / HSTS / X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy via `next.config.ts` `headers()`; Sentry (`@sentry/nextjs`, inert without `NEXT_PUBLIC_SENTRY_DSN`, no PII, no replay); `/admin/audit` log viewer. Audit rows already written since Stage 5.
- [x] **8. Video management** — `/admin/video`: paste a YouTube URL or upload a file (≤20 MB) straight to Supabase Storage via a signed URL. Config in `video_config` (`0003_video.sql`); the public flow resolves it server-side (`lib/video.ts`). `video.update` audit rows.
- [x] **9. Design polish** — type scale + optical sizing + balanced headings + brand `::selection` and focus rings in `globals.css`; quieter step indicator (checks + tracked caps); `Logo` wordmark with diamond accent; generated `app/icon.svg`; on-brand `app/not-found.tsx`; `metadataBase` + OG tags. Motion still limited to the two allowed moments.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in. Use your **staging** Supabase
project's values for now.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase → Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — same page, **server-only**, bypasses RLS
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` — Brevo account
- `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` — Resend account
- `TURNSTILE_*` — leave blank until Cloudflare Turnstile is set up
- `ADMIN_EMAIL` — the single admin address; **must already exist** in Supabase → Authentication → Users
- `ADMIN_SESSION_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Admin panel

`/admin` is protected. Sign in at `/admin/login`: enter `ADMIN_EMAIL`, Supabase
emails a 6-digit code, enter it → a signed `admin_session` cookie (24h) is set.
No password, no Supabase session kept. Pages: Dashboard (counts), Draw winners,
Winners (resend), Export (two CSVs). Set session length in Supabase →
Authentication → Sessions if you want to tighten it further.

Never commit `.env.local`. On Vercel, set the same keys under
Project → Settings → Environment Variables. No secret is `NEXT_PUBLIC_*` except
the Supabase URL, anon key, site URL, and Turnstile **site** key.

## Applying the database schema

1. Open your **staging** Supabase project → **SQL Editor**.
2. Run each migration in `supabase/migrations/` in order:
   `0001_init.sql`, `0002_events.sql`, `0003_video.sql`.
3. Verify under **Table Editor** that `entries`, `draws`, `winners`,
   `audit_log`, `events`, and `video_config` exist, each with **RLS enabled**.

The `event-video` Storage bucket is created automatically the first time an
admin uploads a video file — no manual step.

### What the schema enforces

- **RLS on every table.** The only policy for the `anon` / `authenticated`
  roles is `INSERT` on `entries`. No `SELECT` / `UPDATE` / `DELETE` anywhere —
  all admin and public-aggregate reads go through server API routes using the
  service-role key (which bypasses RLS).
- A `BEFORE INSERT` trigger on `entries` forces `verified = false` and
  generates `verification_token` and `ticket_code` server-side, so a crafted
  anon insert cannot self-verify or pick its own ticket.
- **One entry per person:** unique on `lower(email)` and on `phone`.
- `ticket_code` format `RFL-XXXXX` from an unambiguous alphabet (no I/L/O/U).
- A winner can win at most once across all draws (unique on `winners.entry_id`).

## Project layout

```
app/
  page.tsx               Home — the ad → form → confirm flow
  verify/page.tsx        confirmation landing (from the emailed link)
  api/entry/route.ts     create unverified entry + send Brevo email
  api/verify/route.ts    mark an entry verified from its token
  about|privacy|terms/   marked-draft content pages
  contact/               contact form   ·   results/   public winners + live count
  api/contact/route.ts   emails the message to the admin (Brevo)
  api/track/route.ts     records ad_view / ad_complete funnel events
  admin/                 login, dashboard (funnel), entries, draw, winners, video, export, audit
  api/admin/             login, logout, draw, winners/{resend,process}, video(+upload-url), export/*
  global-error.tsx       root error boundary → Sentry
instrumentation*.ts      Sentry server/edge/client init (inert without a DSN)
next.config.ts           security headers + Sentry wrapper
components/
  ContactForm.tsx
  ui/                    hand-built primitives: Button, TextField, Select,
                         Checkbox, StepIndicator, Logo, SiteFrame, Prose, ContentPage
  flow/                  AdStep, EntryForm, Turnstile, CheckEmailStep,
                         ConfirmEntry, SuccessCelebration, EntryExperience
  admin/                 AdminShell, AdminLogin, DrawPanel, ResendButton
lib/
  env.ts                 env access; public vs server-only, checked at use
  auth.ts                signed admin session cookie + requireAdmin() guard
  validation/entry.ts    zod schema + Sri Lankan phone normaliser + option lists
  rate-limit.ts          small in-memory IP limiter
  turnstile.ts           server-side Turnstile check (dev-bypass / prod fail-closed)
  draw.ts                crypto.randomInt winner picker
  csv.ts                 tiny RFC-4180 CSV builder
  audit.ts               append-to-audit_log helper
  email/brevo.ts         verification email via Brevo HTTP API
  email/resend.ts        winner email + admin alert via Resend HTTP API
  video.ts               server: getVideoConfig() reads video_config
  video-shared.ts        client-safe: VideoConfig type, parseYouTubeId, limits
  supabase/{client,admin,types}.ts
supabase/migrations/     0001_init.sql, 0002_events.sql, 0003_video.sql
```
