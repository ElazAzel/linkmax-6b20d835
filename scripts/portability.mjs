import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { sha256, planReplay, reconcile } from './portability-core.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
async function inventory() {
  const entries = [];
  const quarantined = [];
  for (const file of (await readdir('supabase/migrations')).filter((file) => file.endsWith('.sql')).sort()) {
    const timestamp = file.match(/^(\d{14})_/ )?.[1];
    const path = `supabase/migrations/${file}`;
    if (!timestamp) { quarantined.push({ path, sha256: sha256(await readFile(path)), reason: 'Unordered manual repair; never auto-replay' }); continue; }
    entries.push({ id: `supabase:${timestamp}`, order: `${timestamp}:0`, path, sha256: sha256(await readFile(path)) });
  }
  const journal = await readJson('drizzle/migrations/meta/_journal.json');
  const files = (await readdir('drizzle/migrations')).filter((file) => file.endsWith('.sql'));
  if (files.length !== journal.entries.length) throw new Error('Drizzle journal/SQL file count mismatch');
  for (const [index, entry] of journal.entries.entries()) {
    if (entry.idx !== index || !files.includes(`${entry.tag}.sql`) || (index > 0 && entry.when <= journal.entries[index - 1].when)) throw new Error('Invalid Drizzle journal ordering');
    const path = `drizzle/migrations/${entry.tag}.sql`;
    entries.push({ id: `drizzle:${entry.tag}`, order: `${new Date(entry.when).toISOString().replace(/[-:T]/g, '').slice(0,14)}:1`, path, sha256: sha256(await readFile(path)) });
  }
  entries.sort((a,b) => a.order.localeCompare(b.order) || a.id.localeCompare(b.id));
  return { entries, quarantined };
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'inventory') {
    const { entries, quarantined } = await inventory();
    // Inventory is read-only; semantic overlap still requires a reviewed restore rehearsal.
    planReplay(entries, []);
    console.log(JSON.stringify({ version: 1, ordering: 'UTC timestamp, Supabase before Drizzle on ties', entries, quarantined }, null, 2));
  } else if (command === 'plan') {
    if (args.length !== 1) throw new Error('Usage: portability.mjs plan <applied-ledger.json>; never assume an empty live backend');
    const { entries, quarantined } = await inventory();
    const applied = await readJson(resolve(args[0]));
    console.log(JSON.stringify({ dryRun: true, executable: false, prerequisite: 'Reviewed full schema/Auth/Storage restore rehearsal; semantic overlap review required', quarantined, pending: planReplay(entries, applied) }, null, 2));
  } else if (command === 'snapshot') {
    if (args.length !== 1) throw new Error('Usage: portability.mjs snapshot <export-directory>');
    const root = resolve(args[0]);
    const manifest = await readJson(resolve(root, 'manifest.json'));
    const local = (file) => {
      if (typeof file !== 'string') throw new Error('Expected export-relative file path');
      const full = resolve(root, file), rel = relative(root, full);
      if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Export file escapes its directory');
      return full;
    };
    const tables = {};
    for (const [name, file] of Object.entries(manifest.tables ?? {})) {
      tables[name] = await readJson(local(file));
      if (!Array.isArray(tables[name])) throw new Error(`Expected full row array for ${name}`);
    }
    const media = [];
    for (const item of manifest.media ?? []) {
      const bytes = await readFile(local(item.file));
      media.push({ bucket: item.bucket, key: item.key, sha256: sha256(bytes), size: bytes.length });
    }
    console.log(JSON.stringify({ complete: manifest.complete === true, schemaSha256: sha256(await readFile(local(manifest.schema))), tables, media }, null, 2));
  } else if (command === 'reconcile') {
    if (args.length !== 2) throw new Error('Usage: portability.mjs reconcile <source.json> <restored.json>; full exports are required');
    const result = reconcile(await readJson(resolve(args[0])), await readJson(resolve(args[1])));
    console.log(JSON.stringify(result, null, 2));
    if (!result.ready) process.exitCode = 2;
  } else throw new Error('Commands: inventory | plan <applied-ledger.json> | snapshot <export-directory> | reconcile <source.json> <restored.json>');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
