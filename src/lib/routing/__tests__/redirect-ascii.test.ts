import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// A non-ASCII Location header makes the server answer 500 instead of 301.
const ROUTES = join(process.cwd(), 'src/routes');

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : routeFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

it('never redirects to a raw non-ASCII href', () => {
  const offenders = routeFiles(ROUTES).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/redirect\(\{\s*href:\s*(['"`])([^'"`]*)\1/g)]
      .filter((m) => /[^\x20-\x7e]/.test(m[2]))
      .map((m) => `${file}: ${m[2]}`),
  );
  expect(offenders).toEqual([]);
});
