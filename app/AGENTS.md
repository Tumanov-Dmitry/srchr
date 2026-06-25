# App Router Instructions

## Scope

Applies to `app/**`.

## Routing

- Use App Router conventions only.
- Keep public routes in `app/(public)` when possible.
- Keep authenticated user surfaces under `app/dashboard`.
- Keep admin-only surfaces under `app/admin`.
- Route handlers belong in `app/api`.

## Data and Auth

- Server components must check auth/ownership before rendering private data.
- Do not rely only on navigation visibility for access control.
- Use existing query helpers from `lib/supabase`.
- Use existing actions from `app/actions` or add narrowly scoped actions there.

## Public Access Rules

- Public catalogs should remain visible to guests where product rules allow it.
- Contacts and private actions require authentication.
- Tender and price request detail/action flows are restricted for guests.

## Validation

- Validate important mutations on the server even if the client already validates them.
- Preserve moderation status flows unless the task explicitly changes them.
