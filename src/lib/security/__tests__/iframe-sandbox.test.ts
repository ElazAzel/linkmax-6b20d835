import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * An iframe with both allow-scripts and allow-same-origin runs its code as
 * this origin: it can read the Supabase session from localStorage and remove
 * its own sandbox. User-provided code (custom code blocks, widgets, templates)
 * must never get that combination.
 */
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

describe('iframe sandbox', () => {
  it('never combines allow-scripts with allow-same-origin', () => {
    const root = resolve(process.cwd(), 'src');
    const offenders: string[] = [];
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/sandbox\s*=\s*\{?\s*["'`]([^"'`]*)["'`]/g)) {
        const tokens = match[1].split(/\s+/);
        if (tokens.includes('allow-scripts') && tokens.includes('allow-same-origin')) {
          offenders.push(`${relative(root, file)}: sandbox="${match[1]}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
