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
| Error monitoring  | Sentry (added in a later stage)                          |
| Hosting           | Vercel                                                   |

## Build progress

Following the brief's suggested build order:

- [x] **1. Supabase schema + RLS policies** (staging) — `supabase/migrations/0001_init.sql`
- [ ] 2. Public flow: ad → form (Turnstile) → Brevo verification → verified entry → success screen
- [ ] 3. Static pages: Home shell, About, Privacy, Terms, Contact (with form)
- [ ] 4. Admin auth (magic link) + dashboard shell
- [ ] 5. Draw logic + winner emails (Resend) + manual resend + CSV export
- [ ] 6. Public results page + live entry count + funnel analytics
- [ ] 7. Security headers, Sentry, audit logging
- [ ] 8. Video management (YouTube link / Supabase Storage upload)
- [ ] 9. Design polish pass

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

Never commit `.env.local`. On Vercel, set the same keys under
Project → Settings → Environment Variables. No secret is `NEXT_PUBLIC_*` except
the Supabase URL, anon key, site URL, and Turnstile **site** key.

## Applying the database schema

1. Open your **staging** Supabase project → **SQL Editor**.
2. Paste the full contents of `supabase/migrations/0001_init.sql` and **Run**.
3. Verify under **Table Editor** that `entries`, `draws`, `winners`, and
   `audit_log` exist, and that each shows **RLS enabled**.

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
app/                     Next.js App Router (routes added per stage)
lib/
  env.ts                 fail-fast env access; splits public vs server-only
  supabase/
    client.ts            browser anon client — INSERT on `entries` only
    admin.ts             service-role client, server-only, bypasses RLS
    types.ts             hand-written DB types mirroring the migration
supabase/
  migrations/            SQL applied to the Supabase project
```
