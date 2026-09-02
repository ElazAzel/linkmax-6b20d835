import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = resolve('scripts/verify-revenue-core-db.mjs');

test('dry run lists every destructive and verification step in safe order', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--dry-run'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const docker = result.stdout.indexOf('docker info');
  const start = result.stdout.indexOf('supabase@2.116.0 start');
  const reset = result.stdout.indexOf('supabase@2.116.0 db reset --local');
  const pgTap = result.stdout.indexOf('supabase@2.116.0 test db --local supabase/tests');
  const lint = result.stdout.indexOf('supabase@2.116.0 db lint --local --schema public');

  assert.ok(docker >= 0, 'Docker preflight is listed');
  assert.ok(docker < start, 'Docker is checked before Supabase starts');
  assert.ok(start < reset, 'Supabase starts before database reset');
  assert.ok(reset < pgTap, 'migrations rebuild before pgTAP');
  assert.ok(pgTap < lint, 'schema lint runs after pgTAP');
  assert.match(result.stdout, /--level warning --fail-on error/);
  assert.doesNotMatch(result.stdout, /supabase@latest/);
});
