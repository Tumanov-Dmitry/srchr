# Search

## Purpose

Search helps users find contractors, experts, media, tasks, events, and price requests.

## Search Principles

- Public search should expose published public content.
- Private data must not be searchable by guests.
- Contacts require authentication where product rules say so.
- Contractor and expert catalogs should remain separate unless a specific mixed search feature is built.
- Filters should be predictable and inspectable.

## Searchable Entities

- contractors;
- experts;
- materials;
- events;
- tenders;
- price requests;
- services;
- tags and categories.

## Core Filters

Common filters:

- service/specialization;
- city;
- budget;
- format;
- type;
- status where appropriate;
- open to cooperation;
- company/organization.

## MVP Implementation Rule

Prefer simple database filters and explicit UI controls before adding advanced full-text or AI search.

When advanced search is added, keep structured filters available.

## Global Search Page

The public global search lives at `/search`.

Behavior:

- the main page search form sends users to `/search?q=...`;
- profile results are split into tabs: agencies and experts;
- material results are split into tabs: cases and articles;
- default sort is by rating;
- default profile ranking puts active pro/subscribed profiles first, then reputation;
- users can switch sorting to relevance, newest, or name;
- materials use public interest signals in MVP: views and freshness;
- contacts and actions still follow the rules of the target entity pages.

The pro-first filter is a ranking preference, not a hard filter. If subscription data is unavailable, search falls back to reputation-based ordering.

## Future Direction

Search can evolve toward:

- full-text search;
- semantic search;
- synonym handling;
- typo tolerance;
- query analytics;
- recommended search refinements;
- ranking by reputation, freshness, and relevance.
