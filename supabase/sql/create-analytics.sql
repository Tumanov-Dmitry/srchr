-- SRCHR analytics v1.
-- Apply with the database owner:
-- docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
--   < supabase/sql/create-analytics.sql

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.analytics_events
  add column if not exists event_type text,
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists owner_type text,
  add column if not exists owner_id uuid,
  add column if not exists source text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists visitor_key text;

update public.analytics_events
set event_type = coalesce(event_type, event_name),
    actor_user_id = coalesce(actor_user_id, user_id),
    owner_type = coalesce(
      owner_type,
      case when organization_id is not null then 'organization' end
    ),
    owner_id = coalesce(owner_id, organization_id),
    metadata = case
      when metadata = '{}'::jsonb then coalesce(event_data, '{}'::jsonb)
      else metadata
    end
where event_type is null
   or actor_user_id is null
   or (owner_type is null and organization_id is not null)
   or metadata = '{}'::jsonb;

alter table public.analytics_events
  alter column event_type set not null;

create table if not exists public.analytics_daily_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  target_type text not null,
  target_id uuid not null,
  owner_type text not null,
  owner_id uuid not null,
  metric_key text not null,
  metric_value bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_daily_stats_value_check check (metric_value >= 0),
  constraint analytics_daily_stats_unique unique (
    date,
    target_type,
    target_id,
    owner_type,
    owner_id,
    metric_key
  )
);

create table if not exists public.market_survey_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  survey_key text not null,
  question_key text not null,
  answer jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_survey_answers_unique unique (
    user_id,
    survey_key,
    question_key
  )
);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_target_idx
  on public.analytics_events (target_type, target_id, created_at desc);
create index if not exists analytics_events_owner_idx
  on public.analytics_events (owner_type, owner_id, created_at desc);
create index if not exists analytics_events_actor_idx
  on public.analytics_events (actor_user_id, created_at desc);
create index if not exists analytics_events_type_idx
  on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_events_unique_view_idx
  on public.analytics_events (
    target_type,
    target_id,
    visitor_key,
    created_at
  )
  where visitor_key is not null;
create index if not exists analytics_daily_stats_owner_date_idx
  on public.analytics_daily_stats (owner_type, owner_id, date desc);
create index if not exists analytics_daily_stats_target_date_idx
  on public.analytics_daily_stats (target_type, target_id, date desc);
create index if not exists market_survey_answers_user_idx
  on public.market_survey_answers (user_id, updated_at desc);

create or replace function private.analytics_is_admin()
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
        to_jsonb(p) ->> 'role' in ('admin', 'super_admin', 'moderator')
        or to_jsonb(p) ->> 'account_type'
          in ('admin', 'super_admin', 'moderator')
      )
  );
$$;

create or replace function private.can_view_analytics(
  analytics_owner_type text,
  analytics_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.analytics_is_admin()
    or (
      analytics_owner_type = 'expert'
      and exists (
        select 1
        from public.expert_profiles ep
        where ep.id = analytics_owner_id
          and ep.user_id = auth.uid()
      )
    )
    or (
      analytics_owner_type = 'organization'
      and exists (
        select 1
        from public.organization_members om
        where coalesce(
          to_jsonb(om) ->> 'organization_id',
          to_jsonb(om) ->> 'org_id'
        )::uuid = analytics_owner_id
          and coalesce(
            to_jsonb(om) ->> 'user_id',
            to_jsonb(om) ->> 'profile_id'
          )::uuid = auth.uid()
          and coalesce(to_jsonb(om) ->> 'role', 'member')
            in ('owner', 'admin', 'editor')
      )
    );
$$;

create or replace function private.increment_analytics_metric(
  metric_date date,
  analytics_target_type text,
  analytics_target_id uuid,
  analytics_owner_type text,
  analytics_owner_id uuid,
  analytics_metric_key text,
  amount bigint default 1
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.analytics_daily_stats (
    date,
    target_type,
    target_id,
    owner_type,
    owner_id,
    metric_key,
    metric_value
  )
  values (
    metric_date,
    analytics_target_type,
    analytics_target_id,
    analytics_owner_type,
    analytics_owner_id,
    analytics_metric_key,
    greatest(amount, 0)
  )
  on conflict (
    date,
    target_type,
    target_id,
    owner_type,
    owner_id,
    metric_key
  ) do update
  set metric_value = public.analytics_daily_stats.metric_value + excluded.metric_value,
      updated_at = now();
$$;

create or replace function private.aggregate_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metric_name text;
  event_day date := (new.created_at at time zone 'UTC')::date;
  unique_view boolean := false;
begin
  metric_name := case new.event_type
    when 'profile_view' then 'views'
    when 'contractor_view' then 'views'
    when 'expert_view' then 'views'
    when 'material_view' then 'views'
    when 'tender_view' then 'views'
    when 'event_view' then 'views'
    when 'favorite_added' then 'favorites'
    when 'contact_click' then 'contact_clicks'
    when 'external_link_click' then 'external_clicks'
    when 'tender_response_created' then 'responses'
    when 'event_participation_going' then 'participation_going'
    when 'event_participation_interested' then 'participation_interested'
    when 'event_participation_not_going' then 'participation_not_going'
    when 'qr_scan' then 'qr_scans'
    when 'ics_download' then 'calendar_adds'
    when 'telegram_share' then 'shares'
    else null
  end;

  if metric_name is null
     or new.target_type is null
     or new.target_id is null
     or new.owner_type is null
     or new.owner_id is null then
    return new;
  end if;

  perform private.increment_analytics_metric(
    event_day,
    new.target_type,
    new.target_id,
    new.owner_type,
    new.owner_id,
    metric_name,
    1
  );

  if metric_name = 'views'
     and (new.actor_user_id is not null or new.visitor_key is not null) then
    select not exists (
      select 1
      from public.analytics_events ae
      where ae.id <> new.id
        and ae.target_type = new.target_type
        and ae.target_id = new.target_id
        and (ae.created_at at time zone 'UTC')::date = event_day
        and (
          (new.actor_user_id is not null and ae.actor_user_id = new.actor_user_id)
          or (
            new.actor_user_id is null
            and new.visitor_key is not null
            and ae.visitor_key = new.visitor_key
          )
        )
    )
    into unique_view;

    if unique_view then
      perform private.increment_analytics_metric(
        event_day,
        new.target_type,
        new.target_id,
        new.owner_type,
        new.owner_id,
        'unique_views',
        1
      );
    end if;
  end if;

  return new;
exception
  when others then
    raise warning 'analytics aggregation failed for event %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists analytics_events_aggregate_trigger
  on public.analytics_events;
create trigger analytics_events_aggregate_trigger
after insert on public.analytics_events
for each row execute function private.aggregate_analytics_event();

alter table public.analytics_events enable row level security;
alter table public.analytics_daily_stats enable row level security;
alter table public.market_survey_answers enable row level security;

drop policy if exists "Owners can read analytics events"
  on public.analytics_events;
create policy "Owners can read analytics events"
on public.analytics_events
for select
to authenticated
using (
  private.can_view_analytics(owner_type, owner_id)
  or actor_user_id = auth.uid()
);

drop policy if exists "Owners can read analytics daily stats"
  on public.analytics_daily_stats;
create policy "Owners can read analytics daily stats"
on public.analytics_daily_stats
for select
to authenticated
using (private.can_view_analytics(owner_type, owner_id));

drop policy if exists "Users can read own survey answers"
  on public.market_survey_answers;
create policy "Users can read own survey answers"
on public.market_survey_answers
for select
to authenticated
using (user_id = auth.uid() or private.analytics_is_admin());

drop policy if exists "Users can insert own survey answers"
  on public.market_survey_answers;
create policy "Users can insert own survey answers"
on public.market_survey_answers
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own survey answers"
  on public.market_survey_answers;
create policy "Users can update own survey answers"
on public.market_survey_answers
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on public.analytics_events from anon, authenticated;
revoke all on public.analytics_daily_stats from anon, authenticated;
revoke all on public.market_survey_answers from anon, authenticated;

grant select on public.analytics_events to authenticated;
grant select on public.analytics_daily_stats to authenticated;
grant select, insert, update on public.market_survey_answers to authenticated;
grant all on public.analytics_events to service_role;
grant all on public.analytics_daily_stats to service_role;
grant all on public.market_survey_answers to service_role;

notify pgrst, 'reload schema';
