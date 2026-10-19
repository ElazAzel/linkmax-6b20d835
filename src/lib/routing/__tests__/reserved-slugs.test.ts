import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESERVED_SLUGS } from '../reserved-slugs';

// A top-level route that is not reserved lets someone claim a profile URL that
// always opens the product page instead.
describe('RESERVED_SLUGS', () => {
  it('covers every static top-level route that could look like a slug', () => {
    const routesDir = resolve(__dirname, '../../../routes');
    const segments = readdirSync(routesDir)
      .map((name) => name.replace(/\.(tsx?|jsx?)$/, '').replace(/^\[(.+)\]$/, '$1'))
      .filter((name) => !name.startsWith('$') && !name.startsWith('__') && !name.includes('['))
      .filter((name) => /^[a-z0-9_-]+$/.test(name));
    const missing = segments.filter((segment) => !RESERVED_SLUGS.has(segment));
    expect(missing).toEqual([]);
  });
});
