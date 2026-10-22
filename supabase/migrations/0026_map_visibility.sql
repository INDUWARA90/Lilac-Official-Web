-- 0026_map_visibility.sql
-- Allow admins to show or hide the 3D event map on public pages and navigation.

alter table public.app_config
  add column if not exists map_visible boolean not null default true;
