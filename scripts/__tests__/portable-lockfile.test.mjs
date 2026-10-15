import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeRegistryUrls } from '../portable-lockfile.mjs';

const cache = 'https://europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/';
test('uses public tarballs while preserving exact versions and integrity', () => {
  const source = `"react": ["react@19.2.4", "${cache}react/-/react-19.2.4.tgz", {}, "sha512-original"],`;
  assert.equal(normalizeRegistryUrls(source), source.replace(cache, 'https://registry.npmjs.org/'));
});
test('preserves scoped names and aliased transitive packages', () => {
  const source = `"nested/@types/react": ["@types/react@19.2.1", "${cache}@types/react/-/react-19.2.1.tgz", {}, "sha512-same"]`;
  assert.equal(normalizeRegistryUrls(source), source.replace(cache, 'https://registry.npmjs.org/'));
});
test('keeps non-registry sources unchanged', () => {
  const source = '"git+https://github.com/example/repo.git#123", "file:../local", "https://other.example/pkg.tgz"';
  assert.equal(normalizeRegistryUrls(source), source);
});
test('is idempotent', () => {
  const source = `"${cache}react/-/react-19.2.4.tgz"`;
  const once = normalizeRegistryUrls(source);
  assert.equal(normalizeRegistryUrls(once), once);
});
