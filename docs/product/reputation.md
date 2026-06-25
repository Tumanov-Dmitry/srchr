# Reputation

## Purpose

Reputation is a trust signal for contractors and experts.

It should help buyers compare credibility without using star ratings or simplistic marketplace scores.

## Display Principle

Primary display:

```text
Reputation: 1840
12 reviews
4 recommendations
```

Do not use public five-star ratings as the main model.

## Eligible Targets

Reputation applies to:

- experts;
- contractor organizations.

Client-only organizations do not use reputation as a rating.

## Data Model

Core entities:

- `reputation_events`;
- `reputation_summary`.

Events store every points change. Summary stores aggregated totals for fast UI rendering.

## Sources

Reputation can come from:

- profile completion and publication;
- case publication;
- article publication;
- reviews;
- recommendations;
- tender activity;
- event creation, participation, speaking;
- reactions and useful activity.

## Product Rules

- Points are cumulative.
- Point values should be configurable outside hardcoded UI logic.
- History must be preserved.
- Future formulas can change without losing raw events.
- Public UI should show total points and counts, not opaque hidden scores.

## Future Direction

Reputation can later support:

- sorting;
- recommendations;
- levels;
- achievements;
- hidden quality signals;
- fraud detection.
