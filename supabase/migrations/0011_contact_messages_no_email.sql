-- ============================================================================
-- Lilac — drop the email provider entirely (Brevo). Apply after 0001–0010.
-- Safe to re-run.
--
-- What changes:
--   - Contact form messages are now stored here and read from /admin/messages,
--     instead of being emailed to the admin. Service-role only — the
--     rate-limited, zod-validated /api/contact route inserts via the
--     service-role client, same as entries/events/tickets (see 0009/0010).
--   - Winner "confirmation email" is gone (see lib/tickets.ts /
--     lib/winner-emails.ts removal) — winners already appear on the public
--     /results page. `winners.email_status` / `email_sent_at` are left in
--     place but unused; harmless to keep, drop them later if you want.
-- ============================================================================

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
-- No policies: service-role only, same model as entries/tickets.
