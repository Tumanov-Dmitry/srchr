create table if not exists public.price_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  service_category text not null,
  industry text,
  project_scale text,
  expected_start_date date,
  expected_deadline date,
  location text,
  format text not null default 'online',
  created_by uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'draft',
  converted_tender_id uuid references public.tenders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_requests_format_check
    check (format in ('online', 'offline', 'hybrid')),
  constraint price_requests_status_check
    check (status in ('draft', 'active', 'completed', 'cancelled', 'converted_to_tender'))
);

create table if not exists public.price_request_responses (
  id uuid primary key default gen_random_uuid(),
  price_request_id uuid not null references public.price_requests(id) on delete cascade,
  responder_type text not null,
  expert_id uuid references public.expert_profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  min_cost numeric(14, 2) not null,
  max_cost numeric(14, 2) not null,
  min_duration_days integer not null,
  max_duration_days integer not null,
  comment text,
  willing_to_participate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_request_responses_type_check
    check (responder_type in ('expert', 'organization')),
  constraint price_request_responses_owner_check
    check (
      (responder_type = 'expert' and expert_id is not null and organization_id is null)
      or
      (responder_type = 'organization' and organization_id is not null and expert_id is null)
    ),
  constraint price_request_responses_cost_check
    check (min_cost >= 0 and max_cost >= min_cost),
  constraint price_request_responses_duration_check
    check (
      min_duration_days > 0
      and max_duration_days >= min_duration_days
    )
);

create table if not exists public.price_request_invites (
  id uuid primary key default gen_random_uuid(),
  price_request_id uuid not null references public.price_requests(id) on delete cascade,
  target_type text not null,
  expert_id uuid references public.expert_profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_request_invites_type_check
    check (target_type in ('expert', 'organization')),
  constraint price_request_invites_target_check
    check (
      (target_type = 'expert' and expert_id is not null and organization_id is null)
      or
      (target_type = 'organization' and organization_id is not null and expert_id is null)
    ),
  constraint price_request_invites_status_check
    check (status in ('invited', 'viewed', 'responded', 'declined'))
);

create index if not exists price_requests_status_created_at_idx
  on public.price_requests (status, created_at desc);
create index if not exists price_requests_created_by_idx
  on public.price_requests (created_by, created_at desc);
create index if not exists price_requests_organization_id_idx
  on public.price_requests (organization_id, created_at desc);
create index if not exists price_requests_service_category_idx
  on public.price_requests (lower(service_category));
create index if not exists price_request_responses_request_idx
  on public.price_request_responses (price_request_id, created_at desc);
create unique index if not exists price_request_responses_expert_unique
  on public.price_request_responses (price_request_id, expert_id)
  where expert_id is not null;
create unique index if not exists price_request_responses_organization_unique
  on public.price_request_responses (price_request_id, organization_id)
  where organization_id is not null;
create index if not exists price_request_invites_recipient_idx
  on public.price_request_invites (recipient_id, created_at desc);
create unique index if not exists price_request_invites_expert_unique
  on public.price_request_invites (price_request_id, expert_id)
  where expert_id is not null;
create unique index if not exists price_request_invites_organization_unique
  on public.price_request_invites (price_request_id, organization_id)
  where organization_id is not null;

grant select, insert, update on public.price_requests to authenticated;
grant select, insert, update, delete on public.price_request_responses to authenticated;
grant select, insert, update on public.price_request_invites to authenticated;

alter table public.price_requests enable row level security;
alter table public.price_request_responses enable row level security;
alter table public.price_request_invites enable row level security;

drop policy if exists "Active price requests are visible to authenticated users"
  on public.price_requests;
create policy "Active price requests are visible to authenticated users"
  on public.price_requests for select
  to authenticated
  using (status = 'active');

drop policy if exists "Owners can read price requests" on public.price_requests;
create policy "Owners can read price requests"
  on public.price_requests for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1
        from public.organization_members om
        where om.organization_id = price_requests.organization_id
          and om.user_id = (select auth.uid())
          and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
      )
    )
  );

drop policy if exists "Users can create price requests" on public.price_requests;
create policy "Users can create price requests"
  on public.price_requests for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and status in ('draft', 'active')
    and converted_tender_id is null
    and (
      organization_id is null
      or exists (
        select 1
        from public.organization_members om
        where om.organization_id = price_requests.organization_id
          and om.user_id = (select auth.uid())
          and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
      )
    )
  );

drop policy if exists "Owners can update price requests" on public.price_requests;
create policy "Owners can update price requests"
  on public.price_requests for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1
        from public.organization_members om
        where om.organization_id = price_requests.organization_id
          and om.user_id = (select auth.uid())
          and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
      )
    )
  )
  with check (
    created_by = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1
        from public.organization_members om
        where om.organization_id = price_requests.organization_id
          and om.user_id = (select auth.uid())
          and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
      )
    )
  );

drop policy if exists "Request owners can read responses"
  on public.price_request_responses;
create policy "Request owners can read responses"
  on public.price_request_responses for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or exists (
      select 1
      from public.price_requests pr
      where pr.id = price_request_responses.price_request_id
        and (
          pr.created_by = (select auth.uid())
          or (
            pr.organization_id is not null
            and exists (
              select 1
              from public.organization_members om
              where om.organization_id = pr.organization_id
                and om.user_id = (select auth.uid())
                and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
            )
          )
        )
    )
  );

drop policy if exists "Providers can create responses"
  on public.price_request_responses;
create policy "Providers can create responses"
  on public.price_request_responses for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.price_requests pr
      where pr.id = price_request_responses.price_request_id
        and pr.status = 'active'
        and pr.created_by <> (select auth.uid())
    )
    and (
      (
        responder_type = 'expert'
        and exists (
          select 1 from public.expert_profiles ep
          where ep.id = price_request_responses.expert_id
            and ep.user_id = (select auth.uid())
        )
      )
      or (
        responder_type = 'organization'
        and exists (
          select 1 from public.organization_members om
          join public.organizations o
            on o.id = om.organization_id
          where o.id = price_request_responses.organization_id
            and o.is_contractor = true
            and om.user_id = (select auth.uid())
            and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
        )
      )
    )
  );

drop policy if exists "Providers can update responses"
  on public.price_request_responses;
create policy "Providers can update responses"
  on public.price_request_responses for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

drop policy if exists "Providers can delete responses"
  on public.price_request_responses;
create policy "Providers can delete responses"
  on public.price_request_responses for delete
  to authenticated
  using (created_by = (select auth.uid()));

drop policy if exists "Recipients can read price request invites"
  on public.price_request_invites;
create policy "Recipients can read price request invites"
  on public.price_request_invites for select
  to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists "Recipients can update price request invites"
  on public.price_request_invites;
create policy "Recipients can update price request invites"
  on public.price_request_invites for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

notify pgrst, 'reload schema';
