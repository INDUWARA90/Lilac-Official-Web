alter table public.tshirt_orders
  add column if not exists order_items jsonb;

alter table public.tshirt_orders
  drop constraint if exists tshirt_orders_quantity_check;

alter table public.tshirt_orders
  add constraint tshirt_orders_quantity_items_check
  check (
    case
      when order_items is null then quantity between 1 and 10
      when jsonb_typeof(order_items) <> 'array' then false
      else quantity between 1 and 3
        and jsonb_array_length(order_items) = quantity
    end
  );

drop function if exists public.create_tshirt_order(
  text, text, text, text, text, text, integer, text, text
);

create or replace function public.create_tshirt_order(
  p_name text,
  p_registration_number text,
  p_faculty text,
  p_email text,
  p_phone text,
  p_order_items jsonb,
  p_receipt_path text,
  p_reference text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  s public.tshirt_settings%rowtype;
  v_id uuid;
  v_quantity integer;
begin
  select * into s from public.tshirt_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if jsonb_typeof(p_order_items) is distinct from 'array' then raise exception 'BAD_ITEMS'; end if;

  v_quantity := jsonb_array_length(p_order_items);
  if v_quantity < 1 or v_quantity > 3 then raise exception 'BAD_QUANTITY'; end if;

  if exists (
    select 1
    from jsonb_array_elements(p_order_items) as item
    where coalesce(item ->> 'size', '') not in ('M', 'L', 'XL', 'XXL')
       or coalesce(item ->> 'color', '') not in ('White', 'Black')
  ) then
    raise exception 'BAD_ITEMS';
  end if;

  insert into public.tshirt_orders
    (reference, name, registration_number, faculty, email, phone, tshirt_size,
     quantity, order_items, amount_lkr, receipt_path)
  values
    (p_reference, p_name, p_registration_number, p_faculty, lower(p_email), p_phone,
     p_order_items -> 0 ->> 'size', v_quantity, p_order_items,
     v_quantity * s.price_lkr, p_receipt_path)
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.create_tshirt_order(text, text, text, text, text, jsonb, text, text) from public;
grant execute on function public.create_tshirt_order(text, text, text, text, text, jsonb, text, text)
  to anon, authenticated, service_role;
