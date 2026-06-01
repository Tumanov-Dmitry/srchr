create table if not exists public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  slug text not null unique,
  avatar_url text,
  first_name text not null,
  last_name text,
  position text,
  short_description text,
  city text,
  specializations text,
  skills text,
  activity_areas text,
  experience_description text,
  experience_years integer,
  telegram_url text,
  contact_email text,
  website_url text,
  linkedin_url text,
  behance_url text,
  dribbble_url text,
  is_public boolean not null default false,
  is_open_to_work boolean not null default true,
  status text not null default 'draft' check (
    status in ('draft', 'published', 'hidden', 'blocked', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expert_profiles_user_id_idx
  on public.expert_profiles (user_id);

create index if not exists expert_profiles_public_idx
  on public.expert_profiles (is_public, status);

alter table public.expert_profiles enable row level security;

drop policy if exists "Public experts are visible" on public.expert_profiles;
create policy "Public experts are visible"
  on public.expert_profiles
  for select
  using (is_public = true and status = 'published');

drop policy if exists "Users can manage own expert profile" on public.expert_profiles;
create policy "Users can manage own expert profile"
  on public.expert_profiles
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on public.expert_profiles to anon;
grant select, insert, update, delete on public.expert_profiles to authenticated;

alter table public.materials
  add column if not exists owner_type text default 'company',
  add column if not exists expert_id uuid references public.expert_profiles(id) on delete set null;

create table if not exists public.material_expert_authors (
  material_id uuid not null references public.materials(id) on delete cascade,
  expert_id uuid not null references public.expert_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (material_id, expert_id)
);

alter table public.material_expert_authors enable row level security;

drop policy if exists "Material expert authors are public for published materials" on public.material_expert_authors;
create policy "Material expert authors are public for published materials"
  on public.material_expert_authors
  for select
  using (
    exists (
      select 1
      from public.materials
      where materials.id = material_expert_authors.material_id
        and materials.status = 'published'
    )
  );

drop policy if exists "Users can manage own expert authorship" on public.material_expert_authors;
create policy "Users can manage own expert authorship"
  on public.material_expert_authors
  for all
  using (
    exists (
      select 1
      from public.expert_profiles
      where expert_profiles.id = material_expert_authors.expert_id
        and expert_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.expert_profiles
      where expert_profiles.id = material_expert_authors.expert_id
        and expert_profiles.user_id = auth.uid()
    )
  );

grant select on public.material_expert_authors to anon;
grant select, insert, update, delete on public.material_expert_authors to authenticated;
