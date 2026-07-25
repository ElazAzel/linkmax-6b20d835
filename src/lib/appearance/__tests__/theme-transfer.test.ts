import { describe, expect, it } from 'vitest';
import { createThemeTransfer, parseThemeTransfer, sanitizeTheme, THEME_TRANSFER_VERSION } from '../theme-transfer';

describe('theme transfer', () => {
  it('round-trips supported appearance values', () => {
    const payload = createThemeTransfer({
      backgroundColor: '#101318',
      textColor: '#ffffff',
      accentColor: '#ff5701',
      blockShape: 'squircle',
      customBackground: { type: 'pattern', value: 'dots', patternScale: 1.5 },
    });

    expect(parseThemeTransfer(payload)).toEqual(payload.theme);
  });

  it('rejects unsupported versions and malformed input', () => {
    expect(parseThemeTransfer({ version: THEME_TRANSFER_VERSION + 1, theme: {} })).toBeNull();
    expect(parseThemeTransfer({ version: THEME_TRANSFER_VERSION, theme: { blockShape: 'unsafe' } })).toEqual({});
  });

  it('does not accept unsafe style values or image protocols', () => {
    expect(sanitizeTheme({ accentColor: '#fff; background: red' })).toEqual({});
    expect(sanitizeTheme({ customBackground: { type: 'image', value: 'javascript:alert(1)' } })).toEqual({});
  });
});
