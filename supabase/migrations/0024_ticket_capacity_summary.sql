-- Return only ticket capacity totals to the application instead of transferring
-- every active purchase row for each availability read.
create or replace function public.get_ticket_capacity_totals()
returns table (seating_taken integer, standing_taken integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where selected.ticket_type = 'seating')::integer,
    count(*) filter (where selected.ticket_type = 'standing')::integer
  from public.ticket_purchases as purchase
  cross join lateral unnest(purchase.ticket_types) as selected(ticket_type)
  where purchase.status in ('pending_review', 'approved');
$$;

revoke all on function public.get_ticket_capacity_totals() from public, anon, authenticated;
grant execute on function public.get_ticket_capacity_totals() to service_role;
