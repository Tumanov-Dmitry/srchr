create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('case', 'article')),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  author text,
  company_id uuid references public.organizations(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'draft' check (
    status in ('draft', 'moderation', 'published', 'rejected', 'archived')
  ),
  category text,
  tags text,
  reading_time integer,
  content jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

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
