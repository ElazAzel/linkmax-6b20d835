# LinkMAX Design System

## Purpose

The product uses one visual language across marketing, authentication, dashboard,
editor, CRM, and admin surfaces. Shared UI primitives are the source of truth;
screen components compose them instead of recreating local variants.

## Foundations

| Role | Token | Value |
| --- | --- | --- |
| Ink | `--brand-ink` | `#16131A` |
| Canvas | `--brand-canvas` | `#F4F5F0` |
| Surface | `--brand-surface` | `#FFFFFF` |
| Primary action | `--brand-coral` | `#C93618` |
| Information | `--brand-blue` | `#2F52E0` |
| Success | `--brand-mint` | `#087A54` |
| Attention | `--brand-sun` | `#FFD84A` |

- `Onest` is used for interface text, `Unbounded` for marketing display text,
  and `JetBrains Mono` for metrics and technical values.
- Controls use a 6px radius. Cards and modal surfaces use an 8px radius.
- Pills are reserved for compact statuses, tags, and filters. They are not a
  general container style.
- The main interface is light and opaque. Dark theme is defined through its own
  semantic tokens instead of relying on automatic inversion.

## Surface and Interaction Rules

- Use `Card`, `Dialog`, `Sheet`, `Tabs`, `Input`, `Select`, `Textarea`, and
  `Button` from `src/components/ui` for standard interactive controls.
- A surface has one border and one elevation level. Do not put framed cards
  inside framed cards unless the inner element is a repeated record or a modal.
- `glass*` and `qb-*` classes remain compatibility aliases for legacy screens;
  they resolve to the same opaque, bordered surfaces as the primitives.
- Hover communicates affordance with color and border changes. It must not move
  layout, scale content, or introduce decorative glow.
- Statuses must include a text label or icon in addition to color.

## Layout

- Marketing pages can use expressive type and media, but retain the same color,
  radius, control, and focus rules.
- Dashboard, CRM, and admin pages prioritize density: structured headers,
  lists, tables, dividers, and predictable action areas instead of stacked
  decorative panels.
- The editor canvas is a working surface, not a card. On desktop it is framed
  by the block library and inspector; on mobile primary actions stay in a fixed
  bottom bar and secondary controls open in sheets.
- Interactive targets have a minimum 44px touch size and visible keyboard focus.

## Implementation Contract

1. Add a semantic token before adding a one-off color, radius, shadow, or font.
2. Extend a shared primitive before introducing a page-specific button, input,
   modal, or card.
3. Keep dashboard theme tokens separate from published-site `PageTheme` tokens.
4. Verify both light and dark themes at 375px, 768px, 1024px, and 1440px.
5. Update the affected visual test snapshot only after reviewing the intended
   UI change.

The canonical token definitions live in `src/index.css` and
`src/styles/quiet-bento.css`; shared component behavior lives in
`src/components/ui`.
