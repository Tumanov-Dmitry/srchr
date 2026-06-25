# Roles

## Main Entities

SRCHR separates users, experts, and organizations.

```text
User
  Expert Profile 0..1
  Organization Memberships 0..N

Organization
  contractor capability
  client capability
```

## User

A user is the auth account.

The user owns login, settings, notifications, favorites, and personal dashboard access.

The user can:

- create an expert profile;
- create or join organizations;
- create materials as expert or organization;
- create events as expert or organization;
- create tasks or price requests where allowed;
- save favorites and collections.

## Expert

An expert is an optional public profile attached to one user.

Expert can:

- have public page `/@slug`;
- publish materials;
- be listed in expert catalog;
- be linked as author;
- respond to opportunities personally;
- participate in reputation;
- appear in recommendations.

Expert does not replace organization.

## Organization

Organization represents a company, agency, team, or HR/company buyer.

Organization can be:

- contractor;
- client;
- both, if both capabilities are enabled.

This is capability-based. It should not require account type `both`.

## Organization Membership

Users connect to organizations through `organization_members`.

Roles:

- `owner`;
- `admin`;
- `editor`;
- `member`.

Owner/admin/editor can usually manage organization-owned content. Member may only view or participate depending on module rules.

## Contractor

Contractor is an organization with contractor capability.

Contractor can:

- appear in contractor catalog;
- publish contractor profile;
- show services, city, budget, contacts;
- create materials;
- respond to tasks as organization where allowed;
- accumulate contractor reputation.

## Client / Company / HR

Client is an organization with client capability.

Client can:

- create tasks;
- create price requests;
- review responses;
- save candidates;
- publish expert materials if product rules allow it.

Client-only organizations do not have contractor reputation.

## Admin

Admin users manage platform quality and operations.

Admin can:

- moderate materials, events, tenders, organizations, experts;
- manage users;
- inspect notifications and system events;
- manage onboarding stories;
- view analytics;
- update knowledge base documentation.

Admin rights must be checked server-side.
