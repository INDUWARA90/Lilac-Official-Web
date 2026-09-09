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
