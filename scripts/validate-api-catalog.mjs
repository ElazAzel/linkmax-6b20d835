#!/usr/bin/env node
/**
 * validate-api-catalog.mjs — public-apis inspired link/consistency checker.
 *
 * Verifies that every URL advertised in our discovery documents actually exists
 * (locally in `public/` or as a declared app route), so agents and crawlers
 * never hit a dead link.
 *
 * Usage: node scripts/validate-api-catalog.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const checked = [];

const routesSource = readFileSync(join(root, 'src/main.tsx'), 'utf8');
const declaredRoutes = new Set(
  [...routesSource.matchAll(/path:\s*"([^"]+)"/g)].map((m) => `/${m[1].replace(/^\//, '')}`),
);

function pathExists(pathname) {
  if (existsSync(join(root, 'public', pathname))) return true;
  if (declaredRoutes.has(pathname)) return true;
  return false;
}

function checkPath(source, pathname) {
  checked.push(pathname);
  if (!pathExists(pathname)) {
    errors.push(`${source}: ${pathname} is not a public file nor a declared route`);
  }
}

function localPath(url) {
  try {
    return new URL(url, 'https://lnkmx.my').pathname;
  } catch {
    return null;
  }
}

// 1. api-catalog linkset
const catalogPath = join(root, 'public/.well-known/api-catalog');
if (!existsSync(catalogPath)) {
  errors.push('public/.well-known/api-catalog is missing');
} else {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  for (const entry of catalog.linkset ?? []) {
    for (const [rel, links] of Object.entries(entry)) {
      if (rel === 'anchor' || !Array.isArray(links)) continue;
      for (const link of links) {
        const p = localPath(link.href);
        if (p && p !== '/' && !p.startsWith('/api/')) checkPath(`api-catalog[${rel}]`, p);
      }
    }
  }
}

// 2. OpenAPI spec is valid JSON with the expected shape
const specPath = join(root, 'public/.well-known/openapi.json');
if (!existsSync(specPath)) {
  errors.push('public/.well-known/openapi.json is missing');
} else {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  if (!spec.openapi?.startsWith('3.')) errors.push('openapi.json: unsupported openapi version');
  if (!spec.info?.title) errors.push('openapi.json: info.title missing');
  if (!spec.paths || Object.keys(spec.paths).length === 0) errors.push('openapi.json: no paths declared');
  for (const [route, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.operationId) errors.push(`openapi.json: ${method.toUpperCase()} ${route} has no operationId`);
    }
  }
}

// 3. Integration catalog docsUrl targets
const catalogTs = readFileSync(join(root, 'src/lib/integrations/catalog.ts'), 'utf8');
for (const m of catalogTs.matchAll(/docsUrl:\s*'([^']+)'/g)) {
  checkPath('integrations catalog', m[1]);
}

if (errors.length > 0) {
  console.error(`\n[api-catalog] ${errors.length} problem(s) found:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`[api-catalog] OK — ${checked.length} advertised path(s) resolve, discovery docs valid.`);
