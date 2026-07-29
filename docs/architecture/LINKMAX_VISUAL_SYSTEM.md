# LinkMAX Creative OS Visual System

## Direction

`Modular Collage` is the selected LinkMAX direction. Marketing combines large typography, a strict modular grid, real product UI and photographed studio objects. Authenticated surfaces use the same tokens with higher information density and less decoration.

The dashboard theme and each published page theme are separate contracts. Product UI must never inherit a customer's page theme.

## Foundation

| Role | Value | Usage |
| --- | --- | --- |
| Ink | `#16131A` | Primary text, outlines and high-contrast surfaces |
| Canvas | `#F4F5F0` | Main background |
| Surface | `#FFFFFF` | Forms, panels and repeated records |
| Signal Coral | `#C93618` | Primary action and focus |
| Studio Blue | `#2F52E0` | Links, informational state and brand shadow |
| Mint | `#087A54` | Success |
| Sun | `#FFD84A` | Warning and selective emphasis |

Use semantic CSS variables from `src/index.css`; do not repeat hex values in feature code without an asset-specific reason.

## Typography

- `Unbounded`: marketing display headings only.
- `Onest Variable`: application UI and body copy.
- `JetBrains Mono`: metrics, URLs, identifiers and code.
- Letter spacing is `0`; long translations wrap instead of scaling with viewport width.

## Geometry And Composition

- Standard radius: `6-8px`.
- Capsules are limited to status and filter chips.
- Page sections are unframed bands; cards are reserved for repeated records, dialogs and real tools.
- Operational screens prefer tables, lists, separators and side panels over decorative cards.
- Desktop editor contract: `280px` block library, free canvas, `320px` inspector.
- Touch targets are at least `44px`.

## Themes And Motion

Light mode is the default. Dark mode has explicit semantic values in `src/index.css`, not an automatic color inversion. Motion levels come from `PageTheme v2`; `prefers-reduced-motion` always wins.

## Integration Points

- Tokens: `src/index.css`, `tailwind.config.ts`
- Brand mark: `src/components/brand/BrandLogo.tsx`
- Marketing hero: `src/components/landing/v3/HeroBentoOS.tsx`
- Product shell: `src/components/dashboard-v2/layout`
- Editor inspector: `src/components/dashboard-v2/panels/ThemePanel.tsx`
- Public-page theme contract: `src/types/page.ts`
- Theme migration: `src/lib/appearance/page-theme-v2.ts`

## Asset Manifest

| Asset | Source job | Format | Purpose |
| --- | --- | --- | --- |
| `public/brand/linkmax-mark.svg` | `3afe7e4a-8ca6-473e-b3d4-3bc571780697` | SVG | Primary square mark and favicon |
| `public/brand/linkmax-mark.webp` | same | WebP | Raster fallback |
| `public/brand/linkmax-hero-studio.webp` | `aba49d7c-956d-4280-92d6-f64646b2ebd7` | WebP | Optimized hero and auth scene |
| `public/brand/linkmax-hero-studio.png` | same | PNG | Source-quality master |
| `public/brand/linkmax-modular-collage-moodboard.png` | `05ef3708-a56f-411f-9b04-c7ee97d64fe7` | PNG | Approved visual reference |

Generated scene prompts specify a modern creator studio, physical LinkMAX collateral, approved palette and no generated product UI. Real LinkMAX screenshots must be used whenever interface content is shown.

## Acceptance

Verify at `375`, `768`, `1024` and `1440px`, light and dark themes, keyboard focus, RU/EN/KK/UZ copy, reduced motion and no horizontal overflow. The visual QA record is `design-qa.md`.
