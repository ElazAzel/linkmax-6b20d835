# ADR 0034: Unified LinkMAX Visual System

- Status: Accepted
- Date: 2026-07-10

## Context

The current landing page established a clear LinkMAX identity with charcoal ink, warm paper, orange action color, bold typography, and compact product previews. Authenticated screens still mixed Apple-blue Liquid Glass, purple marketing treatments, oversized radii, and quiet dashboard surfaces. The product therefore looked like several applications despite sharing one architecture.

The repository already centralizes most UI through semantic CSS variables, shared shadcn/ui primitives, and the dashboard shell. Replacing those foundations or adding another component system would duplicate behavior and increase migration risk.

Open Design's Application package was used as a structural reference for spacing, state coverage, component reuse, and motion timing. LinkMAX's landing remains the visual source; no external theme palette is adopted.

## Decision

1. Extend the existing semantic token system with `brand-ink`, `brand-paper`, `brand-orange`, `brand-orange-action`, and `brand-sage` foundations.
2. Map existing `background`, `card`, `primary`, `accent`, `border`, sidebar, glass, and chart tokens to the LinkMAX foundations.
3. Keep the existing `Button`, `Card`, form, tab, select, dashboard layout, header, sidebar, and mobile navigation components as the only product primitives.
4. Scope ink navigation through `app-sidebar` and `app-bottom-nav`; scope the working canvas through `app-canvas`.
5. Preserve dark mode, status colors, provider identity, chart differentiation, and user-owned public page themes.
6. Remove unrelated purple and blue decoration from authentication and align admin surfaces with the application canvas.

## Consequences

### Positive

- One token change reaches dashboard, CRM, analytics, booking, finance, Business Zone, and administration screens.
- New modules inherit the brand without local color recipes.
- The landing-to-signup-to-dashboard journey feels continuous.
- Shared control behavior, accessibility, and translation resilience remain centralized.

### Trade-offs

- Legacy hardcoded colors inside specialized screens will be migrated only when those screens are actively changed or when they conflict with semantics.
- User-created page themes cannot be forced into the platform palette.
- Visual snapshot tests may need intentional updates after review.

## Performance And Security

The decision adds no dependency, database object, API, storage access, or runtime network request. CSS variable mapping and existing utility classes have negligible runtime cost. RBAC, RLS, payment, wallet, booking, and CRM contracts are unchanged.

## Rollback

Rollback consists of reverting the semantic token mappings, product-shell classes, and shared primitive recipes. No data migration or backend rollback is required.

## Acceptance

- Landing, auth, dashboard shell, admin shell, and shared primitives use the same visual foundations.
- Desktop and mobile navigation remain usable.
- Light and dark modes remain legible.
- Strict typecheck, lint baseline, unit tests, and production build pass.
