# ADR 0035: App design system «Warm master» and page isolation

- Status: Accepted
- Date: 2026-09-30
- Supersedes: ADR 0034 (token mapping and ink navigation)

## Context

ADR 0034 mapped the shadcn tokens onto the brand palette, but the codebase still carried five token systems (index.css, quiet-bento, glass, aurora/prismatic, public-appearance). An audit in September 2026 found:

- the Tailwind shadow scale pointed at `--shadow-*` variables that were never defined (about 250 usages rendered no shadow);
- `--border` / `--input` had alpha baked in under `.dark`, which makes `border-border/50` invalid CSS;
- the interface dark theme was unreachable (nothing set it);
- about 940 hex literals and 1,500 raw palette classes in components;
- and, most importantly, **pages built by users read the same global tokens as the interface**. Any token change for the dashboard would have restyled every master's public page.

Three visual concepts were compared (warm master, precise tool, bold creator). The product owner delegated the choice; «Warm master» won for readability on phones and continuity with the brand, with monospaced tabular numbers and hairline dividers taken from «Precise tool» for data screens.

## Decision

1. **Two surfaces.** The LinkMAX interface is scoped by `html.lm-app` (set by `AppSurface` from the URL, and by an inline boot script before first paint). Pages built by users keep the current tokens, frozen as the page base on `:root, .lm-page`. `getPageThemeScope` adds `lm-page`, so the editor canvas and the public page resolve the same values.
2. **One source of truth.** `src/design-system/tokens.ts` defines colors (HSL triplets without alpha, light and dark), fonts, radii and shadows. `npm run tokens:build` writes `src/design-system/tokens.css`; a test fails when it is stale.
3. **Typography.** Onest for the interface (covers Kazakh Cyrillic), JetBrains Mono with tabular figures for numbers (`font-num`). Inter and Manrope stay loaded as the default fonts of user pages.
4. **Interface dark theme** via `next-themes` on `data-app-theme` (system / light / dark), switchable in Account settings. It never touches user pages.
5. **Shared components differ only through variables.** For example `Button` reads `--button-shadow`, `--button-lift` and `--button-radius-compact`: pages keep the original glow, the interface uses a flat button.
6. **One toast stack** (sonner). `useToast()` remains as a compatibility shim.
7. **Guardrails.** `DESIGN.md` is the specification; `.agent` rules point to it; tests check contrast (WCAG AA for every token pair), the page-base snapshot and the boot-script segment list; the quality baseline ratchets hex and raw palette usage down.

## Consequences

Positive:
- One token change restyles the whole interface in light and dark, without touching user pages.
- Shadows, borders with opacity and the dark theme work as written.
- Agents (including Lovable) have one document to follow and CI that stops regressions.

Trade-offs:
- Components that render on both surfaces need variables instead of direct class changes.
- Screens still contain literal colors; they are migrated screen by screen (PR 2.2, 2.3) under the ratchet.
- A new interface route must be added to `APP_FIRST_SEGMENTS` (and the boot script) or it renders with page tokens.

## Rollback

Remove the `tokens.css` import and the `AppSurface` / boot script: the interface falls back to the page base, which is the pre-change look.
