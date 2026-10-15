import { createHash } from 'node:crypto';

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export function validatePublicEnv(env) {
  const out = { VITE_RUNTIME_MODE: 'standalone' };
  out.VITE_LINKMAX_UI_V2 = env.VITE_LINKMAX_UI_V2 === 'false' ? 'false' : 'true';
  for (const name of ['VITE_SUPABASE_URL', 'VITE_APP_DOMAIN']) {
    let url;
    try { url = new URL(env[name]); } catch { throw new Error(`${name} must be an absolute HTTP(S) origin`); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error(`${name} must be an HTTP(S) origin`);
    out[name] = url.origin;
  }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key || key.startsWith('sb_secret_')) throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must be a public key');
  if (key.split('.').length === 3) {
    let role;
    try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role; } catch { throw new Error('Invalid public JWT'); }
    if (role !== 'anon') throw new Error('Only an anon/public key may enter the browser');
  } else if (!key.startsWith('sb_publishable_')) throw new Error('Expected a Supabase public key');
  out.VITE_SUPABASE_PUBLISHABLE_KEY = key;
  out.VITE_ENABLE_REMOTE_TRANSLATIONS = env.VITE_ENABLE_REMOTE_TRANSLATIONS === 'true' ? 'true' : 'false';
  if (env.VITE_SUPABASE_PROJECT_ID) out.VITE_SUPABASE_PROJECT_ID = env.VITE_SUPABASE_PROJECT_ID;
  return out;
}

export function planReplay(entries, applied) {
  const ids = new Set(), hashes = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id) || hashes.has(entry.sha256)) throw new Error(`duplicate migration: ${entry.id}; resolve overlap explicitly`);
    ids.add(entry.id); hashes.add(entry.sha256);
  }
  const seen = new Set();
  for (const entry of applied) {
    if (seen.has(entry.id)) throw new Error(`duplicate applied entry: ${entry.id}`);
    seen.add(entry.id);
    const known = entries.find((item) => item.id === entry.id);
    if (!known || known.sha256 !== entry.sha256) throw new Error(`Unknown migration or checksum mismatch: ${entry.id}`);
  }
  // Applied history must be a prefix: filling gaps can replay dependent DDL unsafely.
  if (entries.slice(0, applied.length).some((entry) => !seen.has(entry.id))) throw new Error('Applied history is not an ordered prefix');
  return entries.filter((entry) => !seen.has(entry.id));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
const digest = (value) => sha256(JSON.stringify(stable(value)));
export function reconcile(source, target) {
  const blockers = [];
  for (const [name, snapshot] of [['source', source], ['target', target]]) {
    if (snapshot.complete !== true || !snapshot.tables || !Array.isArray(snapshot.tables['auth.users']) || !Array.isArray(snapshot.media) || !/^[a-f0-9]{64}$/.test(snapshot.schemaSha256 ?? '')) blockers.push(`${name}: full schema/data/Auth/Storage export missing`);
  }
  const tables = [];
  for (const name of new Set([...Object.keys(source.tables ?? {}), ...Object.keys(target.tables ?? {})])) {
    const a = source.tables?.[name], b = target.tables?.[name];
    if (!Array.isArray(a) || !Array.isArray(b)) { blockers.push(`table missing: ${name}`); continue; }
    const hashes = (rows) => rows.map(digest).sort();
    const matches = digest(hashes(a)) === digest(hashes(b));
    tables.push({ name, sourceCount: a.length, targetCount: b.length, matches });
    if (!matches) blockers.push(`rows/IDs/ownership/checksums differ: ${name}`);
  }
  for (const [name, snapshot] of [['source', source], ['target', target]]) {
    const seen = new Set();
    for (const item of snapshot.media ?? []) {
      const id = `${item.bucket}/${item.key}`;
      if (!item.bucket || !item.key || !/^[a-f0-9]{64}$/.test(item.sha256 ?? '') || !Number.isSafeInteger(item.size) || item.size < 0 || seen.has(id)) blockers.push(`${name}: invalid/duplicate media: ${id}`);
      seen.add(id);
    }
  }
  if (digest((source.media ?? []).map(stable).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))) !== digest((target.media ?? []).map(stable).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))))) blockers.push('Storage files/checksums differ');
  if (source.schemaSha256 !== target.schemaSha256) blockers.push('Schema checksums differ');
  return { dryRun: true, ready: blockers.length === 0, blockers, tables };
}
