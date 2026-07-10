# LinkMAX Visual System

## Purpose

The landing page and authenticated product use one visual language. The system is designed for a compact Business OS: expressive enough to be recognizable, restrained enough for CRM, finance, analytics, booking, and administration work.

This document is the source of truth for new product UI. It extends the existing Tailwind, shadcn/ui, Radix, and dashboard architecture. It does not introduce a second component library.

## Brand Foundations

| Role | Token | Reference | Usage |
| --- | --- | --- | --- |
| Ink | `--brand-ink` | `#101318` | Navigation, high-contrast product framing, dark mode |
| Paper | `--brand-paper` | `#f6f6f1` | Main application canvas and marketing sections |
| Orange | `--brand-orange` | `#ff5701` | Brand marks, highlights, large status accents |
| Action orange | `--brand-orange-action` | Accessible deep orange | Buttons, links, focus, selected controls |
| Sage | `--brand-sage` | Muted neutral | Secondary copy and metadata |

Semantic colors such as `background`, `card`, `primary`, `muted`, `border`, `success`, and chart colors are mapped from these foundations in `src/index.css`. Product code must consume semantic tokens rather than repeat brand hex values.

## Composition

- The application canvas is warm paper; primary navigation is ink.
- Orange identifies the next action or active location. It is not a general background color.
- Cards are solid or lightly translucent. Blur is reserved for sticky navigation, overlays, and floating controls.
- Page hierarchy is title, supporting context, primary action, then working content.
- Operational screens remain dense and scannable. Decorative marketing composition does not enter data tables or forms.

## Typography

- `Manrope` is the heading and brand family.
- `Inter` is the UI and body family.
- `JetBrains Mono` or the platform monospace stack is used only for code, keys, URLs, and identifiers.
- Product headings use normal letter spacing. Long translated labels must wrap before font size is reduced.

## Shape And Spacing

- Spacing follows `4 / 8 / 12 / 16 / 24 / 32`.
- Controls use `--radius-control` (`14px`).
- Product cards use `--radius-card` (`20px`).
- Pills are reserved for compact status, filters, and tags.
- Repeated cards must use `Card`; commands must use `Button`; inputs must use the shared form primitives.

## Motion

- Interaction feedback uses `150-240ms` transitions.
- Default cards do not move on hover. Only interactive cards may lift by a small amount.
- Buttons may lift by `0.5px` and compress on press.
- `prefers-reduced-motion` remains authoritative.

## Product Shell

- `app-canvas` owns the paper application background and dark-mode mapping.
- `app-sidebar` owns the ink desktop navigation and scopes semantic colors for nested shared controls.
- `app-bottom-nav` applies the same contract to mobile navigation.
- `DashboardLayout`, `DashboardHeader`, and the shared UI primitives are the integration points for all dashboard, CRM, analytics, booking, finance, and Business Zone screens.
- Admin screens use `app-canvas` and the same primitives. Auth uses the ink frame with a paper working card.

## Exceptions

- User-created public pages keep their own theme tokens because their visual identity belongs to the page owner.
- Provider logos and recognized provider colors remain unchanged.
- Charts may use the semantic multi-color chart palette when a single orange series would reduce comprehension.
- Success, warning, destructive, and financial states keep their semantic meaning.

## Implementation Checklist

1. Reuse an existing shared component or extend its variant.
2. Use semantic color, radius, spacing, and shadow tokens.
3. Verify light and dark modes.
4. Verify keyboard focus, translated copy, loading, empty, error, and disabled states.
5. Check desktop and `375px` mobile layouts.
6. Run strict typecheck, quality checks, unit tests, and production build.

## References

- Tokens and product utilities: `src/index.css`, `src/styles/quiet-bento.css`
- Components: `src/components/ui`
- Product shell: `src/components/dashboard-v2/layout`
- Marketing visual source: `src/pages/Index.tsx`, `src/components/landing/v3/HeroBentoOS.tsx`
- Decision record: `docs/ADR/0034-unified-linkmax-visual-system.md`
