-- ============================================================================
-- Lilac — tighten function grants. Apply after 0001–0008. Safe to re-run.
--
-- `rl_hit` and `create_ticket_purchase` are only ever called server-side
-- through the service-role client (lib/rate-limit.ts, lib/tickets.ts). They
-- were granted to anon/authenticated for flexibility; revoke that so the only
-- way to reach them is our API routes. Capacity, rate-limit and nonce logic
-- can no longer be poked directly with the public anon key.
-- ============================================================================

revoke execute on function public.rl_hit(text, integer, bigint)
  from anon, authenticated;

revoke execute on function public.create_ticket_purchase(text, text, text, integer, text, text)
  from anon, authenticated;
