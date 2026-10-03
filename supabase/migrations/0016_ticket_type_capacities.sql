-- Keep seating and standing inventory independent. Existing overall capacity
-- becomes the initial limit for each ticket type.

alter table public.ticket_settings
  add column seating_capacity integer,
  add column standing_capacity integer;

update public.ticket_settings
set seating_capacity = capacity,
    standing_capacity = capacity;

alter table public.ticket_settings
  alter column seating_capacity set default 100,
  alter column seating_capacity set not null,
  alter column standing_capacity set default 100,
  alter column standing_capacity set not null,
  add constraint ticket_settings_seating_capacity_check check (seating_capacity >= 0),
  add constraint ticket_settings_standing_capacity_check check (standing_capacity >= 0),
  drop column capacity;

drop function public.create_ticket_purchase(text, text, text, text, integer, text, text);

create function public.create_ticket_purchase(
  p_name text, p_email text, p_phone text, p_ticket_type text,
  p_quantity integer, p_slip_path text, p_reference text
) returns table (purchase_id uuid, purchase_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s             public.ticket_settings%rowtype;
  v_taken       integer;
  v_capacity    integer;
  v_id          uuid;
  v_price       integer;
begin
  select * into s from public.ticket_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if p_ticket_type is null or p_ticket_type not in ('seating', 'standing') then
    raise exception 'BAD_TICKET_TYPE';
  end if;
  if p_quantity < 1 or p_quantity > 10 then raise exception 'BAD_QUANTITY'; end if;

  if p_ticket_type = 'seating' then
    v_capacity := s.seating_capacity;
    v_price := s.seating_price_lkr;
  else
    v_capacity := s.standing_capacity;
    v_price := s.standing_price_lkr;
  end if;

  select coalesce(sum(quantity), 0) into v_taken
  from public.ticket_purchases
  where status in ('pending_review', 'approved')
    and ticket_type = p_ticket_type;

  if v_taken + p_quantity > v_capacity then
    if p_ticket_type = 'seating' then
      raise exception 'SOLD_OUT_SEATING';
    end if;
    raise exception 'SOLD_OUT_STANDING';
  end if;

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
