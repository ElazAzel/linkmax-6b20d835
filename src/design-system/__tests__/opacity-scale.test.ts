import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * Tailwind 3 only generates colour opacity modifiers from the theme scale.
 * `bg-success/12` silently produces no CSS unless 12 is in the scale, so a
 * typo leaves an element without background or border. Keep in sync with
 * `theme.extend.opacity` in tailwind.config.ts.
 */
const ALLOWED = new Set([
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
  12, 14,
]);

const COLOR_UTILITY =
  /\b(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|from|via|to|fill|stroke|divide|outline|shadow|decoration|placeholder|caret|accent)-[a-z][a-z-]*(?:-\d{2,3})?\/(\d+)\b/g;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== '__tests__') sourceFiles(path, out);
    } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

describe('Tailwind opacity modifiers', () => {
  it('only use steps that exist in the opacity scale', () => {
    const root = resolve(process.cwd(), 'src');
    const offenders: string[] = [];
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(COLOR_UTILITY)) {
        if (!ALLOWED.has(Number(match[1]))) offenders.push(`${relative(root, file)}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
