-- SRCHR reputation v1.
-- Apply manually with the database owner:
-- docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
--   < supabase/sql/create-reputation.sql

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.reputation_rules (
  event_type text primary key,
  default_points integer not null,
  enabled boolean not null default true,
  category text not null default 'activity',
  target_types text[] not null default array['contractor', 'expert']::text[],
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint reputation_rules_target_types_check check (
    target_types <@ array['contractor', 'expert']::text[]
    and cardinality(target_types) > 0
  ),
  constraint reputation_rules_category_check check (
    category in (
      'profile',
      'cases',
      'articles',
      'reviews',
      'recommendations',
      'tenders',
      'events',
      'activity'
    )
  )
);

alter table public.reputation_rules
  add column if not exists category text not null default 'activity';

create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  target_type text not null,
  target_id uuid not null,
  event_type text not null references public.reputation_rules(event_type),
  points integer not null,
  source_type text,
  source_id uuid,
  comment text,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  constraint reputation_events_target_type_check check (
    target_type in ('contractor', 'expert')
  )
);

create table if not exists public.reputation_summary (
  target_type text not null,
  target_id uuid not null,
  total_points bigint not null default 0,
  events_count bigint not null default 0,
  reviews_count integer not null default 0,
  recommendations_count integer not null default 0,
  last_event_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (target_type, target_id),
  constraint reputation_summary_target_type_check check (
    target_type in ('contractor', 'expert')
  )
);

create table if not exists public.reputation_breakdown (
  target_type text not null,
  target_id uuid not null,
  category text not null,
  total_points bigint not null default 0,
  events_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (target_type, target_id, category),
  constraint reputation_breakdown_target_type_check check (
    target_type in ('contractor', 'expert')
  ),
  constraint reputation_breakdown_category_check check (
    category in (
      'profile',
      'cases',
      'articles',
      'reviews',
      'recommendations',
      'tenders',
      'events',
      'activity'
    )
  )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  source_type text,
  source_id uuid,
  comment text,
  status text not null default 'moderation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint reviews_target_type_check check (
    target_type in ('contractor', 'expert')
  ),
  constraint reviews_status_check check (
    status in ('moderation', 'published', 'hidden', 'rejected')
  )
);

create table if not exists public.review_answers (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  question_key text not null,
  score smallint,
  answer_text text,
  created_at timestamptz not null default now(),
  constraint review_answers_score_check check (
    score is null or score between 1 and 5
  ),
  constraint review_answers_unique_question unique (review_id, question_key)
);

create unique index if not exists reputation_events_unique_source_idx
  on public.reputation_events (
    target_type,
    target_id,
    event_type,
    source_type,
    source_id
  )
  where source_id is not null;

create index if not exists reputation_events_target_created_idx
  on public.reputation_events (target_type, target_id, created_at desc);

create index if not exists reputation_events_type_idx
  on public.reputation_events (event_type, created_at desc);

create index if not exists reputation_summary_points_idx
  on public.reputation_summary (target_type, total_points desc);

create index if not exists reputation_breakdown_target_idx
  on public.reputation_breakdown (target_type, target_id);

create index if not exists reviews_target_status_idx
  on public.reviews (target_type, target_id, status, created_at desc);

create index if not exists reviews_reviewer_idx
  on public.reviews (reviewer_id, created_at desc);

create unique index if not exists reviews_unique_source_idx
  on public.reviews (reviewer_id, target_type, target_id, source_type, source_id)
  where source_id is not null;

insert into public.reputation_rules (
  event_type,
  default_points,
  category,
  target_types,
  description
)
values
  ('profile_completed', 100, 'profile', array['contractor', 'expert'], 'Required profile sections completed'),
  ('profile_published', 50, 'profile', array['contractor', 'expert'], 'Public profile published'),
  ('case_published', 150, 'cases', array['contractor', 'expert'], 'Case passed moderation and was published'),
  ('article_published', 100, 'articles', array['contractor', 'expert'], 'Article passed moderation and was published'),
  ('case_moderation_passed', 0, 'cases', array['contractor', 'expert'], 'Reserved moderation signal for cases'),
  ('article_moderation_passed', 0, 'articles', array['contractor', 'expert'], 'Reserved moderation signal for articles'),
  ('review_received', 100, 'reviews', array['contractor', 'expert'], 'Published review received'),
  ('review_with_comment', 25, 'reviews', array['contractor', 'expert'], 'Published review contains a text comment'),
  ('recommendation_received', 75, 'recommendations', array['contractor', 'expert'], 'Recommendation received'),
  ('recommendation_from_expert', 75, 'recommendations', array['contractor', 'expert'], 'Recommendation from an expert'),
  ('recommendation_from_contractor', 75, 'recommendations', array['contractor', 'expert'], 'Recommendation from a contractor'),
  ('recommendation_from_company', 75, 'recommendations', array['contractor', 'expert'], 'Recommendation from a client company'),
  ('tender_response_created', 5, 'tenders', array['contractor', 'expert'], 'Response submitted to a tender'),
  ('tender_won', 300, 'tenders', array['contractor', 'expert'], 'Tender response accepted'),
  ('tender_completed', 500, 'tenders', array['contractor', 'expert'], 'Tender successfully completed'),
  ('event_created', 80, 'events', array['contractor', 'expert'], 'Event published'),
  ('event_participated', 20, 'events', array['expert'], 'Expert marked as attending an event'),
  ('event_speaker', 120, 'events', array['expert'], 'Expert participated as a speaker'),
  ('material_liked', 2, 'activity', array['contractor', 'expert'], 'Published material received a reaction'),
  ('platform_activity', 1, 'activity', array['contractor', 'expert'], 'Reserved platform activity signal')
on conflict (event_type) do nothing;

update public.reputation_rules
set category = case
  when event_type like 'profile_%' then 'profile'
  when event_type like 'case_%' then 'cases'
  when event_type like 'article_%' then 'articles'
  when event_type like 'review_%' then 'reviews'
  when event_type like 'recommendation_%' then 'recommendations'
  when event_type like 'tender_%' then 'tenders'
  when event_type like 'event_%' then 'events'
  else 'activity'
end;

create or replace function private.can_manage_reputation_target(
  target_kind text,
  target_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_kind = 'expert' then exists (
      select 1
      from public.expert_profiles ep
      where ep.id = target_uuid
        and ep.user_id = auth.uid()
    )
    when target_kind = 'contractor' then exists (
      select 1
      from public.organization_members om
      where coalesce(
        to_jsonb(om) ->> 'organization_id',
        to_jsonb(om) ->> 'org_id'
      )::uuid = target_uuid
        and coalesce(
          to_jsonb(om) ->> 'user_id',
          to_jsonb(om) ->> 'profile_id'
        )::uuid = auth.uid()
    )
    else false
  end;
$$;

create or replace function private.reputation_target_exists(
  target_kind text,
  target_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_kind = 'contractor' then exists (
      select 1
      from public.organizations o
      where o.id = target_uuid
        and coalesce(o.is_contractor, false) = true
    )
    when target_kind = 'expert' then exists (
      select 1
      from public.expert_profiles ep
      where ep.id = target_uuid
    )
    else false
  end;
$$;

create or replace function private.refresh_reputation_summary(
  target_kind text,
  target_uuid uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  points_total bigint;
  event_total bigint;
  latest_event timestamptz;
  review_total integer;
  existing_recommendations integer;
begin
  select
    coalesce(sum(re.points), 0),
    count(*),
    max(re.created_at)
  into points_total, event_total, latest_event
  from public.reputation_events re
  where re.target_type = target_kind
    and re.target_id = target_uuid;

  select count(*)::integer
  into review_total
  from public.reviews r
  where r.target_type = target_kind
    and r.target_id = target_uuid
    and r.status = 'published';

  select coalesce(rs.recommendations_count, 0)
  into existing_recommendations
  from public.reputation_summary rs
  where rs.target_type = target_kind
    and rs.target_id = target_uuid;

  insert into public.reputation_summary (
    target_type,
    target_id,
    total_points,
    events_count,
    reviews_count,
    recommendations_count,
    last_event_at,
    updated_at
  )
  values (
    target_kind,
    target_uuid,
    points_total,
    event_total,
    review_total,
    coalesce(existing_recommendations, 0),
    latest_event,
    now()
  )
  on conflict (target_type, target_id) do update
  set total_points = excluded.total_points,
      events_count = excluded.events_count,
      reviews_count = excluded.reviews_count,
      recommendations_count = excluded.recommendations_count,
      last_event_at = excluded.last_event_at,
      updated_at = excluded.updated_at;
end;
$$;

create or replace function private.refresh_reputation_breakdown(
  target_kind text,
  target_uuid uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.reputation_breakdown rb
  where rb.target_type = target_kind
    and rb.target_id = target_uuid;

  insert into public.reputation_breakdown (
    target_type,
    target_id,
    category,
    total_points,
    events_count,
    updated_at
  )
  select
    target_kind,
    target_uuid,
    rr.category,
    coalesce(sum(re.points), 0),
    count(*),
    now()
  from public.reputation_events re
  join public.reputation_rules rr on rr.event_type = re.event_type
  where re.target_type = target_kind
    and re.target_id = target_uuid
  group by rr.category;
end;
$$;

create or replace function private.record_reputation_event(
  target_kind text,
  target_uuid uuid,
  reputation_event_type text,
  event_source_type text default null,
  event_source_id uuid default null,
  event_comment text default null,
  actor_id uuid default null,
  event_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule_row public.reputation_rules%rowtype;
  event_uuid uuid;
begin
  if target_kind not in ('contractor', 'expert') or target_uuid is null then
    return null;
  end if;

  select *
  into rule_row
  from public.reputation_rules rr
  where rr.event_type = reputation_event_type
    and rr.enabled = true
    and target_kind = any(rr.target_types);

  if not found then
    return null;
  end if;

  if not private.reputation_target_exists(target_kind, target_uuid) then
    return null;
  end if;

  if event_source_id is not null then
    select re.id
    into event_uuid
    from public.reputation_events re
    where re.target_type = target_kind
      and re.target_id = target_uuid
      and re.event_type = reputation_event_type
      and re.source_type is not distinct from event_source_type
      and re.source_id = event_source_id
    limit 1;

    if event_uuid is not null then
      return event_uuid;
    end if;
  end if;

  begin
    insert into public.reputation_events (
      target_type,
      target_id,
      event_type,
      points,
      source_type,
      source_id,
      comment,
      created_by,
      metadata
    )
    values (
      target_kind,
      target_uuid,
      reputation_event_type,
      rule_row.default_points,
      event_source_type,
      event_source_id,
      event_comment,
      actor_id,
      coalesce(event_metadata, '{}'::jsonb)
    )
    returning id into event_uuid;
  exception
    when unique_violation then
      select re.id
      into event_uuid
      from public.reputation_events re
      where re.target_type = target_kind
        and re.target_id = target_uuid
        and re.event_type = reputation_event_type
        and re.source_type is not distinct from event_source_type
        and re.source_id = event_source_id
      limit 1;
  end;

  return event_uuid;
end;
$$;

create or replace function private.rebuild_reputation_summary()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_row record;
begin
  for target_row in
    select distinct target_type, target_id
    from public.reputation_events
    union
    select distinct target_type, target_id
    from public.reviews
  loop
    perform private.refresh_reputation_summary(
      target_row.target_type,
      target_row.target_id
    );
    perform private.refresh_reputation_breakdown(
      target_row.target_type,
      target_row.target_id
    );
  end loop;
end;
$$;

create or replace function private.reprice_reputation_events()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reputation_events re
  set points = rr.default_points
  from public.reputation_rules rr
  where rr.event_type = re.event_type
    and rr.enabled = true
    and re.target_type = any(rr.target_types)
    and re.points is distinct from rr.default_points;

  perform private.rebuild_reputation_summary();
end;
$$;

create or replace function private.on_reputation_event_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_reputation_summary(old.target_type, old.target_id);
    perform private.refresh_reputation_breakdown(old.target_type, old.target_id);
    return old;
  end if;

  perform private.refresh_reputation_summary(new.target_type, new.target_id);
  perform private.refresh_reputation_breakdown(new.target_type, new.target_id);

  if tg_op = 'UPDATE' then
    if (old.target_type, old.target_id) is distinct from
       (new.target_type, new.target_id) then
      perform private.refresh_reputation_summary(old.target_type, old.target_id);
      perform private.refresh_reputation_breakdown(old.target_type, old.target_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists reputation_events_refresh_summary on public.reputation_events;
create trigger reputation_events_refresh_summary
after insert or update or delete on public.reputation_events
for each row execute function private.on_reputation_event_changed();

create or replace function private.on_review_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  became_published boolean;
begin
  if tg_op = 'DELETE' then
    perform private.refresh_reputation_summary(old.target_type, old.target_id);
    perform private.refresh_reputation_breakdown(old.target_type, old.target_id);
    return old;
  end if;

  if tg_op = 'INSERT' then
    became_published := new.status = 'published';
  else
    became_published :=
      new.status = 'published'
      and old.status is distinct from 'published';
  end if;

  if became_published then
    perform private.record_reputation_event(
      new.target_type,
      new.target_id,
      'review_received',
      'review',
      new.id,
      new.comment,
      new.reviewer_id
    );

    if nullif(btrim(coalesce(new.comment, '')), '') is not null then
      perform private.record_reputation_event(
        new.target_type,
        new.target_id,
        'review_with_comment',
        'review',
        new.id,
        new.comment,
        new.reviewer_id
      );
    end if;
  end if;

  perform private.refresh_reputation_summary(new.target_type, new.target_id);
  perform private.refresh_reputation_breakdown(new.target_type, new.target_id);

  if tg_op = 'UPDATE' then
    if (old.target_type, old.target_id) is distinct from
       (new.target_type, new.target_id) then
      perform private.refresh_reputation_summary(old.target_type, old.target_id);
      perform private.refresh_reputation_breakdown(old.target_type, old.target_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_update_reputation on public.reviews;
create trigger reviews_update_reputation
after insert or update or delete on public.reviews
for each row execute function private.on_review_changed();

create or replace function private.on_organization_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  became_published boolean;
begin
  if tg_op = 'INSERT' then
    became_published := new.status = 'published';
  else
    became_published :=
      new.status = 'published'
      and old.status is distinct from 'published';
  end if;

  if coalesce(new.is_contractor, false) and became_published then
    perform private.record_reputation_event(
      'contractor',
      new.id,
      'profile_published',
      'organization',
      new.id,
      null,
      null
    );
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_record_reputation on public.organizations;
create trigger organizations_record_reputation
after insert or update on public.organizations
for each row execute function private.on_organization_reputation();

create or replace function private.on_contractor_profile_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_uuid uuid;
  profile_complete boolean;
begin
  organization_uuid := coalesce(
    nullif(to_jsonb(new) ->> 'organization_id', '')::uuid,
    nullif(to_jsonb(new) ->> 'org_id', '')::uuid
  );

  profile_complete :=
    nullif(btrim(coalesce(to_jsonb(new) ->> 'short_description', '')), '') is not null
    and nullif(btrim(coalesce(to_jsonb(new) ->> 'full_description', '')), '') is not null
    and nullif(btrim(coalesce(to_jsonb(new) ->> 'contact_email', '')), '') is not null
    and nullif(to_jsonb(new) ->> 'min_budget', '') is not null;

  if organization_uuid is not null and profile_complete then
    perform private.record_reputation_event(
      'contractor',
      organization_uuid,
      'profile_completed',
      'organization',
      organization_uuid,
      null,
      null
    );
  end if;

  return new;
end;
$$;

drop trigger if exists contractor_profiles_record_reputation on public.contractor_profiles;
create trigger contractor_profiles_record_reputation
after insert or update on public.contractor_profiles
for each row execute function private.on_contractor_profile_reputation();

create or replace function private.on_expert_profile_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_complete boolean;
  became_published boolean;
begin
  profile_complete :=
    nullif(btrim(coalesce(new.first_name, '')), '') is not null
    and nullif(btrim(coalesce(new.position, '')), '') is not null
    and nullif(btrim(coalesce(new.short_description, '')), '') is not null
    and nullif(btrim(coalesce(new.city, '')), '') is not null
    and nullif(btrim(coalesce(new.specializations, '')), '') is not null
    and nullif(btrim(coalesce(new.skills, '')), '') is not null;

  if profile_complete then
    perform private.record_reputation_event(
      'expert',
      new.id,
      'profile_completed',
      'expert_profile',
      new.id,
      null,
      new.user_id
    );
  end if;

  if tg_op = 'INSERT' then
    became_published := new.is_public and new.status = 'published';
  else
    became_published :=
      new.is_public
      and new.status = 'published'
      and (
        old.status is distinct from 'published'
        or old.is_public is distinct from true
      );
  end if;

  if became_published then
    perform private.record_reputation_event(
      'expert',
      new.id,
      'profile_published',
      'expert_profile',
      new.id,
      null,
      new.user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists expert_profiles_record_reputation on public.expert_profiles;
create trigger expert_profiles_record_reputation
after insert or update on public.expert_profiles
for each row execute function private.on_expert_profile_reputation();

create or replace function private.on_material_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind text;
  target_uuid uuid;
  reputation_event_type text;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is not distinct from 'published' then
    return new;
  end if;

  if coalesce(new.owner_type, 'company') = 'expert'
    and new.expert_id is not null then
    target_kind := 'expert';
    target_uuid := new.expert_id;
  else
    target_kind := 'contractor';
    target_uuid := coalesce(new.organization_id, new.company_id);
  end if;

  reputation_event_type := case
    when new.type = 'case' then 'case_published'
    else 'article_published'
  end;

  perform private.record_reputation_event(
    target_kind,
    target_uuid,
    reputation_event_type,
    'material',
    new.id,
    new.title,
    new.created_by
  );

  return new;
end;
$$;

drop trigger if exists materials_record_reputation on public.materials;
create trigger materials_record_reputation
after insert or update on public.materials
for each row execute function private.on_material_reputation();

create or replace function private.on_tender_response_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind text;
  target_uuid uuid;
  tender_was_won boolean;
begin
  if coalesce(new.responder_type, 'contractor') = 'expert'
    and new.expert_id is not null then
    target_kind := 'expert';
    target_uuid := new.expert_id;
  else
    target_kind := 'contractor';
    target_uuid := new.organization_id;
  end if;

  if tg_op = 'INSERT' then
    perform private.record_reputation_event(
      target_kind,
      target_uuid,
      'tender_response_created',
      'tender_response',
      new.id,
      null,
      new.user_id
    );
  end if;

  if tg_op = 'INSERT' then
    tender_was_won := new.status = 'accepted';
  else
    tender_was_won :=
      new.status = 'accepted'
      and old.status is distinct from 'accepted';
  end if;

  if tender_was_won then
    perform private.record_reputation_event(
      target_kind,
      target_uuid,
      'tender_won',
      'tender_response',
      new.id,
      null,
      new.user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists tender_responses_record_reputation on public.tender_responses;
create trigger tender_responses_record_reputation
after insert or update on public.tender_responses
for each row execute function private.on_tender_response_reputation();

create or replace function private.on_event_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind text;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is not distinct from 'published' then
    return new;
  end if;

  target_kind := case
    when new.owner_type = 'expert' then 'expert'
    else 'contractor'
  end;

  perform private.record_reputation_event(
    target_kind,
    new.owner_id,
    'event_created',
    'event',
    new.id,
    new.title,
    new.created_by
  );

  return new;
end;
$$;

drop trigger if exists events_record_reputation on public.events;
create trigger events_record_reputation
after insert or update on public.events
for each row execute function private.on_event_reputation();

create or replace function private.on_event_participant_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expert_uuid uuid;
begin
  if new.status <> 'going' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is not distinct from 'going' then
    return new;
  end if;

  select ep.id
  into expert_uuid
  from public.expert_profiles ep
  where ep.user_id = new.user_id
  limit 1;

  if expert_uuid is not null then
    perform private.record_reputation_event(
      'expert',
      expert_uuid,
      'event_participated',
      'event',
      new.event_id,
      null,
      new.user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists event_participants_record_reputation on public.event_participants;
create trigger event_participants_record_reputation
after insert or update on public.event_participants
for each row execute function private.on_event_participant_reputation();

alter table public.reputation_rules enable row level security;
alter table public.reputation_events enable row level security;
alter table public.reputation_summary enable row level security;
alter table public.reputation_breakdown enable row level security;
alter table public.reviews enable row level security;
alter table public.review_answers enable row level security;

drop policy if exists "Reputation rules are readable" on public.reputation_rules;
create policy "Reputation rules are readable"
  on public.reputation_rules for select
  using (true);

drop policy if exists "Reputation summaries are public" on public.reputation_summary;
create policy "Reputation summaries are public"
  on public.reputation_summary for select
  using (true);

drop policy if exists "Reputation breakdowns are public" on public.reputation_breakdown;
create policy "Reputation breakdowns are public"
  on public.reputation_breakdown for select
  using (true);

drop policy if exists "Target owners can read reputation events" on public.reputation_events;
create policy "Target owners can read reputation events"
  on public.reputation_events for select
  to authenticated
  using (private.can_manage_reputation_target(target_type, target_id));

drop policy if exists "Published reviews are public" on public.reviews;
create policy "Published reviews are public"
  on public.reviews for select
  using (status = 'published');

drop policy if exists "Reviewers can read own reviews" on public.reviews;
create policy "Reviewers can read own reviews"
  on public.reviews for select
  to authenticated
  using (
    reviewer_id = auth.uid()
    or private.can_manage_reputation_target(target_type, target_id)
  );

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and status = 'moderation'
    and private.reputation_target_exists(target_type, target_id)
    and not private.can_manage_reputation_target(target_type, target_id)
  );

drop policy if exists "Reviewers can update pending reviews" on public.reviews;
create policy "Reviewers can update pending reviews"
  on public.reviews for update
  to authenticated
  using (reviewer_id = auth.uid() and status = 'moderation')
  with check (reviewer_id = auth.uid() and status = 'moderation');

drop policy if exists "Review participants can read answers" on public.review_answers;
create policy "Review participants can read answers"
  on public.review_answers for select
  to authenticated
  using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and (
          r.reviewer_id = auth.uid()
          or private.can_manage_reputation_target(r.target_type, r.target_id)
        )
    )
  );

drop policy if exists "Reviewers can manage pending answers" on public.review_answers;
create policy "Reviewers can manage pending answers"
  on public.review_answers for all
  to authenticated
  using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and r.reviewer_id = auth.uid()
        and r.status = 'moderation'
    )
  )
  with check (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and r.reviewer_id = auth.uid()
        and r.status = 'moderation'
    )
  );

grant select on public.reputation_rules to anon, authenticated;
grant select on public.reputation_summary to anon, authenticated;
grant select on public.reputation_breakdown to anon, authenticated;
grant select on public.reputation_events to authenticated;
grant select on public.reviews to authenticated;
grant insert, update on public.reviews to authenticated;
grant select, insert, update, delete on public.review_answers to authenticated;

revoke insert, update, delete on public.reputation_rules from anon, authenticated;
revoke insert, update, delete on public.reputation_events from anon, authenticated;
revoke insert, update, delete on public.reputation_summary from anon, authenticated;
revoke insert, update, delete on public.reputation_breakdown from anon, authenticated;
revoke all on function private.record_reputation_event(
  text, uuid, text, text, uuid, text, uuid, jsonb
) from public, anon, authenticated;
revoke all on function private.rebuild_reputation_summary() from public, anon, authenticated;
revoke all on function private.reprice_reputation_events() from public, anon, authenticated;
revoke all on function private.can_manage_reputation_target(text, uuid)
  from public, anon, authenticated;
revoke all on function private.reputation_target_exists(text, uuid)
  from public, anon, authenticated;
grant execute on function private.can_manage_reputation_target(text, uuid)
  to authenticated;
grant execute on function private.reputation_target_exists(text, uuid)
  to authenticated;

-- Idempotent initial population for existing published data.
do $$
declare
  row_data record;
  organization_uuid uuid;
  target_kind text;
  target_uuid uuid;
begin
  for row_data in
    select o.id
    from public.organizations o
    where coalesce(o.is_contractor, false) = true
      and o.status = 'published'
  loop
    perform private.record_reputation_event(
      'contractor', row_data.id, 'profile_published',
      'organization', row_data.id
    );
  end loop;

  for row_data in select cp.* from public.contractor_profiles cp
  loop
    organization_uuid := coalesce(
      nullif(to_jsonb(row_data) ->> 'organization_id', '')::uuid,
      nullif(to_jsonb(row_data) ->> 'org_id', '')::uuid
    );

    if organization_uuid is not null
      and nullif(btrim(coalesce(to_jsonb(row_data) ->> 'short_description', '')), '') is not null
      and nullif(btrim(coalesce(to_jsonb(row_data) ->> 'full_description', '')), '') is not null
      and nullif(btrim(coalesce(to_jsonb(row_data) ->> 'contact_email', '')), '') is not null
      and nullif(to_jsonb(row_data) ->> 'min_budget', '') is not null then
      perform private.record_reputation_event(
        'contractor', organization_uuid, 'profile_completed',
        'organization', organization_uuid
      );
    end if;
  end loop;

  for row_data in select ep.* from public.expert_profiles ep
  loop
    if nullif(btrim(coalesce(row_data.first_name, '')), '') is not null
      and nullif(btrim(coalesce(row_data.position, '')), '') is not null
      and nullif(btrim(coalesce(row_data.short_description, '')), '') is not null
      and nullif(btrim(coalesce(row_data.city, '')), '') is not null
      and nullif(btrim(coalesce(row_data.specializations, '')), '') is not null
      and nullif(btrim(coalesce(row_data.skills, '')), '') is not null then
      perform private.record_reputation_event(
        'expert', row_data.id, 'profile_completed',
        'expert_profile', row_data.id, null, row_data.user_id
      );
    end if;

    if row_data.is_public and row_data.status = 'published' then
      perform private.record_reputation_event(
        'expert', row_data.id, 'profile_published',
        'expert_profile', row_data.id, null, row_data.user_id
      );
    end if;
  end loop;

  for row_data in
    select m.*
    from public.materials m
    where m.status = 'published'
  loop
    if coalesce(row_data.owner_type, 'company') = 'expert'
      and row_data.expert_id is not null then
      target_kind := 'expert';
      target_uuid := row_data.expert_id;
    else
      target_kind := 'contractor';
      target_uuid := coalesce(row_data.organization_id, row_data.company_id);
    end if;

    perform private.record_reputation_event(
      target_kind,
      target_uuid,
      case when row_data.type = 'case' then 'case_published' else 'article_published' end,
      'material',
      row_data.id,
      row_data.title,
      row_data.created_by
    );
  end loop;

  for row_data in
    select tr.*
    from public.tender_responses tr
  loop
    if coalesce(row_data.responder_type, 'contractor') = 'expert'
      and row_data.expert_id is not null then
      target_kind := 'expert';
      target_uuid := row_data.expert_id;
    else
      target_kind := 'contractor';
      target_uuid := row_data.organization_id;
    end if;

    perform private.record_reputation_event(
      target_kind, target_uuid, 'tender_response_created',
      'tender_response', row_data.id, null, row_data.user_id
    );

    if row_data.status = 'accepted' then
      perform private.record_reputation_event(
        target_kind, target_uuid, 'tender_won',
        'tender_response', row_data.id, null, row_data.user_id
      );
    end if;
  end loop;

  for row_data in
    select e.*
    from public.events e
    where e.status = 'published'
  loop
    target_kind := case when row_data.owner_type = 'expert' then 'expert' else 'contractor' end;
    perform private.record_reputation_event(
      target_kind, row_data.owner_id, 'event_created',
      'event', row_data.id, row_data.title, row_data.created_by
    );
  end loop;

  for row_data in
    select ep.event_id, ep.user_id, expert.id as expert_id
    from public.event_participants ep
    join public.expert_profiles expert on expert.user_id = ep.user_id
    where ep.status = 'going'
  loop
    perform private.record_reputation_event(
      'expert', row_data.expert_id, 'event_participated',
      'event', row_data.event_id, null, row_data.user_id
    );
  end loop;

  perform private.rebuild_reputation_summary();
end;
$$;

notify pgrst, 'reload schema';
