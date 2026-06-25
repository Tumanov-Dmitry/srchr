# Components Instructions

## Scope

Applies to `components/**`.

## UI System

- Use shadcn/ui primitives from `components/ui`.
- Use SRCHR product components from `components/srchr` when available.
- Use `components/ui/icons` for icons.
- Do not import icon packages directly in feature components.

## Component Design

- Keep components focused and reusable inside their module.
- Prefer server components unless interactivity requires `"use client"`.
- Push client state as low as practical.
- Avoid nested decorative cards.
- Keep dashboard/admin components dense and predictable.

## Styling

- Use theme tokens such as `bg-background`, `text-foreground`, `border`, `muted`, `primary`.
- Avoid one-off color systems unless they are product data or approved design tokens.
- Text must not overflow buttons, cards, toolbars, or compact controls.
