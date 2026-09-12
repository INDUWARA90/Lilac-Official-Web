# Lilac Official Web

Site for the annual **Lilac** company event. Visitors reach it from a QR code,
watch an ad, and fill out a form — the entry counts immediately, no email
confirmation. An admin signs in and manually triggers a raffle draw; the randomly
selected winners are emailed and listed publicly by name.

Built as an academic/demo project — see the note at the end of
`../lilac-official-web-brief.md`.

## Stack

| Concern           | Choice                                                    |
| ----------------- | -------------------------------------------------------- |
| Framework         | Next.js (App Router), full-stack — UI + API routes       |
| Data / Storage    | Supabase (Postgres + Storage; service-role key server-side)  |
| Styling           | Tailwind CSS, utility classes only — every component hand-built, no component library |
| Transactional email | Resend (free tier 3,000/mo, 100/day) — winner mail, contact forwarding, admin alerts |
| Admin auth        | Email + password (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) → HMAC-signed 24h cookie |
| Abuse control     | Per-IP in-memory rate limiting on `/api/entry` and `/api/contact` |
| Hosting           | Vercel                                                   |

## Build progress

All nine stages of the brief's suggested build order are complete (Stage 4's
admin auth was built minimally alongside Stage 5).

- [x] **1. Supabase schema + RLS policies** (staging) — `supabase/migrations/0001_init.sql`
- [x] **2. Public flow** — ad step → entry form (zod, per-IP rate limit) → `/api/entry` → confetti success screen (entry counts immediately, no email step). Design tokens + hand-built UI components (`components/ui`, `components/flow`).
- [x] **3. Static pages** — About / Privacy / Terms as marked-draft content pages (`SiteFrame` + `Prose`); Contact with a working form → `/api/contact` → emails the admin via Resend (no DB table, not stored).
- [x] **4. Admin auth** — email + password sign-in (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) + HMAC-signed 24h session cookie; `requireAdmin()` guard. AdminShell.
- [x] **5. Draw + winners** — `/admin/draw` (crypto-random from non-winner entries); winner emails run as a **background job** (`winners.email_status` queue → `/api/admin/winners/process` drains it in self-chaining batches via `after()`, so draw size never risks the function timeout); admin alert on failure; `/admin/winners` per-row resend + "Send pending now"; two CSV exports. Audit rows for login / draw / resend / export.
- [x] **6. Results + analytics** — public `/results` (winner names + live entry count); admin dashboard **funnel** (ad views → ad completed → entries, with conversion %); admin `/admin/entries` (paginated, searchable). `events` table + `POST /api/track` fired from the flow.
- [x] **7. Security + monitoring** — CSP / HSTS / X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy via `next.config.ts` `headers()`; `/admin/audit` log viewer. Audit rows already written since Stage 5.
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
- `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` — Resend account. Use `onboarding@resend.dev` to test (delivers only to your own Resend account email); for real winner mail, verify a domain and use `no-reply@<domain>`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the credentials for `/admin/login`
- `ADMIN_SESSION_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Admin panel

`/admin` is protected. Sign in at `/admin/login` with `ADMIN_EMAIL` + `ADMIN_PASSWORD`
→ an HMAC-signed `admin_session` cookie (24h) is set. One operator, no account
store, nothing to configure in Supabase. Pages: Dashboard (funnel counts),
Entries (browse/search), Draw winners, Winners (per-row resend), Video, Export
(two CSVs), Audit log.

Never commit `.env.local`. On Vercel, set the same keys under
Project → Settings → Environment Variables. No secret is `NEXT_PUBLIC_*` except
the Supabase URL, anon key, and site URL.

## Applying the database schema

1. Open your Supabase project → **SQL Editor**.
2. Either paste `SETUP_database.sql` (all migrations combined) and Run, or run
   `supabase/migrations/*.sql` one at a time in order (`0001` … `0004`).
3. Verify under **Table Editor** that `entries`, `draws`, `winners`,
   `audit_log`, `events`, and `video_config` exist, each with **RLS enabled**.

The `event-video` Storage bucket is created automatically the first time an
admin uploads a video file — no manual step.

### What the schema enforces

- **RLS on every table.** The only policy for the `anon` / `authenticated`
  roles is `INSERT` on `entries`. No `SELECT` / `UPDATE` / `DELETE` anywhere —
  all admin and public-aggregate reads go through server API routes using the
  service-role key (which bypasses RLS).
- A `BEFORE INSERT` trigger on `entries` marks the row `verified` and stamps
  `created_at` — server-controlled regardless of what the anon insert sends.
- **One entry per person:** unique on `lower(email)` and on `phone`.
- A winner can win at most once across all draws (unique on `winners.entry_id`).

## Project layout

```
app/
  page.tsx               Home — the ad → form → success flow
  api/entry/route.ts     create an entry (counts immediately, no email)
  about|privacy|terms/   marked-draft content pages
  contact/               contact form   ·   results/   public winners + live count
  api/contact/route.ts   emails the message to the admin (Resend)
  api/track/route.ts     records ad_view / ad_complete funnel events
  admin/                 login, dashboard (funnel), entries, draw, winners, video, export, audit
  api/admin/             login, logout, draw, winners/{resend,process}, video(+upload-url), export/*
  global-error.tsx       root error boundary (last-resort UI)
next.config.ts           security headers (CSP / HSTS / …)
components/
  ContactForm.tsx
  ui/                    hand-built primitives: Button, TextField, Select,
                         Checkbox, StepIndicator, Logo, SiteFrame, Prose
  flow/                  AdStep, EntryForm, SuccessCelebration, EntryExperience
  admin/                 AdminShell, AdminLogin, DrawPanel, ResendButton
lib/
  env.ts                 env access; public vs server-only, checked at use
  auth.ts                email+password check, HMAC session cookie, requireAdmin() guard
  validation/entry.ts    zod schema + Sri Lankan phone normaliser + option lists
  rate-limit.ts          small in-memory IP limiter
  draw.ts                crypto.randomInt winner picker
  csv.ts                 tiny RFC-4180 CSV builder
  audit.ts               append-to-audit_log helper
  email/resend.ts        winner mail, contact forwarding, admin alerts via Resend HTTP API
  winner-emails.ts       background winner-email queue processor
  video.ts               server: getVideoConfig() reads video_config
  video-shared.ts        client-safe: VideoConfig type, parseYouTubeId, limits
  supabase/{client,admin,types}.ts
supabase/migrations/     0001_init … 0004_no_verify_no_ticket   ·   SETUP_database.sql (combined)
```
