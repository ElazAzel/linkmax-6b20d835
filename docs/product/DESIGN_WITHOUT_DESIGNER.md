# Design without a Designer — LinkMAX design hierarchy

Goal: a business page that looks intentionally designed without the user making a
single design decision. No second builder engine, no new block types — the whole
system is a deterministic layer on top of the existing blocks.

Hierarchy: **Block → BlockVariant → Composition → SectionPattern → PageRecipe → DesignKit**

| Layer | Where | What it decides |
| --- | --- | --- |
| BlockVariant | `block.designVariant` | Look of a single block (display text, naked media, bold button) |
| Composition | `block.composition` on the first block of a section run | Rhythm of a section (stack, split, bento, full-bleed, spotlight) |
| SectionPattern | `src/lib/sections/section-presets.ts` | Ready group of blocks with meaning (hero, pricing, proof, CTA) |
| PageRecipe | `src/lib/design/art-direction.ts` | Which composition each section gets, top to bottom |
| DesignKit | `src/lib/design/design-kits.ts` | PageRecipe + theme preset (palette, typography, shape) |

## Phases 1–7 (shipped earlier)

1–2. Composition and art-direction engines (`composition.ts`, `art-direction.ts`).
3–5. Visual Section Picker, design controls in the editor top bar and canvas.
6. Design health audit (`design-health.ts`) with one-click fixes.
7. Design Kits — one tap applies layout recipe + theme preset.

## Phase 8 — design from minute one

- **Templates ship with a kit.** `SiteTemplate.defaultKitId` (`src/lib/sections/site-templates.ts`)
  assigns a kit per template (services → `clean-service`, expert → `studio-paper`,
  cafe → `soft-care`, school → `clean-service`, portfolio → `editorial-mono`,
  product landing → `night-bold`). `buildPageBlocks(sections, kitId)` runs the kit's
  recipe over the seeded blocks and `getTemplateThemePatch()` returns the palette,
  which `createSubPage` writes into `theme_settings`. A new multi-page site is
  therefore styled before the user opens the editor.
- **Smart insertion.** `applyRecipeToNewSection(existing, newBlocks, recipeId)`
  annotates a freshly inserted section preset with the page's current recipe:
  first section gets the hero composition, contact/capture sections get the closing
  one, everything else cycles the recipe body. Existing blocks are never touched.
- **Soft onboarding nudge.** When a page has content but `hasArtDirection()` is
  false, the editor shows one dismissible hint offering a Design Kit.

## Phase 9 — pre-publish quality gate

- `PrePublishDesignGate` (`src/components/editor/design/PrePublishDesignGate.tsx`)
  opens on Publish when the page has ≥2 content blocks and the design score is
  below 70. It lists the top 3 issues and offers: fix everything and publish,
  open details, or publish as is. It never blocks publishing and appears at most
  once per editor session.
- The editor top bar shows a compact colored design score (`designScore` prop) that
  opens the full design health sheet.

## Phase 10 — mobile and readability

- **Contrast check.** `src/lib/design/contrast.ts` implements WCAG 2.1 math
  (hex/rgb/hsl parsing, relative luminance, ratio). `analyzeDesignHealth(blocks,
  { theme })` raises a critical `low-contrast` issue below 4.5:1 and its fix is a
  theme patch (`themeFix`) with a readable text color — applied via `onApplyTheme`.
- **Mobile compositions.** `bento-proof` is single-column on phones (two columns of
  tiny cards were unreadable), `fullscreen-contact` and `editorial-hero` use smaller
  mobile padding, horizontal cards are wider on narrow screens, and every grid item
  gets `min-w-0` so long words cannot overflow the section.
- **Phone preview.** The Art Direction sheet has a "Phone view" toggle that renders
  each kit as a 92px phone mock (palette + section rhythm) before applying it.

## Rules

- Deterministic only: no LLM in the design path. Same input, same layout.
- Content is never added, removed or reordered by any design action.
- All new strings are localized in ru / en / kk / uz (Russian is the base fallback).
- Tests: `src/lib/design/__tests__/contrast.test.ts`,
  `src/lib/design/__tests__/art-direction-insert.test.ts`.
