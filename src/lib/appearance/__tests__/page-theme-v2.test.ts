import { describe, expect, it } from 'vitest';
import { isPageThemeV2, preserveLegacyPageTheme, previewPageThemeV2 } from '../page-theme-v2';

const legacyTheme = {
  backgroundColor: '#111111',
  textColor: '#ffffff',
  buttonStyle: 'rounded' as const,
  fontFamily: 'sans' as const,
  accentColor: '#ff0000',
};

describe('PageTheme v2 migration', () => {
  it('keeps legacy rendering opt-in', () => {
    const preserved = preserveLegacyPageTheme(legacyTheme);
    expect(preserved.appearanceMode).toBe('legacy');
    expect(isPageThemeV2(preserved)).toBe(false);
  });

  it('maps legacy semantic values into a complete v2 preview', () => {
    const migrated = previewPageThemeV2(legacyTheme);
    expect(isPageThemeV2(migrated)).toBe(true);
    expect(migrated.colors?.canvas).toBe('#111111');
    expect(migrated.colors?.text).toBe('#ffffff');
    expect(migrated.colors?.primary).toBe('#ff0000');
    expect(migrated.radii?.card).toBe(8);
  });
});
