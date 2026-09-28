-- ============================================================================
-- Lilac — per-ad interaction analytics, so sponsors can see how their own ad
-- performed (not just the site-wide funnel). Apply after 0001-0012.
--
--   events.ad_id       — which ad a 'ad_shown'/'ad_watched' event was about.
--                         Nullable: the existing flow-level 'ad_view' /
--                         'ad_complete' events (fired once per session, see
--                         components/flow/track.ts) stay ad_id = null and
--                         keep their current meaning untouched.
--   'ad_shown'          — a specific ad became visible in the flow.
--   'ad_watched'        — the visitor satisfied that ad's watch/view
--                         requirement and moved on (see AdsStep.tsx).
-- ============================================================================

alter table public.events
  add column if not exists ad_id uuid references public.ads (id) on delete set null;

create index if not exists events_ad_id_idx on public.events (ad_id);
create index if not exists events_type_ad_id_idx on public.events (type, ad_id);

alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check
  check (type in ('ad_view', 'ad_complete', 'ad_shown', 'ad_watched'));

-- create_event() gains an optional p_ad_id — PostgREST lets callers omit it
-- (it defaults to null), so the existing flow-level track() calls that don't
-- pass one keep working unchanged. Drop the old single-arg signature first:
-- `create or replace` matches by full signature, so without this we'd end up
-- with two overloaded create_event()s instead of one replaced.
drop function if exists public.create_event(text);

create function public.create_event(p_type text, p_ad_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.events (type, ad_id) values (p_type, p_ad_id);
end $$;

revoke all on function public.create_event(text, uuid) from public, anon, authenticated;
grant execute on function public.create_event(text, uuid) to service_role;
