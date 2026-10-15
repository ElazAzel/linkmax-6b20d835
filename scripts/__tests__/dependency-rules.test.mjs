import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const cli = fileURLToPath(new URL('../../node_modules/dependency-cruiser/bin/dependency-cruise.mjs', import.meta.url));
const config = fileURLToPath(new URL('../../config/dependency-cycles.cjs', import.meta.url));

async function analyze(files) {
  mkdirSync('tmp', { recursive: true });
  const root = mkdtempSync(join('tmp', 'linkmax-dependencies-'));
  try {
    for (const [name, source] of Object.entries(files)) {
      const path = join(root, name);
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, source);
    }
    const result = spawnSync(process.execPath, [cli, '--config', config, '--output-type', 'json', root], {
      encoding: 'utf8',
    });
    assert.ifError(result.error);
    assert.ok(result.status === 0 || result.status === 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.modules.length, Object.keys(files).length);
    assert.ok(report.modules.some((item) => item.dependencies.length > 0));
    assert.ok(report.modules.every((item) => item.dependencies.every((dependency) => !dependency.couldNotResolve)));
    return report.summary.violations;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('allows a generated router cycle closed only by a type import', async () => {
  const violations = await analyze({
    'router.ts': "import { tree } from './tree'; export const getRouter = () => tree;",
    'tree.ts': "import type { getRouter } from './router'; export type Router = ReturnType<typeof getRouter>; export const tree = {};",
  });
  assert.equal(violations.filter((item) => item.rule.name === 'no-circular').length, 0);
});

test('still rejects a cycle of runtime imports', async () => {
  const violations = await analyze({
    'a.ts': "import { b } from './b'; export const a = () => b();",
    'b.ts': "import { a } from './a'; export const b = () => a();",
  });
  assert.ok(violations.some((item) => item.rule.name === 'no-circular'));
});

test('type-only reverse edges cannot conceal a longer runtime cycle', async () => {
  const violations = await analyze({
    'a.ts': "import { b } from './b'; import type { C } from './c'; export type A = { next: C }; export const a = () => b();",
    'b.ts': "import { c } from './c'; import type { A } from './a'; export type B = { next: A }; export const b = () => c();",
    'c.ts': "import { a } from './a'; import type { B } from './b'; export type C = { next: B }; export const c = () => a();",
  });
  assert.ok(violations.some((item) => item.rule.name === 'no-circular'));
});
