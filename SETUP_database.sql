-- ============================================================
-- Lilac — full schema (migrations 0001–0008 combined)
-- Paste into Supabase dashboard → SQL Editor → Run.
--
-- FOR A FRESH DATABASE ONLY. This runs 0001→0005 in sequence, so it recreates
-- objects (generate_ticket_code(), the ticket_code / verification_token
-- indexes) that 0004 then drops — fine on an empty project, but it ERRORS if
-- those columns are already gone. On a database that already has 0001–0004,
-- run only supabase/migrations/0005_ads.sql instead.
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
-- audit_log — admin logins, ad changes, draws
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


-- >>> supabase/migrations/0005_ads.sql
-- ============================================================================
-- Lilac — sponsor ads become an ordered list (was: a single `video_config` row).
-- Each ad is a YouTube video, an uploaded video file, or an uploaded image
-- ("post"). The public flow shows them in `sort_order` and gates progress:
-- videos require 5s of actual playback, images auto-advance after a 5s delay.
-- Only once every ad in the list has been shown does the visitor reach the
-- entry form.
-- ============================================================================

create table if not exists public.ads (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('youtube', 'video_file', 'image')),
  youtube_id   text,
  storage_path text,
  title        text not null default 'Sponsor message',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id)
);

create index if not exists ads_sort_order_idx on public.ads (sort_order);

-- Carry the old single video over as the first ad (only if the old table is
-- still around and this hasn't already run), then drop it.
do $$
begin
  if to_regclass('public.video_config') is not null then
    insert into public.ads (kind, youtube_id, storage_path, title, sort_order)
    select
      case when kind = 'file' then 'video_file' else 'youtube' end,
      youtube_id,
      storage_path,
      title,
      0
    from public.video_config
    where id = 'default'
      and (youtube_id is not null or storage_path is not null)
      and not exists (select 1 from public.ads);

    drop table public.video_config;
  end if;
end $$;

-- Service-role only: RLS on, no policies. The public flow reads this through a
-- server component using the service-role key.
alter table public.ads enable row level security;


-- >>> supabase/migrations/0006_security.sql
-- ============================================================================
-- Lilac — security hardening. rate_limits + rl_hit(): a durable, cross-instance
-- fixed-window rate limiter (the in-memory one didn't survive serverless),
-- doubling as a single-use nonce store for the ad-watch session token.
-- ============================================================================

create table if not exists public.rate_limits (
  key        text primary key,
  count      integer not null default 0,
  reset_at   timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);

create or replace function public.rl_hit(p_key text, p_limit integer, p_window_ms bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now   timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limits as rl (key, count, reset_at, updated_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0), v_now)
  on conflict (key) do update
    set count      = case when rl.reset_at <= v_now then 1 else rl.count + 1 end,
        reset_at   = case when rl.reset_at <= v_now
                          then v_now + make_interval(secs => p_window_ms / 1000.0)
                          else rl.reset_at end,
        updated_at = v_now
  returning count into v_count;

  if random() < 0.02 then
    delete from public.rate_limits where reset_at < v_now - interval '1 day';
  end if;

  return v_count <= p_limit;
end $$;

alter table public.rate_limits enable row level security;

revoke all on function public.rl_hit(text, integer, bigint) from public;
grant execute on function public.rl_hit(text, integer, bigint) to anon, authenticated, service_role;




-- >>> supabase/migrations/0007_draw_lock.sql
-- ============================================================================
-- Lilac — app-wide config flags. `draw_unlocked` gates the winner draw so it
-- can only run once an admin unlocks it on the event date.
-- ============================================================================

create table if not exists public.app_config (
  id            text primary key default 'default' check (id = 'default'),
  draw_unlocked boolean not null default false,
  updated_at    timestamptz not null default now(),
  updated_by    text
);

insert into public.app_config (id) values ('default') on conflict (id) do nothing;

alter table public.app_config enable row level security;


-- >>> supabase/migrations/0008_tickets.sql
-- ============================================================================
-- Lilac — paid event e-tickets (manual bank transfer). Apply after 0001–0007.
-- Safe to re-run.
--
--   ticket_settings   singleton: price, capacity, sales toggle, bank details
--   ticket_purchases  one row per purchase (a buyer may request several seats)
--   tickets           one row per issued seat; `token` goes in the QR code
--   create_ticket_purchase()  capacity-safe insert (serialises on the settings row)
--
-- All tables are service-role only. The public purchase form reaches the DB
-- through create_ticket_purchase() (SECURITY DEFINER) via the API route.
-- ============================================================================

create table if not exists public.ticket_settings (
  id                  text primary key default 'default' check (id = 'default'),
  price_lkr           integer not null default 500 check (price_lkr >= 0),
  capacity            integer not null default 100 check (capacity >= 0),
  sales_open          boolean not null default true,
  bank_name           text not null default '',
  bank_account_name   text not null default '',
  bank_account_number text not null default '',
  bank_branch         text not null default '',
  bank_instructions   text not null default '',
  updated_at          timestamptz not null default now(),
  updated_by          text
);
insert into public.ticket_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.ticket_purchases (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  name         text not null,
  email        text not null,
  phone        text not null,
  quantity     integer not null check (quantity between 1 and 10),
  amount_lkr   integer not null,
  slip_path    text not null,
  status       text not null default 'pending_review'
                 check (status in ('pending_review', 'approved', 'rejected', 'cancelled')),
  review_note  text,
  reviewed_by  text,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists ticket_purchases_status_idx    on public.ticket_purchases (status);
create index if not exists ticket_purchases_created_at_idx on public.ticket_purchases (created_at desc);
-- One live purchase per person; a rejected/cancelled one doesn't block a retry.
create unique index if not exists ticket_purchases_email_live_idx
  on public.ticket_purchases (lower(email)) where status in ('pending_review', 'approved');
create unique index if not exists ticket_purchases_phone_live_idx
  on public.ticket_purchases (phone) where status in ('pending_review', 'approved');

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  purchase_id   uuid not null references public.ticket_purchases (id) on delete cascade,
  token         text not null unique,
  seat_label    text not null,
  holder_name   text not null,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at    timestamptz not null default now()
);
create index if not exists tickets_purchase_id_idx on public.tickets (purchase_id);

create or replace function public.create_ticket_purchase(
  p_name text, p_email text, p_phone text, p_quantity integer,
  p_slip_path text, p_reference text
) returns table (purchase_id uuid, purchase_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s       public.ticket_settings%rowtype;
  v_taken integer;
  v_id    uuid;
begin
  select * into s from public.ticket_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if p_quantity < 1 or p_quantity > 10 then raise exception 'BAD_QUANTITY'; end if;

  select coalesce(sum(quantity), 0) into v_taken
  from public.ticket_purchases
  where status in ('pending_review', 'approved');

  if v_taken + p_quantity > s.capacity then raise exception 'SOLD_OUT'; end if;

  insert into public.ticket_purchases
    (reference, name, email, phone, quantity, amount_lkr, slip_path)
  values
    (p_reference, p_name, lower(p_email), p_phone, p_quantity, p_quantity * s.price_lkr, p_slip_path)
  returning id into v_id;

  return query select v_id, p_reference;
end $$;

alter table public.ticket_settings  enable row level security;
alter table public.ticket_purchases enable row level security;
alter table public.tickets          enable row level security;

revoke all on function public.create_ticket_purchase(text, text, text, integer, text, text) from public;
grant execute on function public.create_ticket_purchase(text, text, text, integer, text, text)
  to anon, authenticated, service_role;
