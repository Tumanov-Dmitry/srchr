# Dashboard Instructions

## Scope

Applies to `app/dashboard/**`.

## Product Rules

- Dashboard belongs to the current authenticated user.
- Users may act personally as experts or through organizations where membership grants rights.
- Contractor dashboard is for contractor/expert supply-side work.
- Client dashboard is for organization demand-side work.
- Do not reintroduce confusing role concepts such as account type `both`.

## Access

- Every dashboard page must require a logged-in user.
- Organization actions require membership checks.
- Organization edit/publish actions require owner, admin, or editor where applicable.

## UX

- Avoid marketing hero layouts in dashboard.
- Prefer compact cards, tables, filters, tabs, and direct actions.
- Do not show profile-completion banners unless a task explicitly asks for their placement.
