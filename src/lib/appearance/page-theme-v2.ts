import type { PageTheme } from '@/types/page';
import { DEFAULT_THEME } from '@/lib/constants';

export const PAGE_THEME_SCHEMA_VERSION = 2 as const;

export type PageThemeV2 = PageTheme & {
  schemaVersion: 2;
  appearanceMode: 'v2';
  colors: NonNullable<PageTheme['colors']>;
  typography: NonNullable<PageTheme['typography']>;
  radii: NonNullable<PageTheme['radii']>;
  spacing: NonNullable<PageTheme['spacing']>;
};

export function isPageThemeV2(theme: Partial<PageTheme> | null | undefined): theme is PageThemeV2 {
  return theme?.schemaVersion === PAGE_THEME_SCHEMA_VERSION
    && theme.appearanceMode === 'v2'
    && Boolean(theme.colors && theme.typography && theme.radii && theme.spacing);
}

/**
 * Builds a v2 candidate without changing the source theme. Published legacy
 * pages therefore keep their existing rendering until this result is saved.
 */
export function previewPageThemeV2(theme: Partial<PageTheme> | null | undefined): PageTheme {
  const source = theme ?? {};
  return {
    ...DEFAULT_THEME,
    ...source,
    schemaVersion: PAGE_THEME_SCHEMA_VERSION,
    appearanceMode: 'v2',
    colors: {
      ...DEFAULT_THEME.colors!,
      canvas: source.backgroundColor || DEFAULT_THEME.colors!.canvas,
      text: source.textColor || DEFAULT_THEME.colors!.text,
      primary: source.accentButton || source.accentColor || DEFAULT_THEME.colors!.primary,
      focus: source.accentActive || source.accentColor || DEFAULT_THEME.colors!.focus,
      ...source.colors,
    },
    typography: { ...DEFAULT_THEME.typography!, ...source.typography },
    radii: { ...DEFAULT_THEME.radii!, ...source.radii },
    spacing: { ...DEFAULT_THEME.spacing!, ...source.spacing },
  };
}

export function preserveLegacyPageTheme(theme: PageTheme): PageTheme {
  if (isPageThemeV2(theme)) return theme;
  return { ...theme, appearanceMode: 'legacy' };
}
