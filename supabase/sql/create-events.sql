create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  event_type text not null default 'other',
  start_date timestamptz,
  end_date timestamptz,
  city text,
  address text,
  format text not null default 'offline',
  external_url text,
  price_type text not null default 'free',
  price_note text,
  owner_type text not null,
  owner_id uuid not null,
  speakers text,
  tags text,
  categories text,
  status text not null default 'draft',
  is_promoted boolean not null default false,
  promoted_until timestamptz,
  promotion_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint events_event_type_check check (
    event_type in (
      'conference',
      'meetup',
      'webinar',
      'workshop',
      'education',
      'exhibition',
      'private_meeting',
      'other'
    )
  ),
  constraint events_format_check check (format in ('online', 'offline', 'hybrid')),
  constraint events_price_type_check check (price_type in ('free', 'paid')),
  constraint events_owner_type_check check (owner_type in ('expert', 'organization')),
  constraint events_status_check check (
    status in (
      'draft',
      'moderation',
      'published',
      'rejected',
      'archived',
      'cancelled',
      'completed'
    )
  )
);

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_participants_status_check check (
    status in ('going', 'interested', 'not_going')
  ),
  constraint event_participants_unique_user_event unique (event_id, user_id)
);

alter table if exists public.events
  alter column start_date drop not null;

create index if not exists events_status_start_date_idx on public.events (status, start_date);
create index if not exists events_owner_idx on public.events (owner_type, owner_id);
create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists events_promoted_idx on public.events (is_promoted, promoted_until);
create index if not exists event_participants_user_id_idx on public.event_participants (user_id);
create index if not exists event_participants_event_id_idx on public.event_participants (event_id);

grant select, insert, update, delete on public.events to authenticated;
grant select on public.events to anon;
grant select, insert, update, delete on public.event_participants to authenticated;

alter table public.events enable row level security;
alter table public.event_participants enable row level security;

drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select
  using (status in ('published', 'completed'));

drop policy if exists "Event creators can read own events" on public.events;
create policy "Event creators can read own events"
  on public.events for select
  to authenticated
  using (created_by = auth.uid());

drop policy if exists "Organization editors can read events" on public.events;
create policy "Organization editors can read events"
  on public.events for select
  to authenticated
  using (
    owner_type = 'organization'
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = events.owner_id
        and om.user_id = auth.uid()
        and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
    )
  );

drop policy if exists "Users can create events" on public.events;
create policy "Users can create events"
  on public.events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and status in ('draft', 'moderation')
    and is_promoted = false
    and promoted_until is null
    and promotion_url is null
    and published_at is null
    and (
      (
        owner_type = 'expert'
        and exists (
          select 1 from public.expert_profiles ep
          where ep.id = events.owner_id
            and ep.user_id = auth.uid()
        )
      )
      or (
        owner_type = 'organization'
        and exists (
          select 1 from public.organization_members om
          where om.organization_id = events.owner_id
            and om.user_id = auth.uid()
            and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
        )
      )
    )
  );

drop policy if exists "Creators can update non-published events" on public.events;
create policy "Creators can update non-published events"
  on public.events for update
  to authenticated
  using (
    created_by = auth.uid()
    and status in ('draft', 'moderation', 'rejected')
    and (
      (
        owner_type = 'expert'
        and exists (
          select 1 from public.expert_profiles ep
          where ep.id = events.owner_id and ep.user_id = auth.uid()
        )
      )
      or (
        owner_type = 'organization'
        and exists (
          select 1 from public.organization_members om
          where om.organization_id = events.owner_id
            and om.user_id = auth.uid()
            and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
        )
      )
    )
  )
  with check (
    created_by = auth.uid()
    and status in ('draft', 'moderation', 'rejected', 'archived', 'cancelled')
    and (
      (
        owner_type = 'expert'
        and exists (
          select 1 from public.expert_profiles ep
          where ep.id = events.owner_id and ep.user_id = auth.uid()
        )
      )
      or (
        owner_type = 'organization'
        and exists (
          select 1 from public.organization_members om
          where om.organization_id = events.owner_id
            and om.user_id = auth.uid()
            and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
        )
      )
    )
  );

drop policy if exists "Organization editors can update events" on public.events;
create policy "Organization editors can update events"
  on public.events for update
  to authenticated
  using (
    owner_type = 'organization'
    and status in ('draft', 'moderation', 'rejected', 'published')
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = events.owner_id
        and om.user_id = auth.uid()
        and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
    )
  )
  with check (
    owner_type = 'organization'
    and status in ('draft', 'moderation', 'rejected', 'archived', 'cancelled')
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = events.owner_id
        and om.user_id = auth.uid()
        and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
    )
  );

drop policy if exists "Participants can read own participation" on public.event_participants;
create policy "Participants can read own participation"
  on public.event_participants for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Participants can upsert own participation" on public.event_participants;
create policy "Participants can upsert own participation"
  on public.event_participants for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Participants can update own participation" on public.event_participants;
create policy "Participants can update own participation"
  on public.event_participants for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Participants can delete own participation" on public.event_participants;
create policy "Participants can delete own participation"
  on public.event_participants for delete
  to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
