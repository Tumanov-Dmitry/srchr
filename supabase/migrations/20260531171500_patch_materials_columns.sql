alter table public.materials
  add column if not exists type text,
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists cover_url text,
  add column if not exists author text,
  add column if not exists company_id uuid references public.organizations(id) on delete set null,
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists status text default 'draft',
  add column if not exists category text,
  add column if not exists tags text,
  add column if not exists reading_time integer,
  add column if not exists content jsonb default '{}'::jsonb,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists published_at timestamptz;

update public.materials
set
  type = coalesce(type, 'case'),
  title = coalesce(title, 'Материал'),
  slug = coalesce(slug, id::text),
  status = coalesce(status, 'draft'),
  content = coalesce(content, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.materials
  alter column type set not null,
  alter column title set not null,
  alter column slug set not null,
  alter column status set not null,
  alter column content set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

create unique index if not exists materials_slug_key
  on public.materials (slug);

create index if not exists materials_type_status_idx
  on public.materials (type, status);

create index if not exists materials_company_id_idx
  on public.materials (company_id);

create index if not exists materials_organization_id_idx
  on public.materials (organization_id);

grant select on public.materials to anon;
grant select, insert, update, delete on public.materials to authenticated;

alter table public.materials enable row level security;

drop policy if exists "Published materials are public" on public.materials;
create policy "Published materials are public"
  on public.materials
  for select
  using (status = 'published');

drop policy if exists "Organization members can manage materials" on public.materials;
create policy "Organization members can manage materials"
  on public.materials
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
