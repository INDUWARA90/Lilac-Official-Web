-- ============================================================================
-- Lilac — ad video configuration (Stage 8)
-- Apply after 0002_events.sql. A single row holds the current ad video: either
-- a YouTube video id, or a path to a file in the `event-video` Storage bucket
-- (the bucket is created automatically on first upload from the admin panel).
-- ============================================================================

create table if not exists public.video_config (
  id           text primary key default 'default' check (id = 'default'),
  kind         text not null default 'youtube' check (kind in ('youtube', 'file')),
  youtube_id   text,
  storage_path text,
  title        text not null default 'Lilac — this year''s film',
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id)
);

-- Seed the single row.
insert into public.video_config (id) values ('default')
on conflict (id) do nothing;

-- Service-role only: RLS on, no policies. The public flow reads this through a
-- server component using the service-role key.
alter table public.video_config enable row level security;
