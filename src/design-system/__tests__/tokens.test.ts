import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AA_BODY, AA_LARGE, contrastRatio } from '@/lib/design/contrast';
import { generateTokensCss, APP_ONLY_VARIABLES } from '../generate-css';
import { APP_FIRST_SEGMENTS, isAppSurfacePath } from '../surface';
import { colors, type ColorScheme } from '../tokens';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const hsl = (triplet: string) => `hsl(${triplet})`;

describe('design tokens', () => {
  it('tokens.css is generated from tokens.ts (run `npm run tokens:build`)', () => {
    expect(read('src/design-system/tokens.css')).toBe(generateTokensCss());
  });

  it('colors carry no alpha, so Tailwind opacity modifiers stay valid', () => {
    for (const scheme of Object.values(colors)) {
      for (const [name, value] of Object.entries(scheme)) {
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) expect(v, name).not.toContain('/');
      }
    }
  });

  const pairs: Array<[keyof ColorScheme, keyof ColorScheme, number]> = [
    ['foreground', 'background', AA_BODY],
    ['cardForeground', 'card', AA_BODY],
    ['foreground', 'muted', AA_BODY],
    ['mutedForeground', 'background', AA_BODY],
    ['mutedForeground', 'card', AA_BODY],
    ['accentForeground', 'accent', AA_BODY],
    ['primaryForeground', 'primary', AA_BODY],
    ['destructiveForeground', 'destructive', AA_BODY],
    ['successForeground', 'success', AA_BODY],
    ['warningForeground', 'warning', AA_BODY],
    ['infoForeground', 'info', AA_BODY],
    // Status text on cards (soft badges, inline status).
    ['success', 'card', AA_BODY],
    ['warning', 'card', AA_BODY],
    ['destructive', 'card', AA_BODY],
    ['info', 'card', AA_BODY],
    ['primary', 'card', AA_BODY],
    // Field borders need non-text contrast.
    ['input', 'card', 1.3],
  ];

  for (const mode of ['light', 'dark'] as const) {
    it(`meets WCAG AA contrast in the ${mode} theme`, () => {
      const scheme = colors[mode];
      const failures = pairs
        .map(([fg, bg, min]) => {
          const ratio = contrastRatio(hsl(scheme[fg] as string), hsl(scheme[bg] as string)) ?? 0;
          return { pair: `${String(fg)} on ${String(bg)}`, ratio: Math.round(ratio * 100) / 100, min };
        })
        .filter(({ ratio, min }) => ratio < min);
      expect(failures).toEqual([]);
    });
  }

  it('large numbers in the accent color stay readable on the background', () => {
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(hsl(colors[mode].primary), hsl(colors[mode].background)) ?? 0;
      expect(ratio).toBeGreaterThanOrEqual(AA_LARGE);
    }
  });
});

describe('page base isolation', () => {
  const indexCss = read('src/styles.css');
  const pageBase = indexCss.slice(indexCss.indexOf(':root,\n  .lm-page {'));

  it('the page base is declared for :root and .lm-page', () => {
    expect(indexCss).toContain(':root,\n  .lm-page {');
    expect(read('src/styles/quiet-bento.css')).toContain(':root,\n.lm-page {');
  });

  it('every app-only variable is neutralised on pages', () => {
    for (const name of APP_ONLY_VARIABLES) expect(pageBase, name).toContain(`${name}:`);
  });

  it('page base values are frozen (update the snapshot only on purpose)', () => {
    const block = pageBase.slice(0, pageBase.indexOf('\n  }\n') + 4);
    expect(block).toMatchSnapshot();
  });
});

describe('app surface routing', () => {
  it('keeps the index.html boot list in sync with surface.ts', () => {
    const html = read('src/routes/__root.tsx');
    const match = html.match(/var APP_FIRST_SEGMENTS = (\[[^\]]*\]);/);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1])).toEqual([...APP_FIRST_SEGMENTS]);
  });

  it('treats user pages as page surfaces and product routes as app surfaces', () => {
    expect(isAppSurfacePath('/')).toBe(true);
    expect(isAppSurfacePath('/dashboard/home')).toBe(true);
    expect(isAppSurfacePath('/kk')).toBe(true);
    expect(isAppSurfacePath('/%D0%B4%D0%BB%D1%8F-%D1%80%D0%B5%D0%BF%D0%B5%D1%82%D0%B8%D1%82%D0%BE%D1%80%D0%BE%D0%B2')).toBe(true);
    expect(isAppSurfacePath('/aigerim.nails')).toBe(false);
    expect(isAppSurfacePath('/aigerim/p/services')).toBe(false);
    expect(isAppSurfacePath('/booking/manage/abc')).toBe(false);
    expect(isAppSurfacePath('/%E0%A4%A')).toBe(false);
  });
});
