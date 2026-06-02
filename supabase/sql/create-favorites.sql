create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  is_pinned boolean not null default false,
  pinned_at timestamptz,
  snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.favorites
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists is_pinned boolean default false,
  add column if not exists pinned_at timestamptz,
  add column if not exists snapshot jsonb default '{}'::jsonb,
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.favorites
set
  is_pinned = coalesce(is_pinned, false),
  snapshot = coalesce(snapshot, '{}'::jsonb),
  status = coalesce(status, 'active'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'favorites'
      and column_name = 'organization_id'
  ) then
    update public.favorites
    set
      target_type = coalesce(target_type, 'company'),
      target_id = coalesce(target_id, organization_id)
    where target_id is null
      and organization_id is not null;
  end if;
end $$;

update public.favorites as favorite
set snapshot = jsonb_build_object(
  'title', coalesce(organization.name, 'Подрядчик'),
  'subtitle', organization.city,
  'image', organization.logo_url,
  'description', organization.description,
  'object_type', 'company'
)
from public.organizations as organization
where favorite.target_type = 'company'
  and favorite.target_id = organization.id
  and (
    favorite.snapshot = '{}'::jsonb
    or favorite.snapshot->>'title' is null
  );

delete from public.favorites
where user_id is null
  or target_type is null
  or target_id is null;

delete from public.favorites as duplicate
using public.favorites as original
where duplicate.ctid < original.ctid
  and duplicate.user_id = original.user_id
  and duplicate.target_type = original.target_type
  and duplicate.target_id = original.target_id;

alter table public.favorites
  alter column user_id set not null,
  alter column target_type set not null,
  alter column target_id set not null,
  alter column is_pinned set not null,
  alter column snapshot set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'favorites_target_type_check'
      and conrelid = 'public.favorites'::regclass
  ) then
    alter table public.favorites
      add constraint favorites_target_type_check
      check (target_type in ('company', 'expert', 'case', 'article'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'favorites_status_check'
      and conrelid = 'public.favorites'::regclass
  ) then
    alter table public.favorites
      add constraint favorites_status_check
      check (status in ('active', 'unavailable'));
  end if;
end $$;

create unique index if not exists favorites_user_target_unique
  on public.favorites (user_id, target_type, target_id);

create index if not exists favorites_user_sort_idx
  on public.favorites (user_id, is_pinned desc, pinned_at desc, created_at desc);

create index if not exists favorites_user_type_sort_idx
  on public.favorites (user_id, target_type, is_pinned desc, pinned_at desc, created_at desc);

alter table public.favorites enable row level security;

drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
  on public.favorites
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.favorites to anon;
grant select, insert, update, delete on public.favorites to authenticated;

notify pgrst, 'reload schema';
