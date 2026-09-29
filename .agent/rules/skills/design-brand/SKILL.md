---
name: design-brand
description: LinkMAX design system «Warm master» (DESIGN.md) — tokens, typography, components, interface vs user-page surfaces, theme presets and posters.
---

# Design System & Branding

The specification is **`DESIGN.md`** in the repository root. Read it before changing any UI. This skill is a short map.

## When to Use
- Styling interface screens (dashboard, editor chrome, landing, auth).
- Changing design tokens or shared primitives in `src/components/ui`.
- Designing theme presets for user pages (`src/lib/appearance/presets.ts`) and theme transfer.
- Generating QR cards, story posters, social previews (`html2canvas`).

## Two surfaces (most important rule)
- **Interface** — `html.lm-app`, tokens from `src/design-system/tokens.ts` → `npm run tokens:build` → `src/design-system/tokens.css`. Light and dark (`data-app-theme`).
- **User pages** — `.lm-page` (public page, editor canvas, previews). Tokens in `src/index.css` / `src/styles/quiet-bento.css` under `:root, .lm-page` are **frozen**: changing them restyles every published page. A snapshot test guards them.

## Core Workflows

### 1. Styling interface UI
1. Semantic Tailwind classes only: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-success|warning|destructive|info`.
2. Fonts: Onest (`font-sans`, `font-heading`); numbers `font-num` (JetBrains Mono, tabular).
3. Radii: `rounded-control` (12px), `rounded-card` (20px), `rounded-sheet` (28px). Shadows: `shadow-sm|md|lg`.
4. Spacing rhythm 4/8/12/16/20/24/32/40/56 px; touch targets ≥ 44px.

### 2. Changing tokens
1. Edit `src/design-system/tokens.ts`, run `npm run tokens:build`.
2. `npx vitest run src/design-system` (sync, WCAG AA contrast for every pair, page isolation).
3. Update the token table in DESIGN.md.

### 3. User page theme presets
1. Register presets in `src/lib/appearance/presets.ts` (hex allowed here: user data).
2. Check contrast with `src/lib/design/contrast.ts`.
3. Every font pair must be loadable (`src/hooks/page/__tests__/usePageFonts.test.ts`).

### 4. Posters and social previews
Render an offscreen container (e.g. 1080×1920) and export via `html2canvas` in `src/lib/export/`.

## Key Files
- `DESIGN.md`, `docs/ADR/0035-app-design-system-warm-master.md`
- `src/design-system/tokens.ts`, `generate-css.ts`, `surface.ts`, `tokens.css` (generated)
- `src/components/layout/AppSurface.tsx`, `src/components/settings/AppThemeSwitcher.tsx`
- `src/lib/appearance/style-utils.ts` (`getPageThemeScope`), `src/lib/design/contrast.ts`

## Commands & Verification
```bash
npm run tokens:build
npx vitest run src/design-system src/lib/appearance src/lib/design
npm run quality:baseline   # hex / raw palette ratchet
```

## Guardrails
- No hex, `white/*`, raw palette classes or arbitrary radii in interface code (ratchet in CI).
- No glassmorphism, neon glows or gradient headings in the interface.
- One primary (orange) action per screen.
- Mobile first: check 360px and 1280px, light and dark.
