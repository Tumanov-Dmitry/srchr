-- Public guest access for published SRCHR catalog content.
-- Guest policies never call private helper functions. Authenticated policies
-- retain owner/member access to unpublished records.

-- Organizations.
drop policy if exists "Published organizations are public" on public.organizations;
drop policy if exists "Published organizations are visible to guests" on public.organizations;
drop policy if exists "Authenticated users read organizations" on public.organizations;

create policy "Published organizations are visible to guests"
  on public.organizations for select to anon
  using (status = 'published');

create policy "Authenticated users read organizations"
  on public.organizations for select to authenticated
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or private.is_org_member(id)
  );

-- Contractor profiles.
drop policy if exists "Published contractor profiles are public" on public.contractor_profiles;
drop policy if exists "Published contractor profiles are visible to guests" on public.contractor_profiles;
drop policy if exists "Authenticated users read contractor profiles" on public.contractor_profiles;

create policy "Published contractor profiles are visible to guests"
  on public.contractor_profiles for select to anon
  using (
    exists (
      select 1 from public.organizations o
      where o.id = contractor_profiles.organization_id
        and o.status = 'published'
        and o.is_contractor = true
    )
  );

create policy "Authenticated users read contractor profiles"
  on public.contractor_profiles for select to authenticated
  using (
    exists (
      select 1 from public.organizations o
      where o.id = contractor_profiles.organization_id
        and o.status = 'published'
        and o.is_contractor = true
    )
    or private.is_org_member(organization_id)
  );

-- Organization services.
drop policy if exists "Published organization services are public" on public.organization_services;
drop policy if exists "Published organization services are visible to guests" on public.organization_services;
drop policy if exists "Authenticated users read organization services" on public.organization_services;

create policy "Published organization services are visible to guests"
  on public.organization_services for select to anon
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_services.organization_id
        and o.status = 'published'
    )
  );

create policy "Authenticated users read organization services"
  on public.organization_services for select to authenticated
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_services.organization_id
        and o.status = 'published'
    )
    or private.is_org_member(organization_id)
  );

-- Materials and authors.
drop policy if exists "Published materials are public" on public.materials;
drop policy if exists "Published materials are visible to guests" on public.materials;
drop policy if exists "Authenticated users read materials" on public.materials;

create policy "Published materials are visible to guests"
  on public.materials for select to anon
  using (status = 'published');

create policy "Authenticated users read materials"
  on public.materials for select to authenticated
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or private.is_org_member(coalesce(organization_id, company_id))
  );

drop policy if exists "Published material authors are public" on public.material_expert_authors;
drop policy if exists "Published material authors are visible to guests" on public.material_expert_authors;
drop policy if exists "Authenticated users read material authors" on public.material_expert_authors;

create policy "Published material authors are visible to guests"
  on public.material_expert_authors for select to anon
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_id and m.status = 'published'
    )
  );

create policy "Authenticated users read material authors"
  on public.material_expert_authors for select to authenticated
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.status = 'published'
          or m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  );

-- Expert profiles.
drop policy if exists "Public experts are visible" on public.expert_profiles;
drop policy if exists "Public experts are visible to guests" on public.expert_profiles;
drop policy if exists "Authenticated users read expert profiles" on public.expert_profiles;

create policy "Public experts are visible to guests"
  on public.expert_profiles for select to anon
  using (is_public = true and status = 'published');

create policy "Authenticated users read expert profiles"
  on public.expert_profiles for select to authenticated
  using (
    (is_public = true and status = 'published')
    or user_id = (select auth.uid())
  );

-- Events.
drop policy if exists "Published events are public" on public.events;
drop policy if exists "Published events are visible to guests" on public.events;
drop policy if exists "Authenticated users read events" on public.events;

create policy "Published events are visible to guests"
  on public.events for select to anon
  using (status in ('published', 'completed'));

create policy "Authenticated users read events"
  on public.events for select to authenticated
  using (
    status in ('published', 'completed')
    or created_by = (select auth.uid())
    or (
      owner_type = 'organization'
      and private.is_org_member(owner_id, array['owner', 'admin', 'editor'])
    )
    or (owner_type = 'expert' and private.owns_expert(owner_id))
  );

-- Tenders.
drop policy if exists "Published tenders are public" on public.tenders;
drop policy if exists "Published tenders are visible to guests" on public.tenders;
drop policy if exists "Authenticated users read tenders" on public.tenders;

create policy "Published tenders are visible to guests"
  on public.tenders for select to anon
  using (status = 'published');

create policy "Authenticated users read tenders"
  on public.tenders for select to authenticated
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or private.is_org_member(organization_id, array['owner', 'admin', 'editor'])
  );

-- Price requests: catalog is public, detail remains protected by the app.
drop policy if exists "Active price requests are visible to guests" on public.price_requests;
create policy "Active price requests are visible to guests"
  on public.price_requests for select to anon
  using (status = 'active');

grant select on public.organizations to anon;
grant select on public.contractor_profiles to anon;
grant select on public.organization_services to anon;
grant select on public.services to anon;
grant select on public.materials to anon;
grant select on public.material_expert_authors to anon;
grant select on public.expert_profiles to anon;
grant select on public.events to anon;
grant select on public.tenders to anon;
grant select on public.price_requests to anon;

notify pgrst, 'reload schema';
