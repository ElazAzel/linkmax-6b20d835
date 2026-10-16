import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// Code rendered on the server and hydrated in the browser. A default-locale
// toLocaleString() prints "3,045" on the server and "3 045" in a Russian
// browser, and React throws #418 and re-renders the whole page.
const SSR_SOURCES = [
  'src/components/blocks',
  'src/components/landing',
  'src/components/screens/Pricing.tsx',
  'src/lib/seo',
  'src/pages/PublicGoodsPage.tsx',
];

const DEFAULT_LOCALE_CALL = /\.toLocale(?:Date|Time)?String\(\s*\)|new Intl\.(?:NumberFormat|DateTimeFormat)\(\s*\)/;

function files(path: string): string[] {
  const full = resolve(process.cwd(), path);
  if (!statSync(full).isDirectory()) return [full];
  return readdirSync(full).flatMap((name) =>
    name === '__tests__' ? [] : files(join(path, name)),
  ).filter((file) => /\.tsx?$/.test(file));
}

describe('SSR hydration safety', () => {
  it('server-rendered code never formats numbers or dates with the runtime default locale', () => {
    const offenders = SSR_SOURCES.flatMap(files).flatMap((file) =>
      readFileSync(file, 'utf8').split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => DEFAULT_LOCALE_CALL.test(line))
        .map(({ index }) => `${file.replace(`${process.cwd()}/`, '')}:${index + 1}`),
    );
    expect(offenders).toEqual([]);
  });

  it('the client entry hydrates only after the locale chunk is loaded', () => {
    const entry = readFileSync(resolve(process.cwd(), 'src/client.tsx'), 'utf8');
    expect(entry).toMatch(/i18nReady\.then\(hydrate, hydrate\)/);
  });
});
