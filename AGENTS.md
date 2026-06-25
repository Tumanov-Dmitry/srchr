# SRCHR Agent Instructions

## Project

SRCHR is a Next.js, TypeScript, Supabase, shadcn/ui product for finding HR, employer-branding, communications, research, education, and related professional contractors and experts.

The product has public catalogs, user dashboards, admin moderation, media/materials, tenders, price requests, events, favorites, notifications, analytics, reputation, and product documentation.

## Required Reading

Before changing a module, inspect existing code first with `rg`, then read the relevant docs:

- `docs/architecture.md`
- `docs/product/vision.md`
- `docs/product/roles.md`
- `docs/modules/<module>.md`
- relevant files in `app/actions`, `lib/supabase`, `components`, and `types`

If code and docs disagree, treat code as the current source of truth and update docs or mention the mismatch.

## Commands

Use npm.

Before commit or deploy:

- `npm run lint`
- `npm run build`
- relevant `npm run test:*`

For materials changes, run `npm run test:materials`.
For security-sensitive changes, run `npm run test:security`.

## Architecture Rules

- Use Next.js App Router.
- Server reads should live in `lib/supabase/*` or existing query helpers.
- Mutations should live in `app/actions/*` or route handlers.
- Reuse existing module patterns before adding abstractions.
- Keep changes scoped to the requested module.
- Do not duplicate business logic that already exists in actions, query helpers, or shared libraries.
- Do not silently change auth, roles, subscriptions, publication statuses, moderation, or ownership rules.

## Supabase Rules

- Do not hardcode secrets.
- Never expose service role keys to client code.
- New database changes must be separate SQL patches in `supabase/sql`.
- Do not add new tables unless existing schema cannot support the feature or the user explicitly asks.
- Enable RLS on new public tables.
- Add grants intentionally for tables exposed through PostgREST.
- Do not re-enable automatic global `db:migrate` in deploy workflows.
- Prefer dedicated GitHub Actions SQL workflows for isolated self-hosted Supabase patches.

## UI Rules

- Use shadcn/ui primitives from `components/ui`.
- Use product components from `components/srchr` when available.
- Use icons only through `components/ui/icons`.
- Keep dashboard and admin interfaces dense, operational, and scan-friendly.
- Do not create one-off raw controls when a shared component exists.
- Public pages may be more editorial, but entity pages must prioritize real data and clear actions.

## Business Guardrails

- Expert profile does not replace organization.
- Organization can be contractor, client, or both through flags and memberships.
- Favorites are a personal user layer and must not mutate target entities.
- Materials support `case` and `article`; publishing is moderated.
- Tenders and price requests have restricted detail/action access for guests.
- Events are separate from materials.
- Reputation is for experts and contractors, not client-only organizations.
- Admin UI visibility is not authorization; server-side admin checks are required.

## Documentation Rules

- When business behavior changes, update the relevant file in `docs/modules`.
- When product strategy changes, update `docs/product`.
- Keep `AGENTS.md` short and operational. Put long explanations in docs.
- Prefer concrete rules, file paths, and commands over generic advice.

## Git Safety

- Do not stage unrelated dirty files.
- Do not delete local logs, screenshots, or generated artifacts unless asked.
- Do not revert user changes without explicit request.
- If unrelated files are dirty, leave them unstaged.
