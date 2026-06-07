create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  event_type text,
  source text,
  actor_id uuid references auth.users(id) on delete set null,
  target_type text,
  target_id uuid,
  title text,
  text text,
  severity text not null default 'info',
  status text not null default 'new',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint notification_events_severity_check check (
    severity in ('info', 'warning', 'error', 'critical')
  ),
  constraint notification_events_status_check check (
    status in ('new', 'processing', 'handled', 'ignored')
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  text text,
  type text not null default 'system',
  target_type text,
  target_id uuid,
  target_url text,
  channels text[] not null default array['in_app']::text[],
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_channels_check check (
    channels <@ array['in_app', 'email', 'telegram']::text[]
  )
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  event_key text not null,
  in_app boolean not null default true,
  email boolean not null default false,
  telegram boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_user_event_unique unique (user_id, event_key)
);

create index if not exists notification_events_created_at_idx
  on public.notification_events (created_at desc);
create index if not exists notification_events_severity_status_idx
  on public.notification_events (severity, status, created_at desc);
create index if not exists notification_events_target_idx
  on public.notification_events (target_type, target_id);
create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, is_read, created_at desc);
create index if not exists notifications_target_idx
  on public.notifications (target_type, target_id);
create index if not exists notification_preferences_user_id_idx
  on public.notification_preferences (user_id);

revoke insert, update, delete on public.notification_events from authenticated;
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant select on public.notification_events to authenticated;
grant select on public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

alter table public.notification_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Authenticated users can create notification events" on public.notification_events;

drop policy if exists "Admins can read notification events" on public.notification_events;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    execute $policy$
      create policy "Admins can read notification events"
        on public.notification_events for select
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and (
                p.role in ('admin', 'super_admin', 'moderator')
                or p.account_type in ('admin', 'super_admin', 'moderator')
              )
          )
        )
    $policy$;
  else
    execute $policy$
      create policy "Admins can read notification events"
        on public.notification_events for select
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.account_type in ('admin', 'super_admin', 'moderator')
          )
        )
    $policy$;
  end if;
end $$;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "Users can insert own notifications" on public.notifications;

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own notification preferences" on public.notification_preferences;
create policy "Users can delete own notification preferences"
  on public.notification_preferences for delete
  to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
