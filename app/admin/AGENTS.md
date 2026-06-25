# Admin Instructions

## Scope

Applies to `app/admin/**`.

## Authorization

- Admin pages and actions must use server-side admin checks.
- Button visibility is not authorization.
- Do not expose service role behavior to client components.

## Admin Responsibilities

Admin surfaces manage:

- users and roles;
- moderation of organizations, materials, tenders, events, and experts;
- notifications and system events;
- analytics views;
- product knowledge and onboarding stories.

## Mutation Rules

- Admin status changes must preserve audit/notification behavior where it exists.
- Do not bypass moderation flows from non-admin surfaces.
- Keep admin forms operational and dense.
