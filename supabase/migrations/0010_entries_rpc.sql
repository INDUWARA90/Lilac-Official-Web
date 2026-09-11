-- ============================================================================
-- Lilac — close the direct-anon-insert gap on entries/events. Apply after 0001–0009.
--
-- `entries` and `events` (0001_init.sql, 0002_events.sql) granted a raw
-- `INSERT ... WITH CHECK (true)` policy to anon/authenticated. The anon key is
-- public (it ships in the browser bundle), so anyone could call Supabase's
-- REST API directly and insert rows without going through the Next.js app —
-- skipping its rate limiting, the ad-watch session check, and the zod
-- validation entirely.
--
-- This mirrors what 0008_tickets.sql does for ticket purchases, tightened the
-- same way 0009_lock_rpc_grants.sql then tightened it: the RPC is granted to
-- service_role ONLY, not anon/authenticated. The anon key can no longer write
-- to either table at all, by any path — only our own server code can, using
-- the service-role client (see the lib/tickets.ts / lib/rate-limit.ts comment
-- 0009 left: "the only way to reach them is our API routes"). `entries` also
-- gets DB-level format/length CHECKs as defense in depth on top of that.
-- ============================================================================

-- ---- entries: format/length constraints (defense in depth) -----------------
-- Mirrors lib/validation/entry.ts exactly (normalizeLkPhone's output shape,
-- and the name/address min/max bounds) so a legitimate submission from the
-- app can never violate these.
--
-- Added NOT VALID: this skips checking rows that already exist (so the
-- migration can't fail/roll back over old data of unknown shape), while still
-- enforcing the check on every new insert and update from here on. Run
-- `VALIDATE CONSTRAINT` yourself once you've confirmed existing rows comply
-- (or cleaned up the ones that don't) — see the query below each ADD.
alter table public.entries add constraint entries_email_format
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') not valid;
-- select id, email from public.entries where not (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
-- alter table public.entries validate constraint entries_email_format;

alter table public.entries add constraint entries_phone_format
  check (phone ~ '^\+94[1-9][0-9]{8}$') not valid;
-- select id, phone from public.entries where not (phone ~ '^\+94[1-9][0-9]{8}$');
-- alter table public.entries validate constraint entries_phone_format;

alter table public.entries add constraint entries_name_length
  check (char_length(name) between 2 and 120) not valid;
alter table public.entries add constraint entries_address_length
  check (char_length(address) between 5 and 400) not valid;
-- alter table public.entries validate constraint entries_name_length;
-- alter table public.entries validate constraint entries_address_length;

-- ---- entries: RPC-gated insert ----------------------------------------------
create or replace function public.create_entry(
  p_name text, p_email text, p_phone text, p_address text,
  p_age_range text, p_gender text, p_occupation text, p_district text,
  p_ad_watched_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.entries
    (name, email, phone, address, age_range, gender, occupation, district,
     consent_at, ad_watched_at)
  values
    (p_name, lower(p_email), p_phone, p_address, p_age_range, p_gender,
     p_occupation, p_district, now(), p_ad_watched_at)
  returning id into v_id;
  return v_id;
end $$;

-- service_role only — app/api/entry/route.ts calls this through the
-- admin (service-role) client, same as lib/tickets.ts does for purchases.
revoke all on function public.create_entry(text, text, text, text, text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.create_entry(text, text, text, text, text, text, text, text, timestamptz)
  to service_role;

drop policy if exists "entries_anon_insert" on public.entries;
-- No policies left on entries, and no anon/authenticated execute grant on
-- create_entry() either: the anon key can no longer write to this table by
-- any path. Only our own server code, holding the service-role key, can.

-- ---- events: same treatment, for one uniform write path across the schema --
create or replace function public.create_event(p_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.events (type) values (p_type);
end $$;

revoke all on function public.create_event(text) from public, anon, authenticated;
grant execute on function public.create_event(text) to service_role;

drop policy if exists "events_anon_insert" on public.events;
