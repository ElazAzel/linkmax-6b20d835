import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

test('all vendored font files and licenses match the manifest and need no remote CSS', async () => {
  const root = new URL('../../public/fonts/', import.meta.url);
  const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', root), 'utf8'));
  assert.ok(manifest.Inter && manifest['Golos Text']);
  for (const [family, font] of Object.entries(manifest)) {
    const folder = encodeURIComponent(family).replaceAll('%20', '+');
    const dir = new URL(folder + '/', root);
    assert.doesNotMatch(await fs.readFile(new URL('font.css', dir), 'utf8'), /https?:/);
    const license = await fs.readFile(new URL('OFL.txt', dir));
    assert.equal(createHash('sha256').update(license).digest('hex'), font.licenseSha256, `${family} license SHA-256`);
    for (const file of font.files) {
      const bytes = await fs.readFile(new URL(file.path, root));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
});

test('Git preserves vendored license bytes across platform line-ending settings', async () => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'linkmax-font-bytes-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: sandbox });
    const attributes = await fs.readFile(new URL('../../.gitattributes', import.meta.url)).catch(error => {
      if (error.code === 'ENOENT') return '';
      throw error;
    });
    await fs.writeFile(path.join(sandbox, '.gitattributes'), attributes);
    const license = Buffer.from('License fixture\r\nSecond line\r\n');
    const expected = createHash('sha1').update('blob ' + license.length + '\0').update(license).digest('hex');
    for (const mode of ['true', 'input']) {
      const actual = execFileSync('git', [
        '-c', 'core.autocrlf=' + mode, '-c', 'core.safecrlf=false',
        'hash-object', '--path=public/fonts/Fixture/OFL.txt', '--stdin',
      ], { cwd: sandbox, input: license, encoding: 'utf8' }).trim();
      assert.equal(actual, expected, 'core.autocrlf=' + mode + ' must preserve license bytes');
    }
  } finally {
    const temporaryRoot = await fs.realpath(os.tmpdir());
    const target = await fs.realpath(sandbox);
    assert.ok(target.startsWith(temporaryRoot + path.sep), 'cleanup stays inside the temporary directory');
    await fs.rm(target, { recursive: true, force: true });
  }
});
