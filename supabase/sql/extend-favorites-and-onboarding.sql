-- Favorites collections and expert-first onboarding for SRCHR.
-- The patch is additive and keeps all existing favorites and organizations.

create schema if not exists private;

create or replace function private.is_org_member(
  target_organization_id uuid,
  allowed_roles text[] default array['owner', 'admin', 'editor', 'member']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where coalesce(
        to_jsonb(om) ->> 'organization_id',
        to_jsonb(om) ->> 'org_id'
      )::uuid = target_organization_id
      and coalesce(
        to_jsonb(om) ->> 'user_id',
        to_jsonb(om) ->> 'profile_id'
      )::uuid = auth.uid()
      and coalesce(to_jsonb(om) ->> 'role', 'member') = any(allowed_roles)
  );
$$;

revoke all on function private.is_org_member(uuid, text[]) from public;
grant execute on function private.is_org_member(uuid, text[]) to authenticated;

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists market_role text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_market_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_market_role_check
      check (
        market_role is null
        or market_role in ('agency', 'company', 'independent')
      );
  end if;
end $$;

alter table public.expert_profiles
  add column if not exists onboarding_skipped boolean not null default false;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'favorites_target_type_check'
      and conrelid = 'public.favorites'::regclass
  ) then
    alter table public.favorites
      drop constraint favorites_target_type_check;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'favorites_entity_type_check'
      and conrelid = 'public.favorites'::regclass
  ) then
    alter table public.favorites
      drop constraint favorites_entity_type_check;
  end if;

  alter table public.favorites
    add constraint favorites_target_type_check
    check (target_type in ('company', 'expert', 'case', 'article', 'event'));

  alter table public.favorites
    add constraint favorites_entity_type_check
    check (entity_type in ('company', 'expert', 'case', 'article', 'event'));
end $$;

create table if not exists public.favorite_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  icon text,
  color text,
  is_public boolean not null default false,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists favorite_collections_user_name_unique
  on public.favorite_collections (user_id, lower(name));
create index if not exists favorite_collections_user_updated_idx
  on public.favorite_collections (user_id, updated_at desc);

create table if not exists public.favorite_collection_items (
  collection_id uuid not null
    references public.favorite_collections(id) on delete cascade,
  favorite_id uuid not null
    references public.favorites(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, favorite_id)
);

create index if not exists favorite_collection_items_favorite_idx
  on public.favorite_collection_items (favorite_id);

create table if not exists public.organization_join_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_role text not null default 'member'
    check (requested_role in ('admin', 'editor', 'member')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_join_requests_pending_unique
  on public.organization_join_requests (organization_id, user_id)
  where status = 'pending';
create index if not exists organization_join_requests_owner_idx
  on public.organization_join_requests (organization_id, status, created_at desc);
create index if not exists organization_join_requests_user_idx
  on public.organization_join_requests (user_id, created_at desc);

alter table public.favorite_collections enable row level security;
alter table public.favorite_collection_items enable row level security;
alter table public.organization_join_requests enable row level security;

drop policy if exists "Users manage own favorite collections"
  on public.favorite_collections;
create policy "Users manage own favorite collections"
  on public.favorite_collections for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users manage items in own favorite collections"
  on public.favorite_collection_items;
create policy "Users manage items in own favorite collections"
  on public.favorite_collection_items for all to authenticated
  using (
    exists (
      select 1
      from public.favorite_collections collection
      where collection.id = collection_id
        and collection.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.favorite_collections collection
      join public.favorites favorite on favorite.id = favorite_id
      where collection.id = collection_id
        and collection.user_id = (select auth.uid())
        and favorite.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users create organization join requests"
  on public.organization_join_requests;
create policy "Users create organization join requests"
  on public.organization_join_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Users read own organization join requests"
  on public.organization_join_requests;
create policy "Users read own organization join requests"
  on public.organization_join_requests for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_org_member(
      organization_id,
      array['owner', 'admin']::text[]
    )
  );

drop policy if exists "Organization owners manage join requests"
  on public.organization_join_requests;
create policy "Organization owners manage join requests"
  on public.organization_join_requests for update to authenticated
  using (
    private.is_org_member(
      organization_id,
      array['owner', 'admin']::text[]
    )
  )
  with check (
    private.is_org_member(
      organization_id,
      array['owner', 'admin']::text[]
    )
  );

grant select, insert, update, delete
  on public.favorite_collections to authenticated;
grant select, insert, delete
  on public.favorite_collection_items to authenticated;
grant select, insert, update
  on public.organization_join_requests to authenticated;
revoke all on public.favorite_collections from anon;
revoke all on public.favorite_collection_items from anon;
revoke all on public.organization_join_requests from anon;

notify pgrst, 'reload schema';
