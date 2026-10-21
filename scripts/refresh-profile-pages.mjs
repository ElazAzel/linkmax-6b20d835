import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { buildDemoRefresh, buildElazartRefresh, buildRefreshSql, demoOwnerEmail } from './lib/profile-refresh.mjs';

const args = process.argv.slice(2);
const value = key => args[args.indexOf(key) + 1];
if (!args.includes('--input') || !args.includes('--output-dir')) throw new Error('Usage: node scripts/refresh-profile-pages.mjs --input exported-pages.json --output-dir plan-folder [--personal-assets folder]');
const rows = JSON.parse(await readFile(resolve(value('--input')), 'utf8'));
const output = resolve(value('--output-dir'));
await mkdir(output, { recursive: true });
const demos = rows.filter(row => demoOwnerEmail(row.slug)).map(buildDemoRefresh);
if (demos.length !== 28) throw new Error(`Expected the 28 seeded demo pages; found ${demos.length}`);
const plans = [...demos];
if (args.includes('--personal-assets')) {
  const folder = resolve(value('--personal-assets'));
  const row = rows.find(row => row.slug === 'elazart');
  if (!row) throw new Error('Personal page backup is missing');
  const assets = { html: await readFile(join(folder, 'manifesto.html'), 'utf8'), css: await readFile(join(folder, 'manifesto.css'), 'utf8') };
  const personal = buildElazartRefresh(row, assets);
  plans.push(personal);
  await writeFile(join(output, 'elazart.sql'), buildRefreshSql([personal]));
  await writeFile(join(output, 'elazart.json'), JSON.stringify(personal, null, 2) + '\n');
}
for (let start = 0; start < demos.length; start += 4) {
  await writeFile(join(output, `demos-${String(start / 4 + 1).padStart(2, '0')}.sql`), buildRefreshSql(demos.slice(start, start + 4)));
}
await writeFile(join(output, 'plan.json'), JSON.stringify(plans, null, 2) + '\n');
console.log(JSON.stringify(plans.map(p => ({ slug: p.slug, kind: p.kind, blocks: p.blocks.length, avatar: p.blocks.find(b => b.type === 'profile')?.avatarShape })), null, 2));
console.log(`Prepared ${demos.length} demo pages and ${plans.length - demos.length} personal page; no database connection or writes were made.`);
