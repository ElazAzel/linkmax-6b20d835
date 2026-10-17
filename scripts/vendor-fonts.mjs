// Explicit maintenance command; production builds never fetch remote fonts.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Every family must cover Cyrillic and Kazakh (cyrillic + cyrillic-ext):
// pages are mostly Russian/Kazakh, and a Latin-only font made the browser
// draw Cyrillic letters in a fallback font next to the Latin ones.
const families = {
  Inter: '100..900', 'Golos Text': '400..900', Onest: '100..900', Manrope: '200..800',
  'Cormorant Garamond': '400;500;600;700', 'JetBrains Mono': '400;500;700',
  Lora: '400..700', Commissioner: '100..900', Unbounded: '200..900',
  Montserrat: '100..900', Nunito: '200..1000', Rubik: '300..900',
};
const root = path.resolve('public/fonts');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
async function request(url) {
  const result = await fetch(url, { headers: { 'user-agent': agent }, signal: AbortSignal.timeout(30000) });
  if (!result.ok) throw new Error(`${result.status} ${url}`);
  return result;
}
const manifest = {};
const cssByFamily = {};
const entries = Object.entries(families);
for (let start = 0; start < entries.length; start += 3) {
  await Promise.all(entries.slice(start, start + 3).map(async ([family, weights]) => {
    const folder = encodeURIComponent(family).replaceAll('%20', '+');
    const dir = path.join(root, folder);
    await fs.mkdir(dir, { recursive: true });
    const cssSource = `https://fonts.googleapis.com/css2?family=${folder}:wght@${weights}&display=swap`;
    let css = await (await request(cssSource)).text();
    const files = [];
    for (const remote of new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(match => match[1]))) {
      const bytes = Buffer.from(await (await request(remote)).arrayBuffer());
      const name = `${hash(bytes).slice(0,20)}${new URL(remote).pathname.endsWith('.woff2') ? '.woff2' : '.woff'}`;
      await fs.writeFile(path.join(dir, name), bytes);
      css = css.replaceAll(remote, `/fonts/${folder}/${name}`);
      files.push({ path: `${folder}/${name}`, source: remote, sha256: hash(bytes), bytes: bytes.length });
    }
    if (!files.length || /https?:/.test(css)) throw new Error(`Invalid font CSS: ${family}`);
    const licenseSource = `https://raw.githubusercontent.com/google/fonts/main/ofl/${family.toLowerCase().replaceAll(' ', '')}/OFL.txt`;
    const license = await (await request(licenseSource)).text();
    await fs.writeFile(path.join(dir, 'OFL.txt'), license);
    await fs.writeFile(path.join(dir, 'font.css'), css);
    cssByFamily[family] = css;
    manifest[family] = { cssSource, licenseSource, licenseSha256: hash(license), files };
    console.log(`${family}: ${files.length} subsets`);
  }));
}
const globalFamilies = Object.keys(families);
await fs.writeFile(path.join(root, 'global.css'), globalFamilies.map(family => cssByFamily[family]).join('\n'));
await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');
console.log('Font resources and licenses saved.');
