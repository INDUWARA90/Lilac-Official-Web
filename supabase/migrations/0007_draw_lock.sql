-- ============================================================================
-- Lilac — app-wide config flags. Apply after 0001–0006. Safe to re-run.
--
-- First use: `draw_unlocked` gates the winner draw so it can only run once an
-- admin unlocks it on the event date. Until then the Draw page hides its
-- controls and /api/admin/draw refuses to run.
-- ============================================================================

create table if not exists public.app_config (
  id            text primary key default 'default' check (id = 'default'),
  draw_unlocked boolean not null default false,
  updated_at    timestamptz not null default now(),
  updated_by    text
);

insert into public.app_config (id) values ('default') on conflict (id) do nothing;

-- Service-role only: RLS on, no policies. Read/written through server code
-- using the service-role key.
alter table public.app_config enable row level security;
