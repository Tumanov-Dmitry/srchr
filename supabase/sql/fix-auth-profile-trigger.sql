-- Keep Auth user creation compatible with the current profiles schema.
-- Apply with the database owner.

alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (
    account_type in ('guest', 'contractor', 'client', 'admin')
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    account_type,
    created_at,
    updated_at
  )
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'guest',
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update
  set full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  return new;
end;
$$;

do $$
declare
  trigger_name text;
begin
  for trigger_name in
    select trigger_row.tgname
    from pg_trigger trigger_row
    join pg_class table_row on table_row.oid = trigger_row.tgrelid
    join pg_namespace table_schema on table_schema.oid = table_row.relnamespace
    where table_schema.nspname = 'auth'
      and table_row.relname = 'users'
      and not trigger_row.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', trigger_name);
  end loop;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

notify pgrst, 'reload schema';
