import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CACHE_PREFIX = 'https://europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/';

/** Change archive origin only. Package versions, dependency graph and integrity stay pinned. */
export function normalizeRegistryUrls(source) {
  return source.replaceAll(CACHE_PREFIX, 'https://registry.npmjs.org/');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const target = resolve(process.argv[2] || 'bun.lock');
  const source = await readFile(target, 'utf8');
  const normalized = normalizeRegistryUrls(source);
  if (normalized !== source) await writeFile(target, normalized);
  console.log(`Portable registry URLs: ${(source.match(/sandbox-npm-cache\//g) || []).length}; versions and integrity preserved`);
}
