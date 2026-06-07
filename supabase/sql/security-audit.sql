-- Read-only checks to run after security-hardening.sql.

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles',
    'organizations',
    'organization_members',
    'contractor_profiles',
    'organization_services',
    'materials',
    'material_expert_authors',
    'expert_profiles',
    'events',
    'event_participants',
    'tenders',
    'tender_responses',
    'favorites',
    'notification_events',
    'notifications',
    'notification_preferences'
  )
order by c.relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'private'
order by routine_name;
