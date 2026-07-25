# Page Customization

## Scope

The editor supports page-level visual customization without requiring edits to individual blocks. It is available from the palette button in the editor dock and from the branding area in settings.

The page appearance includes:

- coherent theme presets;
- solid, gradient, patterned, and image backgrounds;
- text and accent colors for buttons, links, and active states;
- font pairs and icon styles;
- card shape, shadow, hover behavior, and dividers.

## Precedence

1. A theme preset supplies the baseline values.
2. Page-level controls override that baseline for the published page and editor preview.
3. A block-level option, where available, overrides only that block.

Resetting a theme removes page-level overrides before applying the selected preset. This prevents stale background, accent, or card settings from surviving a reset.

## Rendering and Persistence

Appearance is stored in `pageData.theme` and saved through the normal page autosave path. The same theme is applied to the editor preview and to `PublicPage`, including CSS variables used by shared block cards.

Core implementation points:

- `src/components/dashboard-v2/panels/ThemePanel.tsx` manages customization controls.
- `src/lib/appearance/presets.ts` defines preset baselines.
- `src/lib/appearance/style-utils.ts` translates settings into CSS variables and backgrounds.
- `src/components/dashboard-v2/screens/EditorScreen.tsx` renders the editor preview.
- `src/pages/PublicPage.tsx` renders the public page.
- `src/components/blocks/GridBlocksRenderer.tsx` applies global card defaults unless a block explicitly overrides them.

## Validation

Run the focused appearance tests after changing customization behavior:

```powershell
npx vitest run src/pages/__tests__/PublicPage.test.tsx src/lib/appearance/__tests__/style-utils.test.ts
```

Run `npm run typecheck:strict` and `npm run build` before merging changes to this flow.
