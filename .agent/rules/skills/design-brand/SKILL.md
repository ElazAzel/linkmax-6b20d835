---
name: design-brand
description: Liquid Glass design system, theme tokens, typography, Living Canvas, and responsive UI foundations.
---

# Design System & Branding

Use for visual styling, design tokens, Liquid Glass system, theme presets, Living Canvas poster generation, and responsive layouts.

## When to Use
- Modifying design tokens in `src/index.css` or `tailwind.config.ts`.
- Building or refining UI components with the Liquid Glass / Ink-Paper-Orange system.
- Designing theme presets (`src/lib/appearance/presets.ts`) and theme transfer utilities.
- Generating downloadable QR cards, story posters, or social media previews (`html2canvas`, `canvas-confetti`).

## Core Workflows

### 1. Applying Design Tokens
1. Use semantic CSS variables defined in `src/index.css`:
   - Primary accents: `--primary`, `--primary-foreground`, `--accent`
   - Backgrounds & Surfaces: `--background`, `--card`, `--popover`, `--muted`
   - Glassmorphic surfaces: `glass-card`, `glass-panel`, `glass-input`
2. Apply Manrope for headlines (`font-display` / `font-heading`) and Inter for readable body copy.
3. Follow the 4/8/12/16/24/32px spacing scale.

### 2. Theme Customization & Presets
1. Register new theme presets in `src/lib/appearance/presets.ts`.
2. Support solid, gradient, and animated background styles.
3. Ensure high contrast ratio (WCAG AA) for typography against selected theme colors (`src/lib/design/contrast.ts`).

### 3. Living Canvas & Social Posters
1. Render offscreen poster container with specified canvas dimensions (e.g. 1080x1920 for Stories).
2. Generate high-DPI image via `html2canvas` in `src/lib/export/`.
3. Provide instant download or direct WebShare API integration on supported mobile devices.

## Key Files & Assets
- **Styles**: `src/index.css`, `tailwind.config.ts`, `src/styles/`
- **Appearance Utilities**: `src/lib/appearance/style-utils.ts`, `src/lib/appearance/theme-transfer.ts`, `src/lib/appearance/presets.ts`
- **Design Validation**: `src/lib/design/contrast.ts`, `design-qa.md`

## Commands & Verification
```bash
npm run typecheck:strict
npm run test -- src/lib/appearance/ src/lib/design/
```

## Best Practices & Guardrails
- **No Inline Magic Colors**: Never use arbitrary hex colors in component code; always use design system tokens or Tailwind utility classes.
- **Mobile First**: Test layouts at 390px (iPhone) to guarantee no horizontal overflow (`scrollWidth === innerWidth`).
- **Accessible Touch Targets**: Maintain a minimum 44x44px interactive tap target for mobile navigation and actions.
