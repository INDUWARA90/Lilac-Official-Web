-- Add seating and standing ticket prices and persist the selected type per
-- purchase. Existing single-price settings and purchases become seating.

alter table public.ticket_settings
  add column seating_price_lkr integer,
  add column standing_price_lkr integer not null default 300 check (standing_price_lkr >= 0);

update public.ticket_settings
set seating_price_lkr = price_lkr;

alter table public.ticket_settings
  alter column seating_price_lkr set default 500,
  alter column seating_price_lkr set not null,
  add constraint ticket_settings_seating_price_lkr_check check (seating_price_lkr >= 0),
  drop column price_lkr;

alter table public.ticket_purchases
  add column ticket_type text not null default 'seating'
    check (ticket_type in ('seating', 'standing'));

with numbered_tickets as (
  select
    t.id,
    p.ticket_type,
    p.quantity,
    row_number() over (partition by p.id order by t.created_at, t.id) as ticket_number
  from public.tickets t
  join public.ticket_purchases p on p.id = t.purchase_id
)
update public.tickets t
set seat_label = case
  when n.ticket_type = 'seating' then 'Seating'
  else 'Standing'
end || case
  when n.quantity = 1 then ''
  else format(' %s of %s', n.ticket_number, n.quantity)
end
from numbered_tickets n
where t.id = n.id;

drop function public.create_ticket_purchase(text, text, text, integer, text, text);

create function public.create_ticket_purchase(
  p_name text, p_email text, p_phone text, p_ticket_type text,
  p_quantity integer, p_slip_path text, p_reference text
) returns table (purchase_id uuid, purchase_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s       public.ticket_settings%rowtype;
  v_taken integer;
  v_id    uuid;
  v_price integer;
begin
  select * into s from public.ticket_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if p_ticket_type is null or p_ticket_type not in ('seating', 'standing') then
    raise exception 'BAD_TICKET_TYPE';
  end if;
  if p_quantity < 1 or p_quantity > 10 then raise exception 'BAD_QUANTITY'; end if;

  select coalesce(sum(quantity), 0) into v_taken
  from public.ticket_purchases
  where status in ('pending_review', 'approved');

  if v_taken + p_quantity > s.capacity then raise exception 'SOLD_OUT'; end if;

  v_price := case p_ticket_type
    when 'seating' then s.seating_price_lkr
    when 'standing' then s.standing_price_lkr
  end;

  insert into public.ticket_purchases
    (reference, name, email, phone, ticket_type, quantity, amount_lkr, slip_path)
  values
    (p_reference, p_name, lower(p_email), p_phone, p_ticket_type, p_quantity,
     p_quantity * v_price, p_slip_path)
  returning id into v_id;

  return query select v_id, p_reference;
end $$;

revoke all on function public.create_ticket_purchase(text, text, text, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.create_ticket_purchase(text, text, text, text, integer, text, text)
  to service_role;
