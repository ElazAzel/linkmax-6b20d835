import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicEnv, planReplay, reconcile } from '../portability-core.mjs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('public rendering needs public configuration, never admin secrets', () => {
  assert.equal(validatePublicEnv({ VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', VITE_APP_DOMAIN: 'https://example.com' }).VITE_RUNTIME_MODE, 'standalone');
  assert.throws(() => validatePublicEnv({}), /VITE_SUPABASE_URL/);
  assert.throws(() => validatePublicEnv({ VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_bad', VITE_APP_DOMAIN: 'https://example.com' }), /public/);
});
test('replay refuses altered history and cross-ledger duplicate SQL', () => {
  const entries = [{ id: 'supabase:1', sha256: 'abc' }, { id: 'drizzle:0', sha256: 'abc' }];
  assert.throws(() => planReplay(entries, []), /duplicate/);
  assert.throws(() => planReplay(entries.slice(0, 1), [{ id: 'supabase:1', sha256: 'changed' }]), /checksum/);
  assert.deepEqual(planReplay(entries.slice(0, 1), entries.slice(0, 1)), []);
  assert.throws(() => planReplay([{id:'a',sha256:'a'},{id:'b',sha256:'b'}], [{id:'b',sha256:'b'}]), /prefix/);
});

test('local export snapshot hashes actual bytes and rejects path escapes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'linkmax-portability-'));
  try {
    const manifest = {complete:true,schema:'schema.sql',tables:{'auth.users':'users.json'},media:[{bucket:'media',key:'x',file:'x.bin'}]};
    await writeFile(join(dir,'schema.sql'), 'create table example(id int);');
    await writeFile(join(dir,'users.json'), '[]');
    await writeFile(join(dir,'x.bin'), 'abc');
    await writeFile(join(dir,'manifest.json'), JSON.stringify(manifest));
    const run = () => JSON.parse(execFileSync(process.execPath, ['scripts/portability.mjs','snapshot',dir], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
    const first = run();
    assert.equal(first.media[0].size,3);
    await writeFile(join(dir,'x.bin'), 'abd');
    assert.notEqual(run().media[0].sha256,first.media[0].sha256);
    manifest.schema = '../outside.sql';
    await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest));
    assert.throws(run, /escapes/);
  } finally { await rm(dir, {recursive:true,force:true}); }
});
test('cutover blocks absent export and detects equal-count identity/content changes', () => {
  assert.equal(reconcile({}, {}).ready, false);
  const source = { complete: true, schemaSha256: 'a'.repeat(64), tables: { 'public.pages': [{ id: '1', owner_id: 'u' }], 'auth.users': [{ id: 'u' }] }, media: [{ bucket: 'media', key: 'a', sha256: 'b'.repeat(64), size: 2 }] };
  assert.equal(reconcile(source, structuredClone(source)).ready, true);
  const target = structuredClone(source); target.tables['public.pages'][0].owner_id = 'x';
  assert.equal(reconcile(source, target).ready, false);
  target.tables['public.pages'] = [{ id: '2', owner_id: 'u' }];
  assert.equal(reconcile(source, target).ready, false);
  target.tables = source.tables; target.media[0].sha256 = 'c'.repeat(64);
  assert.equal(reconcile(source, target).ready, false);
});
