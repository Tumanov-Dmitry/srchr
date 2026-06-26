# SRCHR QA Smoke Checklist

Use this checklist before deploys and after changes that touch access, materials, dashboard, admin, or public catalogs.

## Automated Checks

- `npm run lint`
- `npm run build`
- `npm run test:materials`
- `npm run test:security`
- `npm run test:notifications`
- `npm run test:analytics`
- `npm run test:reputation`

## Guest Public Access

- `/` loads without a session.
- `/contractors`, `/experts`, `/media`, `/events`, `/tenders`, `/price-requests`, `/insights` load without a session.
- Published contractor and expert pages are visible to guests.
- Contractor and expert contacts are hidden from guests and show a login CTA.
- Published media pages are readable by guests.
- Guest cannot comment, react, favorite, respond, or create objects.
- Tender and price request detail actions require login where applicable.

## Authenticated User

- `/dashboard` redirects guests to `/login`.
- Onboarding can be skipped without crashing.
- Expert profile can be created without creating an organization.
- Contractor organization can edit city, description, slug, website, services, and publication status.
- Client organization can create and manage tenders.
- Notifications page uses dashboard layout and marks notifications read only from the explicit read action.
- Favorite add/remove and collection selection work from cards and detail pages.

## Materials

- Article draft saves without all required moderation fields.
- Case draft saves without all required moderation fields.
- New material form does not inherit text from a previous material.
- Closing an unsaved editor offers continue, save draft, or discard.
- Existing draft can be edited, deleted, and sent to moderation.
- Moderation submit is blocked until required fields are complete.
- Preview opens as a separate dashboard page.
- Public material shows views, share, favorite, reactions, and comments.

## Admin

- Non-admin users cannot access `/admin` or `/dev/ui`.
- Admin can view users, organizations, experts, materials, tenders, events, notifications, system events, analytics, onboarding stories, and knowledge base.
- Admin moderation status changes update `published_at` only when publishing.
- Admin notifications link to the relevant admin moderation target.

## Mobile

- Public mobile navigation exposes the same primary public sections.
- Dashboard mobile navigation exposes notifications and favorites.
- Bell dropdown is usable on mobile.
- Dialogs, sheets, popovers, calendars, and favorite collection modals fit the viewport.

## Deployment

- Push to `main` triggers `Deploy dev`.
- `Deploy dev` finishes successfully.
- `Security checks` finishes successfully.
- After deploy, check `https://dev.srchr.ru/`, `/contractors`, `/media`, `/events`, `/tenders`, and `/login` return HTTP 200.
