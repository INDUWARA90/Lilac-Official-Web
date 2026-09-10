-- ============================================================================
-- Lilac — security hardening. Apply after 0001–0005. Safe to re-run.
--
--   rate_limits + rl_hit()  — a durable, cross-instance fixed-window rate
--   limiter (the in-memory one didn't survive serverless), doubling as a
--   single-use nonce store for the ad-watch session token.
-- ============================================================================

create table if not exists public.rate_limits (
  key        text primary key,
  count      integer not null default 0,
  reset_at   timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);

-- Atomic "record a hit, tell me whether we're still under the limit".
-- With p_limit = 1 it works as a one-time nonce check (true once, then false).
-- SECURITY DEFINER: runs as the owner so callers need no direct table grant;
-- it only ever touches this one table and pins search_path.
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

  -- Opportunistic cleanup so the table can't grow unbounded.
  if random() < 0.02 then
    delete from public.rate_limits where reset_at < v_now - interval '1 day';
  end if;

  return v_count <= p_limit;
end $$;

alter table public.rate_limits enable row level security;
-- No policies: service-role only. rl_hit() is SECURITY DEFINER.

revoke all on function public.rl_hit(text, integer, bigint) from public;
grant execute on function public.rl_hit(text, integer, bigint) to anon, authenticated, service_role;
