-- SRCHR Supabase Advisor warning fixes.
-- Apply with a database owner role. This keeps REST/PostgREST grants intact.

-- SRCHR does not use the Supabase GraphQL endpoint. Keeping pg_graphql enabled
-- exposes every table with anon/authenticated SELECT grants in the GraphQL
-- schema, which creates a large Advisor warning surface.
drop extension if exists pg_graphql cascade;

create or replace function public.sync_favorites_target_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.target_type := coalesce(new.target_type, new.entity_type);
  new.target_id := coalesce(new.target_id, new.entity_id);
  new.entity_type := coalesce(new.entity_type, new.target_type);
  new.entity_id := coalesce(new.entity_id, new.target_id);
  new.is_pinned := coalesce(new.is_pinned, false);
  new.snapshot := coalesce(new.snapshot, '{}'::jsonb);
  new.status := coalesce(new.status, 'active');
  new.created_at := coalesce(new.created_at, now());
  new.updated_at := now();

  return new;
end;
$$;

notify pgrst, 'reload schema';
