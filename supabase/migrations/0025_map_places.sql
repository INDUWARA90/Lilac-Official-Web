-- 0025_map_places.sql
-- Interactive 3D event map places and audit log restoration

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
-- No policies granted to anon or authenticated. Service role only.

create table if not exists public.map_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('stall', 'stage', 'food')),
  description text not null,
  location_tag text not null,
  position_x double precision not null default 0,
  position_z double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists map_places_category_idx on public.map_places (category);
create index if not exists map_places_created_at_idx on public.map_places (created_at asc);

alter table public.map_places enable row level security;

-- Anon and authenticated clients can only SELECT (read-only public map view)
drop policy if exists "map_places_select_public" on public.map_places;
create policy "map_places_select_public"
  on public.map_places
  for select
  to anon, authenticated
  using (true);

-- Insert initial sample places if the table is empty
insert into public.map_places (name, category, description, location_tag, position_x, position_z)
select
  v.name, v.category, v.description, v.location_tag, v.position_x, v.position_z
from (
  values
    ('Mayathra Main Stage', 'stage', 'Headline musical performances, acoustic showcase, and grand evening finale', 'Central Arena', 0.0, 0.0),
    ('Acoustic Garden Stage', 'stage', 'Unplugged acoustic sets, poetry reading, and open mic performances', 'East Garden Lawn', 26.0, -18.0),
    ('Official Merchandise Stall', 'stall', 'Event branded t-shirts, caps, wristbands, and commemorative stickers', 'Near Main Gate', -24.0, -18.0),
    ('Art & Creative Crafts', 'stall', 'Handmade university art pieces, illustrations, and handcrafted jewelry', 'North Promenade', -26.0, 16.0),
    ('Tech & Robotics Showcase', 'stall', 'Student tech demos, interactive robotics displays, and mini-challenges', 'West Pavilion', -14.0, 26.0),
    ('Artisan Coffee & Bakery', 'food', 'Freshly brewed specialty coffee, iced matcha, brownies, and pastries', 'East Food Court', 22.0, 14.0),
    ('Street Flavors Courtyard', 'food', 'Hot kottu roti, burgers, artisanal wraps, and savory finger foods', 'South Dining Area', 12.0, -26.0),
    ('Fresh Juices & Mocktails', 'food', 'Chilled tropical fruit blends, lemonades, and iced botanical coolers', 'Southwest Plaza', -14.0, -25.0)
) as v(name, category, description, location_tag, position_x, position_z)
where not exists (select 1 from public.map_places limit 1);
