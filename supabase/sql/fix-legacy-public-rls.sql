-- SRCHR legacy public table RLS patch.
-- Apply with a database owner role. The script is idempotent and defensive:
-- it only creates policies against columns that exist in the current schema.

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

revoke all on function private.is_admin() from public;
revoke all on function private.is_org_member(uuid, text[]) from public;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_org_member(uuid, text[]) to authenticated;

do $$
declare
  policy_name text;
  target_table text;
  select_clauses text[];
  write_clauses text[];
  public_status_clause text;
begin
  foreach target_table in array array[
    'services',
    'cases',
    'files',
    'case_comments',
    'subscriptions',
    'schema_migrations'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is not null then
      execute format('alter table public.%I enable row level security', target_table);

      for policy_name in
        select p.policyname
        from pg_policies p
        where p.schemaname = 'public' and p.tablename = target_table
      loop
        execute format('drop policy if exists %I on public.%I', policy_name, target_table);
      end loop;
    end if;
  end loop;

  if to_regclass('public.services') is not null then
    revoke insert, update, delete on public.services from anon, authenticated;
    grant select on public.services to anon, authenticated;

    create policy "Services are public read only"
      on public.services for select
      using (true);
  end if;

  if to_regclass('public.schema_migrations') is not null then
    revoke all on public.schema_migrations from anon, authenticated;
  end if;

  if to_regclass('public.cases') is not null then
    revoke all on public.cases from anon;
    grant select on public.cases to anon;
    grant select, insert, update, delete on public.cases to authenticated;

    select_clauses := array['private.is_admin()'];
    write_clauses := array['private.is_admin()'];

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cases' and column_name = 'status'
    ) then
      public_status_clause := 'status = ''published''';
    else
      public_status_clause := 'false';
    end if;
    select_clauses := array_append(select_clauses, public_status_clause);

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cases' and column_name = 'created_by'
    ) then
      select_clauses := array_append(select_clauses, 'created_by = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'created_by = (select auth.uid())');
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cases' and column_name = 'user_id'
    ) then
      select_clauses := array_append(select_clauses, 'user_id = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'user_id = (select auth.uid())');
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cases' and column_name = 'organization_id'
    ) then
      select_clauses := array_append(select_clauses, 'private.is_org_member(organization_id)');
      write_clauses := array_append(
        write_clauses,
        'private.is_org_member(organization_id, array[''owner'', ''admin'', ''editor''])'
      );
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'cases' and column_name = 'company_id'
    ) then
      select_clauses := array_append(select_clauses, 'private.is_org_member(company_id)');
      write_clauses := array_append(
        write_clauses,
        'private.is_org_member(company_id, array[''owner'', ''admin'', ''editor''])'
      );
    end if;

    execute format(
      'create policy "Published and owned cases are readable" on public.cases for select using (%s)',
      array_to_string(select_clauses, ' or ')
    );

    execute format(
      'create policy "Case owners can insert cases" on public.cases for insert to authenticated with check (%s)',
      array_to_string(write_clauses, ' or ')
    );

    execute format(
      'create policy "Case owners can update cases" on public.cases for update to authenticated using (%s) with check (%s)',
      array_to_string(write_clauses, ' or '),
      array_to_string(write_clauses, ' or ')
    );

    execute format(
      'create policy "Case owners can delete cases" on public.cases for delete to authenticated using (%s)',
      array_to_string(write_clauses, ' or ')
    );
  end if;

  if to_regclass('public.files') is not null then
    revoke all on public.files from anon;
    grant select, insert, update, delete on public.files to authenticated;

    select_clauses := array['private.is_admin()'];
    write_clauses := array['private.is_admin()'];

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'files' and column_name = 'user_id'
    ) then
      select_clauses := array_append(select_clauses, 'user_id = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'user_id = (select auth.uid())');
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'files' and column_name = 'created_by'
    ) then
      select_clauses := array_append(select_clauses, 'created_by = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'created_by = (select auth.uid())');
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'files' and column_name = 'organization_id'
    ) then
      select_clauses := array_append(select_clauses, 'private.is_org_member(organization_id)');
      write_clauses := array_append(
        write_clauses,
        'private.is_org_member(organization_id, array[''owner'', ''admin'', ''editor''])'
      );
    end if;

    execute format(
      'create policy "File owners can read files" on public.files for select to authenticated using (%s)',
      array_to_string(select_clauses, ' or ')
    );
    execute format(
      'create policy "File owners can insert files" on public.files for insert to authenticated with check (%s)',
      array_to_string(write_clauses, ' or ')
    );
    execute format(
      'create policy "File owners can update files" on public.files for update to authenticated using (%s) with check (%s)',
      array_to_string(write_clauses, ' or '),
      array_to_string(write_clauses, ' or ')
    );
    execute format(
      'create policy "File owners can delete files" on public.files for delete to authenticated using (%s)',
      array_to_string(write_clauses, ' or ')
    );
  end if;

  if to_regclass('public.case_comments') is not null then
    revoke all on public.case_comments from anon;
    grant select, insert, update, delete on public.case_comments to authenticated;

    select_clauses := array['private.is_admin()'];
    write_clauses := array['private.is_admin()'];

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'case_comments' and column_name = 'user_id'
    ) then
      select_clauses := array_append(select_clauses, 'user_id = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'user_id = (select auth.uid())');
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'case_comments' and column_name = 'created_by'
    ) then
      select_clauses := array_append(select_clauses, 'created_by = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'created_by = (select auth.uid())');
    end if;

    execute format(
      'create policy "Comment owners can read comments" on public.case_comments for select to authenticated using (%s)',
      array_to_string(select_clauses, ' or ')
    );
    execute format(
      'create policy "Comment owners can insert comments" on public.case_comments for insert to authenticated with check (%s)',
      array_to_string(write_clauses, ' or ')
    );
    execute format(
      'create policy "Comment owners can update comments" on public.case_comments for update to authenticated using (%s) with check (%s)',
      array_to_string(write_clauses, ' or '),
      array_to_string(write_clauses, ' or ')
    );
    execute format(
      'create policy "Comment owners can delete comments" on public.case_comments for delete to authenticated using (%s)',
      array_to_string(write_clauses, ' or ')
    );
  end if;

  if to_regclass('public.subscriptions') is not null then
    revoke all on public.subscriptions from anon;
    grant select, insert, update on public.subscriptions to authenticated;

    select_clauses := array['private.is_admin()'];
    write_clauses := array['private.is_admin()'];

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'user_id'
    ) then
      select_clauses := array_append(select_clauses, 'user_id = (select auth.uid())');
      write_clauses := array_append(write_clauses, 'user_id = (select auth.uid())');
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'organization_id'
    ) then
      select_clauses := array_append(select_clauses, 'private.is_org_member(organization_id)');
      write_clauses := array_append(
        write_clauses,
        'private.is_org_member(organization_id, array[''owner'', ''admin''])'
      );
    end if;

    execute format(
      'create policy "Subscription owners can read subscriptions" on public.subscriptions for select to authenticated using (%s)',
      array_to_string(select_clauses, ' or ')
    );
    execute format(
      'create policy "Subscription owners can insert subscriptions" on public.subscriptions for insert to authenticated with check (%s)',
      array_to_string(write_clauses, ' or ')
    );
    execute format(
      'create policy "Subscription owners can update subscriptions" on public.subscriptions for update to authenticated using (%s) with check (%s)',
      array_to_string(write_clauses, ' or '),
      array_to_string(write_clauses, ' or ')
    );
  end if;
end $$;

notify pgrst, 'reload schema';
