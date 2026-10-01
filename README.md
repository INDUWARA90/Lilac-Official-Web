# Lilac Official Web

Site for the annual **Lilac** company event, combining two independent flows:

- **Raffle** — visitors reach it from a QR code, watch an ad, and fill out a
  free entry form. The entry counts immediately (no email confirmation). An
  admin signs in and manually triggers a raffle draw; winners are emailed and
  listed publicly by name at `/results`.
- **Paid tickets** — a separate bank-transfer ticket purchase flow
  (`/tickets`): buyer submits their details + a transfer slip, an admin
  reviews and approves it, and the buyer's QR e-ticket(s) get emailed and are
  scannable at check-in. Not connected to the raffle — buying a ticket
  doesn't grant a raffle entry, and entering the raffle doesn't require a
  ticket.

Built as an academic/demo project — see the note at the end of
`../lilac-official-web-brief.md`.

## Stack

| Concern              | Choice                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| Framework             | Next.js (App Router), full-stack — UI + API routes                             |
| Data / Storage        | Supabase (Postgres + Storage; service-role key server-side)                    |
| Styling               | Tailwind CSS, utility classes only — every component hand-built, no component library |
| Transactional email   | Mailjet (free tier) — e-ticket delivery, winner mail, contact forwarding       |
| Admin auth            | Email + password → HMAC-signed 24h cookie. Two roles: full admin (`ADMIN_EMAIL`) and an optional, more limited ticket manager (`TICKET_MANAGER_EMAIL`) — see `lib/auth.ts` |
| Door-staff check-in   | Separate shared-code login (`CHECKIN_ACCESS_CODE`) scoped to check-in only     |
| Abuse control          | Durable per-IP/per-key rate limiting via a Postgres RPC (`lib/rate-limit.ts`, fails open) |
| Hosting                | Vercel                                                                         |

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in — every variable is
documented there and in `lib/env.ts`. Use your **staging** Supabase project's
values for now.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase → Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — same page, **server-only**, bypasses RLS
- `NEXT_PUBLIC_SITE_URL` — used to build absolute ticket/check-in links
- `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL`, `MAILJET_SENDER_NAME` — Mailjet account. Leave unset to run without email; each flow still succeeds, it just logs to `/admin/audit` instead of sending
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — full-admin credentials for `/admin/login`
- `ADMIN_SESSION_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `TICKET_MANAGER_EMAIL`, `TICKET_MANAGER_PASSWORD` — optional second login, scoped to ticket review + check-in only
- `AD_SESSION_SECRET` — optional, falls back to `ADMIN_SESSION_SECRET`
- `CHECKIN_ACCESS_CODE` — shared code that unlocks the door-staff check-in pages
- `CHECKIN_SESSION_SECRET` — optional, falls back to `ADMIN_SESSION_SECRET`; set a real value in production

### Admin panel

`/admin` is protected. Sign in at `/admin/login` with either the full-admin or
ticket-manager credentials → an HMAC-signed `admin_session` cookie (24h) is
set. Pages: Dashboard (funnel counts), Entries (browse/search), Draw, Winners
(per-row resend), Ads, Analytics (site-wide + per-sponsor-ad breakdown),
Tickets (review purchases + settings), Messages (contact-form submissions),
Audit log, Export (CSV: entries / winners / tickets / check-ins / analytics).
The ticket manager role can review purchases and check people in, but not
touch money settings, the raffle draw, or analytics.

Door staff use a separate login at `/checkin` with `CHECKIN_ACCESS_CODE`,
scoped only to scanning/checking in tickets.

Never commit `.env.local`. On Vercel, set the same keys under
Project → Settings → Environment Variables. No secret is `NEXT_PUBLIC_*`
except the Supabase URL, anon key, and site URL.

## Applying the database schema

1. Open your Supabase project → **SQL Editor**.
2. Run `supabase/migrations/0001_init.sql` through
  `supabase/migrations/0013_ad_analytics.sql` one file at a time, in numerical
  order. Run each migration as a separate SQL Editor query.
3. Verify under **Table Editor** that `entries`, `draws`, `winners`,
   `audit_log`, `events`, `ads`, `contact_messages`, `ticket_settings`,
   `ticket_purchases`, and `tickets` exist, each with **RLS enabled**.
   (`video_config` existed briefly but was folded into `ads` by
   `0005_ads.sql` — don't expect it on a fresh install.)

The `event-video`, `event-ad-images`, and ticket-slip Storage buckets are
created automatically the first time they're used — no manual step.

### What the schema enforces

- **RLS on every table.** The only policy for the `anon` / `authenticated`
  roles is `INSERT` on `entries` (via a SECURITY DEFINER RPC, see
  `0010_entries_rpc.sql`) and the ticket-purchase RPC in `0008_tickets.sql`.
  No `SELECT` / `UPDATE` / `DELETE` anywhere — all admin and public-aggregate
  reads go through server API routes using the service-role key (which
  bypasses RLS).
- **One entry per person:** unique on `lower(email)` and on `phone`.
- A winner can win at most once across all draws (unique on `winners.entry_id`).
- A winner's email delivery state (`winners.email_status`: `pending` →
  `sending` → `sent`/`failed`) is claimed atomically before sending, so the
  auto-send after a draw and a manual "Resend" click can't double-send the
  same winner's email (`0012_winner_email_claim.sql`, `lib/winner-emails.ts`).
- **One live ticket purchase per person:** unique on `lower(email)` and on
  `phone` among `pending_review`/`approved` purchases; a rejected/cancelled
  one doesn't block a retry. Approving a purchase is claimed atomically
  (`status = 'pending_review' → 'approved'`, guarded on the current status) so
  two admins approving at once can't double-issue tickets.

## Project layout

```
app/
  page.tsx               Home — the ad → form → success flow (raffle)
  api/entry/route.ts     create a raffle entry (counts immediately)
  about|privacy|terms/   marked-draft content pages
  contact/               contact form   ·   results/   public winners + live count
  api/contact/route.ts   stores the message, then best-effort emails the admin (Mailjet)
  api/track/route.ts     records ad_view / ad_complete funnel events
  tickets/                buy-a-ticket form · tickets/status  buyer self-lookup
  api/tickets/           create purchase, status lookup, slip upload-url
  ticket/[token]/         public single-ticket QR page
  checkin/                door-staff login + scan UI
  api/checkin/            check-in login/logout, token check-in/undo
  admin/                  login, dashboard (funnel), entries, draw, winners, ads, analytics, tickets, export, audit
  api/admin/              login, logout, draw, winners/resend, tickets, ads(+upload-url), export/*
  global-error.tsx        root error boundary (last-resort UI)
next.config.ts             security headers (CSP / HSTS / …)
components/
  ContactForm.tsx
  ui/                     hand-built primitives: Button, TextField, Select,
                          Checkbox, StepIndicator, Logo, SiteFrame, Prose
  flow/                   AdStep, EntryForm, SuccessCelebration, EntryExperience
  tickets/                TicketPurchaseForm and related
  checkin/                scan/check-in UI
  admin/                  AdminShell, AdminLogin, DrawPanel, ResendButton, TicketReviewActions, ...
lib/
  env.ts                  env access; public vs server-only, checked at use
  auth.ts                 email+password check, HMAC session cookie, requireAdmin()/requireFullAdmin()
  checkin-auth.ts          door-staff check-in session
  validation/entry.ts      zod schema + Sri Lankan phone normaliser + option lists
  rate-limit.ts            durable per-key rate limiter (Postgres RPC, fails open)
  draw.ts                  crypto.randomInt winner picker
  csv.ts                   tiny RFC-4180 CSV builder (incl. multi-section files)
  audit.ts                 append-to-audit_log helper
  analytics.ts             site-wide + per-sponsor-ad interaction numbers (events.ad_id)
  email/mailjet.ts         e-ticket, winner mail, contact forwarding via Mailjet HTTP API
  winner-emails.ts         send/resend winner emails, race-safe claim
  tickets.ts               purchase creation, approval, check-in logic
  tickets-shared.ts         client-safe ticket types/constants
  ads.ts / ads-shared.ts    sponsor ad list (YouTube/video/image), bucket names + limits
  app-config.ts             misc singleton config (e.g. draw lock)
  supabase/{client,admin,types}.ts
supabase/migrations/       0001_init … 0013_ad_analytics
```
