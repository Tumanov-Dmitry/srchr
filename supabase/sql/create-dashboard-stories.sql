create table if not exists public.dashboard_story_highlights (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('contractor', 'client')),
  label text not null,
  title text,
  icon text not null default 'sparkles',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  slides jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dashboard_story_highlights_audience_idx
  on public.dashboard_story_highlights (audience, is_active, sort_order);

alter table public.dashboard_story_highlights enable row level security;

grant select on public.dashboard_story_highlights to authenticated;

drop policy if exists "Authenticated users can read active dashboard stories"
  on public.dashboard_story_highlights;
create policy "Authenticated users can read active dashboard stories"
  on public.dashboard_story_highlights
  for select
  to authenticated
  using (is_active = true);
