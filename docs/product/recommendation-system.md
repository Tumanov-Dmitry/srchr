# Recommendation System

## Purpose

Recommendations should help buyers discover relevant contractors and experts faster, and help suppliers find relevant tasks, events, and audiences.

## Current Stage

Recommendation logic is early. Do not introduce complex AI ranking without reliable data and clear evaluation.

## Inputs

Future recommendation inputs:

- services and specializations;
- city and region;
- industries;
- budget ranges;
- profile completeness;
- reputation;
- published materials;
- events;
- favorites and collections;
- views and clicks;
- tender/price request behavior;
- response quality;
- admin quality signals.

## Guardrails

- Recommendations should not mutate source entities.
- Ranking should be explainable enough for product debugging.
- Do not mix contractor and expert catalogs unless the UI explicitly supports mixed results.
- Keep fallback deterministic when data is sparse.
- Avoid hidden personalization that breaks public catalog expectations.

## MVP Recommendation Pattern

Start with simple rules:

- match by service/specialization;
- match by city where useful;
- prefer published and complete profiles;
- use reputation as a secondary signal;
- use recent activity as a freshness signal.

AI can be added later as a layer over structured data, not as replacement for clear filters and ranking rules.
