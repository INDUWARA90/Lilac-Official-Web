-- Collect the buyer's student registration number and faculty for ticket orders.
alter table public.ticket_purchases
  add column registration_number text not null default '',
  add column faculty text not null default '';

drop function public.create_ticket_purchase(text, text, text, text[], integer, text, text);

create function public.create_ticket_purchase(
  p_name text, p_registration_number text, p_faculty text,
  p_email text, p_phone text, p_ticket_types text[],
  p_quantity integer, p_slip_path text, p_reference text
) returns table (purchase_id uuid, purchase_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s              public.ticket_settings%rowtype;
  v_seating      integer;
  v_standing     integer;
  v_id           uuid;
  v_ticket_type  text;
begin
  select * into s from public.ticket_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if p_quantity < 1 or p_quantity > 5 then raise exception 'BAD_QUANTITY'; end if;
  if p_ticket_types is null or cardinality(p_ticket_types) <> p_quantity
     or not (p_ticket_types <@ array['seating', 'standing']::text[]) then
    raise exception 'BAD_TICKET_TYPES';
  end if;

  select count(*) filter (where ticket_type = 'seating'),
         count(*) filter (where ticket_type = 'standing')
    into v_seating, v_standing
  from unnest(p_ticket_types) as selected(ticket_type);

  if v_seating > 0 and (
    select coalesce(sum(cardinality(array_positions(ticket_types, 'seating'))), 0)
    from public.ticket_purchases
    where status in ('pending_review', 'approved')
  ) + v_seating > s.seating_capacity then
    raise exception 'SOLD_OUT_SEATING';
  end if;
  if v_standing > 0 and (
    select coalesce(sum(cardinality(array_positions(ticket_types, 'standing'))), 0)
    from public.ticket_purchases
    where status in ('pending_review', 'approved')
  ) + v_standing > s.standing_capacity then
    raise exception 'SOLD_OUT_STANDING';
  end if;

  v_ticket_type := case
    when v_seating > 0 and v_standing > 0 then 'mixed'
    when v_seating > 0 then 'seating'
    else 'standing'
  end;

  insert into public.ticket_purchases
    (reference, name, registration_number, faculty, email, phone, ticket_type,
     ticket_types, quantity, amount_lkr, slip_path)
  values
    (p_reference, p_name, p_registration_number, p_faculty, lower(p_email), p_phone,
     v_ticket_type, p_ticket_types, p_quantity,
     v_seating * s.seating_price_lkr + v_standing * s.standing_price_lkr,
     p_slip_path)
  returning id into v_id;

  return query select v_id, p_reference;
end $$;

revoke all on function public.create_ticket_purchase(text, text, text, text, text, text[], integer, text, text)
  from public, anon, authenticated;
grant execute on function public.create_ticket_purchase(text, text, text, text, text, text[], integer, text, text)
  to service_role;
