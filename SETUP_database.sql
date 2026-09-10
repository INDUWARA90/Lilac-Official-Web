-- ============================================================
-- Lilac — full schema (migrations 0001–0004 combined)
-- Paste into Supabase dashboard → SQL Editor → Run. Idempotent.
-- ============================================================

-- >>> supabase/migrations/0001_init.sql
-- ============================================================================
-- Lilac Official Web — initial schema + Row Level Security
-- Apply this to the STAGING Supabase project first (SQL Editor → paste → Run),
-- then to production later. Idempotent-ish: safe to re-run on a fresh project.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto. Supabase enables it by default, but be
-- explicit so this file also works on a bare Postgres.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

-- Delivery state of a single winner-confirmation email. We track this per winner
-- so the admin can see failures and manually resend (see brief: "if an automatic
-- winner email fails to send, notify the admin").
do $$
begin
  if not exists (select 1 from pg_type where typname = 'email_status') then
    create type email_status as enum ('pending', 'sent', 'failed');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Ticket code generator:  RFL-XXXXX  (e.g. RFL-8X2K9)
-- Crockford-ish alphabet: digits + uppercase letters minus I, L, O, U so codes
-- are unambiguous when read aloud or printed. 32^5 ≈ 33.5M combinations — plenty
-- of headroom for ~1200 entrants, and the loop guarantees uniqueness anyway.
-- ----------------------------------------------------------------------------
create or replace function public.generate_ticket_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  candidate text;
  i int;
begin
  loop
    candidate := 'RFL-';
    for i in 1..5 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- Retry on the astronomically unlikely collision.
    exit when not exists (select 1 from public.entries where ticket_code = candidate);
  end loop;
  return candidate;
end $$;

-- ----------------------------------------------------------------------------
-- entries
-- ----------------------------------------------------------------------------
create table if not exists public.entries (
  id                  uuid primary key default gen_random_uuid(),

  -- Personal data (PII — never logged to console or third-party services).
  name                text not null,
  email               text not null,
  phone               text not null,          -- stored normalised as +94XXXXXXXXX
  address             text not null,

  -- Demographics — collected for funnel/segment analytics only. Nullable at the
  -- DB layer; the entry API enforces presence with zod so the schema stays
  -- flexible if the form's field set changes.
  age_range           text,
  gender              text,
  occupation          text,
  district            text,

  -- Consent: the timestamp the user ticked the disclosure checkbox (which states
  -- that winners' full names are published publicly). Non-null == consent given.
  consent_at          timestamptz not null,

  -- When the user finished / skipped the ad. Used for the funnel
  -- (ad views → ad completed → verified).
  ad_watched_at       timestamptz,

  -- Verification lifecycle. An entry is only "counted" once verified = true.
  verified            boolean not null default false,
  verified_at         timestamptz,

  -- Opaque token embedded in the email confirmation link. The entry API route
  -- generates this server-side and never returns it to the browser, so only a
  -- recipient of the email can verify. The column default is a safety net; the
  -- trigger deliberately does NOT overwrite a route-supplied value.
  verification_token  uuid not null default gen_random_uuid(),
  verification_sent_at timestamptz,

  -- Public-facing raffle ticket. Assigned at insert by the trigger so every
  -- entry has one immediately; only verified winners' codes are ever shown.
  ticket_code         text not null,

  created_at          timestamptz not null default now()
);

-- One entry per person: unique on BOTH email and phone (brief requirement).
-- Case-insensitive email uniqueness via a lower() expression index.
create unique index if not exists entries_email_key      on public.entries (lower(email));
create unique index if not exists entries_phone_key      on public.entries (phone);
create unique index if not exists entries_ticket_code_key on public.entries (ticket_code);

-- Fast lookup when the user clicks the confirmation link.
create index if not exists entries_verification_token_idx on public.entries (verification_token);
-- Supports the admin dashboard: filter by status, order by newest.
create index if not exists entries_verified_idx  on public.entries (verified);
create index if not exists entries_created_at_idx on public.entries (created_at desc);

-- Trigger: force server-controlled columns on insert regardless of what the
-- (anon) caller sends. Defence-in-depth on top of the API route's zod schema —
-- a crafted anon insert can't self-verify or choose its own ticket code.
-- Note: verification_token is intentionally left alone so the entry API route
-- can supply its own server-generated, never-echoed value.
create or replace function public.set_entry_defaults()
returns trigger
language plpgsql
as $$
begin
  new.verified             := false;
  new.verified_at          := null;
  new.verification_sent_at := null;
  new.ticket_code          := public.generate_ticket_code();
  new.created_at           := now();
  return new;
end $$;

drop trigger if exists trg_set_entry_defaults on public.entries;
create trigger trg_set_entry_defaults
  before insert on public.entries
  for each row execute function public.set_entry_defaults();

-- ----------------------------------------------------------------------------
-- draws  — one row per admin-triggered draw
-- ----------------------------------------------------------------------------
create table if not exists public.draws (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references auth.users (id),
  winner_count  int not null check (winner_count > 0),
  drawn_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- winners  — which entries won in which draw
-- ----------------------------------------------------------------------------
create table if not exists public.winners (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references public.entries (id) on delete cascade,
  draw_id       uuid not null references public.draws (id)   on delete cascade,
  email_status  email_status not null default 'pending',
  email_sent_at timestamptz,
  created_at    timestamptz not null default now()
);

-- A person can win at most once across all draws. The draw logic also excludes
-- prior winners, but the constraint is the hard guarantee.
create unique index if not exists winners_entry_id_key on public.winners (entry_id);
create index if not exists winners_draw_id_idx on public.winners (draw_id);

-- ----------------------------------------------------------------------------
-- audit_log — admin logins, video changes, draws
-- ----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references auth.users (id),   -- nullable: e.g. failed login
  action      text not null,                     -- e.g. 'admin.login', 'draw.run', 'video.update'
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Policy model:
--   * RLS is ENABLED on every table.
--   * The ONLY policy granted to untrusted roles (anon / authenticated) is
--     INSERT on `entries`. No SELECT / UPDATE / DELETE anywhere.
--   * Every admin read/write goes through a server-side API route using the
--     service-role key, which BYPASSES RLS entirely — so those tables need no
--     policies at all.
-- ============================================================================

alter table public.entries   enable row level security;
alter table public.draws     enable row level security;
alter table public.winners   enable row level security;
alter table public.audit_log enable row level security;

-- entries: anon + authenticated may INSERT only. The trigger above neutralises
-- any attempt to pre-set verified / ticket_code, so `with check (true)` is safe.
drop policy if exists "entries_anon_insert" on public.entries;
create policy "entries_anon_insert"
  on public.entries
  for insert
  to anon, authenticated
  with check (true);

-- No other policies. draws / winners / audit_log have RLS on and zero policies,
-- which means: no access for anon or authenticated, full access for service-role.


-- >>> supabase/migrations/0002_events.sql
-- ============================================================================
-- Lilac — funnel events (Stage 6)
-- Apply after 0001_init.sql. One row per tracked moment; the admin dashboard
-- counts them for the funnel:  ad views → ad completed → verified entries.
-- (The "verified entries" number comes from public.entries, not from here.)
-- ============================================================================

create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('ad_view', 'ad_complete')),
  created_at timestamptz not null default now()
);

create index if not exists events_type_idx on public.events (type);

-- Same RLS model as `entries`: the public (anon) may only INSERT. All reads are
-- server-side through the service-role key.
alter table public.events enable row level security;

drop policy if exists "events_anon_insert" on public.events;
create policy "events_anon_insert"
  on public.events
  for insert
  to anon, authenticated
  with check (true);


-- >>> supabase/migrations/0003_video.sql
-- ============================================================================
-- Lilac — ad video configuration (Stage 8)
-- Apply after 0002_events.sql. A single row holds the current ad video: either
-- a YouTube video id, or a path to a file in the `event-video` Storage bucket
-- (the bucket is created automatically on first upload from the admin panel).
-- ============================================================================

create table if not exists public.video_config (
  id           text primary key default 'default' check (id = 'default'),
  kind         text not null default 'youtube' check (kind in ('youtube', 'file')),
  youtube_id   text,
  storage_path text,
  title        text not null default 'Lilac — this year''s film',
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id)
);

-- Seed the single row.
insert into public.video_config (id) values ('default')
on conflict (id) do nothing;

-- Service-role only: RLS on, no policies. The public flow reads this through a
-- server component using the service-role key.
alter table public.video_config enable row level security;


-- >>> supabase/migrations/0004_no_verify_no_ticket.sql
-- ============================================================================
-- Lilac — drop the email-verification step and the public ticket code.
-- Apply after 0001–0003 (SQL Editor → paste → Run). Idempotent.
--
-- After this: an entry counts as soon as it's submitted (the API flips
-- `verified` to true straight away), and there is no per-entry ticket code.
-- ============================================================================

-- 1. Trigger no longer generates a ticket code; it just marks the row verified.
create or replace function public.set_entry_defaults()
returns trigger
language plpgsql
as $$
begin
  new.verified    := true;
  new.verified_at := now();
  new.created_at  := now();
  return new;
end $$;

-- 2. Drop the ticket-code column, its index and generator function.
drop index if exists public.entries_ticket_code_key;
alter table public.entries drop column if exists ticket_code;
drop function if exists public.generate_ticket_code();

-- 3. Drop the now-unused verification-token columns and index.
drop index if exists public.entries_verification_token_idx;
alter table public.entries drop column if exists verification_token;
alter table public.entries drop column if exists verification_sent_at;


