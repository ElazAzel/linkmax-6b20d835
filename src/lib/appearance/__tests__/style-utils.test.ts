import { describe, expect, it } from 'vitest';
import {
  getBackgroundStyle,
  getPublicPageCssVars,
  getThemeBackgroundStyle,
} from '../style-utils';

describe('page appearance style utils', () => {
  it('keeps a preset solid background on the page root', () => {
    expect(getThemeBackgroundStyle({ backgroundColor: '#14213d' })).toEqual({
      backgroundColor: '#14213d',
    });
  });

  it('keeps a preset gradient as a CSS background', () => {
    expect(getThemeBackgroundStyle({ backgroundColor: 'linear-gradient(135deg, #111, #333)' })).toEqual({
      background: 'linear-gradient(135deg, #111, #333)',
    });
  });

  it('creates independent accent variables with readable foregrounds', () => {
    const vars = getPublicPageCssVars({
      accentColor: '#ffffff',
      accentButton: '#111111',
      accentLink: '#ff5701',
    }) as Record<string, string>;

    expect(vars['--lm-accent-fg']).toBe('#0b0b0b');
    expect(vars['--lm-accent-button-fg']).toBe('#ffffff');
    expect(vars['--lm-accent-link']).toBe('#ff5701');
  });

  it('builds a transparent pattern layer above the base theme background', () => {
    const background = getBackgroundStyle({
      type: 'pattern',
      value: 'dots',
      patternColor: '#ff5701',
      patternScale: 1.5,
    });

    expect(background.className).toBe('lm-pattern-dots');
    expect(background.style).toMatchObject({
      '--lm-pattern-color': '#ff5701',
      '--lm-pattern-scale': '1.5',
    });
  });
});
