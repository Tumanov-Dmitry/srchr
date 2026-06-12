-- Align material ownership and event participation policies with the current UI.
-- Apply manually with the database owner role.

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

revoke all on function private.is_org_member(uuid, text[]) from public;
revoke all on function private.owns_expert(uuid) from public;
grant execute on function private.is_org_member(uuid, text[]) to authenticated;
grant execute on function private.owns_expert(uuid) to authenticated;

drop policy if exists "Users create material drafts" on public.materials;
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

drop policy if exists "Owners update unpublished materials" on public.materials;
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

drop policy if exists "Owners delete material drafts" on public.materials;
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

notify pgrst, 'reload schema';
