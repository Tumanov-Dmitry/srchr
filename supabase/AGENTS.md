# Supabase Instructions

## Scope

Applies to `supabase/**`.

## SQL Patches

- Put manual SQL patches in `supabase/sql`.
- Do not rely on global deploy-time `db:migrate`.
- Prefer isolated GitHub Actions SQL workflows for self-hosted dev patches when needed.
- SQL should be idempotent where practical: `if not exists`, `drop policy if exists`, safe grants.

## Security

- Enable RLS on new public tables.
- Add policies matching the real access model.
- Use `to authenticated` and ownership checks for user-owned data.
- Public read policies must only expose data intended for guests.
- Do not create broad `authenticated` write access without ownership checks.

## Data API

- If a table is used through Supabase client/PostgREST, add explicit grants where needed.
- RLS controls rows; grants control API reachability.

## Existing Schema

- Prefer existing tables before creating new ones.
- Do not migrate existing production data unless the task explicitly requires it.
- Keep compatibility with current modules.
