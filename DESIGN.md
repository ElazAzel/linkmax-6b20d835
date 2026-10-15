# LinkMAX V2 design system

The approved implementation contract is [LINKMAX_V2.md](docs/implementation/LINKMAX_V2.md). The interface and default page composition use the V2 palette. Explicit author colors, fonts, backgrounds, image URLs, scale modes, shapes and effects remain authoritative.

## Tokens and typography

`src/design-system/tokens.ts` is the interface source; `src/design-system/generate-css.ts` generates `tokens.css`. The live catalog and local page-composition sample are at `/design-system`.

| Role | Light | Dark |
|---|---|---|
| Canvas | #f3f3f3 | neutral 8% lightness |
| Surface | #fbfbfb | neutral 12% lightness |
| Body text | #1f1f1f | neutral 95% lightness |
| Primary fill | #0097f2 | blue 63% lightness |
| Text on primary | dark ink | dark ink |

Bright blue is the filled-action and focus accent. The separate `primaryText` token is a darker blue for small interface links and labels; its contrast is tested. Do not use white body text on the bright primary fill. Status colors retain their semantic meanings and AA text contrast.

The interface stack is system SF, Golos Text, Inter, then system sans-serif. Pages default to Inter. Authored font pairs and legacy font selections override the page default. Numerical tables may use JetBrains Mono.

Cards have a 24px default radius. Layout spacing is 16px. Controls have a 12px radius; interactive tap targets should reach 44px. Use semantic colors and existing components rather than adding per-screen palettes.

## Shared page geometry

Public pages, editor canvases and block previews use the resolver in `src/lib/appearance/block-appearance.ts` and CSS in `src/styles/public-appearance.css`.

The outer page has 16px gutters. From a viewport width of 520px upward its **outer** maximum width is 375px, including gutters. Below 520px it fills its available parent. Tile grids have two columns and 16px gaps. A single tile unit has a 16:9 width-to-height ratio; row spans include the gaps between rows.

| Name | Stored preset | Columns × rows |
|---|---|---|
| XS | small / half | 1 × 1 |
| S | wide / full | 2 × 1 |
| M | tall | 1 × 2 |
| L | large | 2 × 2 |
| XL | xl | 2 × 4 |

Forms, booking, pricing, text and other interactive or variable-length content use full width and natural height. Their runs are separate from fixed tile tracks, so an expanded form cannot enlarge neighboring tiles. Existing named compositions keep control of their shell geometry.

The profile and its immediately adjacent social row share one compact surface. The default profile places a floating avatar beside the name and the bio beneath. Explicit avatar alignment, dimensions, cover media and decorative settings remain available. Editor selection controls overlay the same presentation; insertion controls do not occupy tile rows.

## Author precedence and frame ownership

Application tokens are scoped under `html.lm-app`; `.lm-page` establishes page defaults inside the interface. `getPageThemeScope` applies page settings as scoped variables. A block's explicit settings override variant defaults and page defaults. Explicit zero padding, no border and no shadow are meaningful settings.

Self-styled links, buttons and text paint their own surface. Their grid cell supplies geometry and inherited text styling. Other cells paint one shared surface. Image media retain authored scale modes and URLs.

## Verification

Behavioral checks cover geometry resolution, legacy aliases, XL editing, auto-height isolation, adjacent social composition, authored style precedence and contrast selection. Token tests verify generated output, semantic contrast, app/page isolation and an intentional snapshot of the V2 page defaults. Normalize CRLF while reading that snapshot on Windows.

Verify `/design-system#page-composition` at 320, 390, 768 and 1440px, in both interface themes. The sample uses local state and preview context: resetting, changing size and reordering never publish or update a backend page. Check preview/editor geometry and the authored-style sample. Full acceptance also requires strict typecheck, the project test suite and production build.

Only LinkMAX names and original sample content belong in shipped materials.
