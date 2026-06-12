-- SRCHR security baseline. Apply manually with an owner role.
-- This patch is idempotent and does not migrate or delete application data.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        coalesce(to_jsonb(p) ->> 'role', 'guest')
          in ('admin', 'super_admin', 'moderator')
        or coalesce(to_jsonb(p) ->> 'account_type', 'guest')
          in ('admin', 'super_admin', 'moderator')
      )
  );
$$;

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

create or replace function private.owns_expert(target_expert_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.expert_profiles ep
    where ep.id = target_expert_id
      and ep.user_id = auth.uid()
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_org_member(uuid, text[]) from public;
revoke all on function private.owns_expert(uuid) from public;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_org_member(uuid, text[]) to authenticated;
grant execute on function private.owns_expert(uuid) to authenticated;

-- Profiles: users may own a profile, but only a trusted admin client may change
-- authorization fields.
create or replace function private.protect_profile_authorization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_role text;
  old_role text;
  new_account_type text;
  old_account_type text;
begin
  if auth.role() <> 'authenticated' then
    return new;
  end if;

  new_role := coalesce(to_jsonb(new) ->> 'role', 'guest');
  new_account_type := coalesce(to_jsonb(new) ->> 'account_type', 'guest');

  if tg_op = 'INSERT' then
    if new_role <> 'guest' or new_account_type <> 'guest' then
      raise exception 'authorization fields are managed by administrators';
    end if;
    return new;
  end if;

  old_role := coalesce(to_jsonb(old) ->> 'role', 'guest');
  old_account_type := coalesce(to_jsonb(old) ->> 'account_type', 'guest');

  if new_role is distinct from old_role
    or new_account_type is distinct from old_account_type then
    raise exception 'authorization fields are managed by administrators';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_authorization on public.profiles;
create trigger protect_profile_authorization
  before insert or update on public.profiles
  for each row execute function private.protect_profile_authorization();

create or replace function private.sync_profile_type_from_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_row public.organizations%rowtype;
  member_user_id uuid;
  derived_type text;
begin
  member_user_id := coalesce(
    to_jsonb(new) ->> 'user_id',
    to_jsonb(new) ->> 'profile_id'
  )::uuid;

  select *
  into organization_row
  from public.organizations o
  where o.id = coalesce(
    to_jsonb(new) ->> 'organization_id',
    to_jsonb(new) ->> 'org_id'
  )::uuid;

  if member_user_id is null or organization_row.id is null then
    return new;
  end if;

  derived_type := case
    when organization_row.is_contractor then 'contractor'
    when organization_row.is_client then 'client'
    else 'guest'
  end;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'account_type'
  ) then
    execute $update$
      update public.profiles
      set role = $1, account_type = $1
      where id = $2
        and coalesce(role, 'guest') not in ('admin', 'super_admin', 'moderator')
        and coalesce(account_type, 'guest')
          not in ('admin', 'super_admin', 'moderator')
    $update$ using derived_type, member_user_id;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    execute $update$
      update public.profiles
      set role = $1
      where id = $2
        and coalesce(role, 'guest')
          not in ('admin', 'super_admin', 'moderator')
    $update$ using derived_type, member_user_id;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'account_type'
  ) then
    execute $update$
      update public.profiles
      set account_type = $1
      where id = $2
        and coalesce(account_type, 'guest')
          not in ('admin', 'super_admin', 'moderator')
    $update$ using derived_type, member_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_type_from_membership
  on public.organization_members;
create trigger sync_profile_type_from_membership
  after insert or update on public.organization_members
  for each row execute function private.sync_profile_type_from_membership();

alter table public.profiles enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;
end $$;

create policy "Profiles are readable by owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Profiles are created by owner"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "Profiles are updated by owner"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke delete on public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Organizations and memberships.
alter table public.organizations
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists organizations_created_by_idx
  on public.organizations (created_by);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.contractor_profiles enable row level security;
alter table public.organization_services enable row level security;

do $$
declare
  target_table text;
  policy_name text;
begin
  foreach target_table in array array[
    'organizations',
    'organization_members',
    'contractor_profiles',
    'organization_services'
  ]
  loop
    for policy_name in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, target_table);
    end loop;
  end loop;
end $$;

create policy "Published organizations are public"
  on public.organizations for select
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or private.is_org_member(id)
  );

create policy "Users create their organizations"
  on public.organizations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'draft'
  );

create policy "Organization editors update organizations"
  on public.organizations for update to authenticated
  using (
    created_by = (select auth.uid())
    or private.is_org_member(id, array['owner', 'admin', 'editor'])
  )
  with check (
    status in ('draft', 'published')
    and (
      created_by = (select auth.uid())
      or private.is_org_member(id, array['owner', 'admin', 'editor'])
    )
  );

create policy "Members read organization memberships"
  on public.organization_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_org_member(organization_id)
  );

create policy "Owners manage organization memberships"
  on public.organization_members for all to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin']))
  with check (
    private.is_org_member(organization_id, array['owner', 'admin'])
    or (
      user_id = (select auth.uid())
      and role in ('owner', 'admin')
      and exists (
        select 1 from public.organizations o
        where o.id = organization_id
          and o.created_by = (select auth.uid())
      )
    )
  );

create policy "Published contractor profiles are public"
  on public.contractor_profiles for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = contractor_profiles.organization_id
        and o.status = 'published'
        and o.is_contractor = true
    )
    or private.is_org_member(organization_id)
  );

create policy "Organization editors manage contractor profiles"
  on public.contractor_profiles for all to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin', 'editor']))
  with check (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

create policy "Published organization services are public"
  on public.organization_services for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_services.organization_id
        and o.status = 'published'
    )
    or private.is_org_member(organization_id)
  );

create policy "Organization editors manage services"
  on public.organization_services for all to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin', 'editor']))
  with check (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

grant select on public.organizations, public.contractor_profiles, public.organization_services to anon;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.contractor_profiles to authenticated;
grant select, insert, update, delete on public.organization_services to authenticated;

-- Materials: only creators and organization editors manage drafts. Publication
-- remains an administrative operation.
alter table public.materials enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'materials'
  loop
    execute format('drop policy if exists %I on public.materials', policy_name);
  end loop;
end $$;

create policy "Published materials are public"
  on public.materials for select
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or private.is_org_member(coalesce(organization_id, company_id))
  );

create policy "Users create material drafts"
  on public.materials for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status in ('draft', 'moderation')
    and (
      (
        owner_type = 'expert'
        and expert_id is not null
        and private.owns_expert(expert_id)
        and organization_id is null
        and company_id is null
      )
      or (
        coalesce(owner_type, 'company') in ('company', 'organization')
        and expert_id is null
        and private.is_org_member(
          coalesce(organization_id, company_id),
          array['owner', 'admin', 'editor']
        )
      )
    )
  );

create policy "Owners update unpublished materials"
  on public.materials for update to authenticated
  using (
    status in ('draft', 'moderation', 'rejected')
    and (
      created_by = (select auth.uid())
      or (owner_type = 'expert' and private.owns_expert(expert_id))
      or private.is_org_member(
        coalesce(organization_id, company_id),
        array['owner', 'admin', 'editor']
      )
    )
  )
  with check (
    status in ('draft', 'moderation', 'archived')
    and (
      (
        owner_type = 'expert'
        and expert_id is not null
        and private.owns_expert(expert_id)
        and organization_id is null
        and company_id is null
      )
      or (
        coalesce(owner_type, 'company') in ('company', 'organization')
        and expert_id is null
        and private.is_org_member(
          coalesce(organization_id, company_id),
          array['owner', 'admin', 'editor']
        )
      )
    )
  );

create policy "Owners delete material drafts"
  on public.materials for delete to authenticated
  using (
    status = 'draft'
    and (
      created_by = (select auth.uid())
      or (owner_type = 'expert' and private.owns_expert(expert_id))
      or private.is_org_member(
        coalesce(organization_id, company_id),
        array['owner', 'admin', 'editor']
      )
    )
  );

-- Expert profiles and material authorship.
alter table public.expert_profiles enable row level security;
alter table public.material_expert_authors enable row level security;

do $$
declare
  target_table text;
  policy_name text;
begin
  foreach target_table in array array['expert_profiles', 'material_expert_authors']
  loop
    for policy_name in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, target_table);
    end loop;
  end loop;
end $$;

create policy "Public experts are visible"
  on public.expert_profiles for select
  using (
    (is_public = true and status = 'published')
    or user_id = (select auth.uid())
  );

create policy "Users create own expert profile"
  on public.expert_profiles for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'published')
  );

create policy "Users update own non-blocked expert profile"
  on public.expert_profiles for update to authenticated
  using (user_id = (select auth.uid()) and status <> 'blocked')
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'published', 'hidden')
  );

create policy "Published material authors are public"
  on public.material_expert_authors for select
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_id and m.status = 'published'
    )
    or exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  );

create policy "Material owners manage expert authors"
  on public.material_expert_authors for all to authenticated
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  );

-- Events: owner references must belong to the current user. Promotion and
-- publication fields are protected from ordinary authenticated sessions.
create or replace function private.protect_event_admin_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated' and not private.is_admin() then
    new.is_promoted := old.is_promoted;
    new.promoted_until := old.promoted_until;
    new.promotion_url := old.promotion_url;
    new.published_at := old.published_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_event_admin_fields on public.events;
create trigger protect_event_admin_fields
  before update on public.events
  for each row execute function private.protect_event_admin_fields();

alter table public.events enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'events'
  loop
    execute format('drop policy if exists %I on public.events', policy_name);
  end loop;
end $$;

create policy "Published events are public"
  on public.events for select
  using (
    status in ('published', 'completed')
    or created_by = (select auth.uid())
    or (
      owner_type = 'organization'
      and private.is_org_member(owner_id, array['owner', 'admin', 'editor'])
    )
    or (owner_type = 'expert' and private.owns_expert(owner_id))
  );

create policy "Users create events for owned profiles"
  on public.events for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status in ('draft', 'moderation')
    and is_promoted = false
    and promoted_until is null
    and promotion_url is null
    and published_at is null
    and (
      (owner_type = 'expert' and private.owns_expert(owner_id))
      or (
        owner_type = 'organization'
        and private.is_org_member(owner_id, array['owner', 'admin', 'editor'])
      )
    )
  );

create policy "Owners update unpublished events"
  on public.events for update to authenticated
  using (
    status in ('draft', 'moderation', 'rejected', 'published')
    and (
      (owner_type = 'expert' and private.owns_expert(owner_id))
      or (
        owner_type = 'organization'
        and private.is_org_member(owner_id, array['owner', 'admin', 'editor'])
      )
    )
  )
  with check (
    status in ('draft', 'moderation', 'rejected', 'archived', 'cancelled')
    and (
      (owner_type = 'expert' and private.owns_expert(owner_id))
      or (
        owner_type = 'organization'
        and private.is_org_member(owner_id, array['owner', 'admin', 'editor'])
      )
    )
  );

alter table public.event_participants enable row level security;

drop policy if exists "Participants can upsert own participation"
  on public.event_participants;
create policy "Participants can upsert own participation"
  on public.event_participants for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.status in ('published', 'completed')
    )
  );

drop policy if exists "Participants can update own participation"
  on public.event_participants;
create policy "Participants can update own participation"
  on public.event_participants for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.status in ('published', 'completed')
    )
  );

-- Tenders and responses.
alter table public.tenders enable row level security;
alter table public.tender_responses enable row level security;

do $$
declare
  target_table text;
  policy_name text;
begin
  foreach target_table in array array['tenders', 'tender_responses']
  loop
    for policy_name in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, target_table);
    end loop;
  end loop;
end $$;

create policy "Published tenders are public"
  on public.tenders for select
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or private.is_org_member(organization_id, array['owner', 'admin', 'editor'])
  );

create policy "Organization members create tenders"
  on public.tenders for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_org_member(
      organization_id,
      array['owner', 'admin', 'editor', 'member']
    )
    and status in ('draft', 'published')
  );

create policy "Organization members update tenders"
  on public.tenders for update to authenticated
  using (
    private.is_org_member(
      organization_id,
      array['owner', 'admin', 'editor', 'member']
    )
  )
  with check (
    private.is_org_member(
      organization_id,
      array['owner', 'admin', 'editor', 'member']
    )
    and status in ('draft', 'published', 'closed', 'archived')
  );

create policy "Users and tender owners read responses"
  on public.tender_responses for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.tenders t
      where t.id = tender_id
        and private.is_org_member(
          t.organization_id,
          array['owner', 'admin', 'editor', 'member']
        )
    )
  );

create policy "Users create their responses"
  on public.tender_responses for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.tenders t
      where t.id = tender_id
        and t.status = 'published'
        and not private.is_org_member(t.organization_id)
    )
    and (
      (
        responder_type = 'expert'
        and organization_id is null
        and private.owns_expert(expert_id)
      )
      or (
        responder_type = 'contractor'
        and expert_id is null
        and private.is_org_member(organization_id)
      )
    )
  );

create policy "Tender owners update response status"
  on public.tender_responses for update to authenticated
  using (
    exists (
      select 1 from public.tenders t
      where t.id = tender_id
        and private.is_org_member(
          t.organization_id,
          array['owner', 'admin', 'editor', 'member']
        )
    )
  )
  with check (
    exists (
      select 1 from public.tenders t
      where t.id = tender_id
        and private.is_org_member(
          t.organization_id,
          array['owner', 'admin', 'editor', 'member']
        )
    )
  );

-- Trusted notification log. Users may read and acknowledge their own
-- notifications, but only the backend service role may create them.
revoke insert, update, delete on public.notification_events from authenticated;
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant select on public.notification_events to authenticated;
grant select on public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;

drop policy if exists "Authenticated users can create notification events"
  on public.notification_events;
drop policy if exists "Users can insert own notifications"
  on public.notifications;
drop policy if exists "Admins can read notification events"
  on public.notification_events;
create policy "Admins can read notification events"
  on public.notification_events for select to authenticated
  using (private.is_admin());

-- Favorites are private and should not be exposed to the anonymous role.
revoke all on public.favorites from anon;

notify pgrst, 'reload schema';
