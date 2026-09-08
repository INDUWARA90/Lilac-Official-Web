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

  -- Opaque token embedded in the Brevo confirmation link. Generated server-side
  -- by the trigger below — never trusted from client input.
  verification_token  uuid not null default gen_random_uuid(),
  verification_sent_at timestamptz,

  -- Public-facing raffle ticket. Assigned at insert by the trigger.
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
-- (anon) caller sends. Defence-in-depth on top of the API route's zod schema.
create or replace function public.set_entry_defaults()
returns trigger
language plpgsql
as $$
begin
  new.verified            := false;
  new.verified_at         := null;
  new.verification_token  := gen_random_uuid();
  new.verification_sent_at := null;
  new.ticket_code         := public.generate_ticket_code();
  new.created_at          := now();
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

-- Also force RLS for the table owner, so a mistaken query with the anon/auth
-- role can never be silently owner-privileged.
alter table public.entries   force row level security;
alter table public.draws     force row level security;
alter table public.winners   force row level security;
alter table public.audit_log force row level security;

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
