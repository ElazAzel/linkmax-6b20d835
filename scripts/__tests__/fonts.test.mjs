import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('all vendored font files and licenses match the manifest and need no remote CSS', async () => {
  const root = new URL('../../public/fonts/', import.meta.url);
  const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', root), 'utf8'));
  assert.ok(manifest.Inter && manifest['Golos Text']);
  for (const [family, font] of Object.entries(manifest)) {
    const folder = encodeURIComponent(family).replaceAll('%20', '+');
    const dir = new URL(folder + '/', root);
    assert.doesNotMatch(await fs.readFile(new URL('font.css', dir), 'utf8'), /https?:/);
    const license = await fs.readFile(new URL('OFL.txt', dir));
    assert.equal(createHash('sha256').update(license).digest('hex'), font.licenseSha256);
    for (const file of font.files) {
      const bytes = await fs.readFile(new URL(file.path, root));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
});
