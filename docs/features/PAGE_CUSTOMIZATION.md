# Page Customization

## Contract

`PageTheme v2` is the semantic appearance contract for customer pages. It lives in `src/types/page.ts` and contains:

- semantic color roles;
- heading/body/mono typography;
- small, medium and large radii;
- section, block and control spacing;
- image treatment;
- button weight;
- motion level;
- explicit schema and appearance mode.

Dashboard appearance is not part of `PageTheme`. A customer's public theme cannot change the product shell.

## Legacy Preservation

Existing published pages keep their legacy theme unchanged. `preserveLegacyPageTheme` returns the original object until the owner explicitly applies the v2 preview in the theme inspector. This prevents a release from silently restyling published pages.

`previewPageThemeV2` produces the proposed migration. The inspector shows a migration notice and only writes v2 after an explicit action.

## Import And Export

Theme transfer payload version is `2`. Imports accept v1 and v2 payloads, discard unknown fields and sanitize nested semantic values. Remote image values remain subject to the existing safe URL rules.

Implementation:

- `src/lib/appearance/page-theme-v2.ts`
- `src/lib/appearance/theme-transfer.ts`
- `src/components/dashboard-v2/panels/ThemePanel.tsx`
- `src/domain/entities/Page.ts`

## Precedence

1. Preset baseline.
2. Page-level semantic theme.
3. Explicit block-level override.

Resetting a preset clears incompatible page overrides. Template creation stores the theme with blocks, while newly applied templates receive fresh block IDs.

## Verification

```powershell
npx vitest run src/lib/appearance/__tests__/page-theme-v2.test.ts
npx vitest run src/lib/appearance/__tests__/theme-transfer.test.ts
npm run typecheck:strict
npm run build
```
