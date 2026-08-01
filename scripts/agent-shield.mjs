#!/usr/bin/env node
/**
 * agent-shield.mjs — lightweight static safety scan (ECC AgentShield inspired).
 *
 * Catches the classes of mistakes an AI agent is most likely to introduce in
 * this codebase. Advisory by default; pass --strict to fail the process.
 *
 * Usage: node scripts/agent-shield.mjs [--strict]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const SCAN_DIRS = ['src', 'supabase/functions'];
const SKIP = new Set(['node_modules', 'dist', '.git', 'coverage', '__tests__']);

const RULES = [
  {
    id: 'service-role-in-client',
    severity: 'critical',
    appliesTo: (f) => f.startsWith('src/'),
    test: /SUPABASE_SERVICE_ROLE_KEY|service_role_key/,
    message: 'service role key referenced in frontend code',
  },
  {
    id: 'hardcoded-secret',
    severity: 'critical',
    appliesTo: (f) => f.startsWith('src/'),
    test: /(sk_live_|sk_test_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{30,})/,
    message: 'looks like a hardcoded third-party secret',
  },
  {
    id: 'raw-sql-execution',
    severity: 'critical',
    appliesTo: () => true,
    test: /rpc\(\s*['"]execute_sql['"]/,
    message: 'arbitrary SQL execution via rpc(execute_sql)',
  },
  {
    id: 'edge-function-path-call',
    severity: 'high',
    appliesTo: (f) => f.startsWith('src/'),
    test: /fetch\(\s*['"`]\/api\/[a-z-]+/,
    message: 'edge function called by path instead of functions.invoke()',
  },
  {
    id: 'missing-cors-in-edge-function',
    severity: 'high',
    appliesTo: (f) => f.startsWith('supabase/functions/') && f.endsWith('index.ts'),
    test: (src) => !/Access-Control-Allow-Origin|corsHeaders/.test(src),
    message: 'edge function without CORS headers',
  },
  {
    id: 'unbounded-fetch-in-edge-function',
    severity: 'low',
    appliesTo: (f) => f.startsWith('supabase/functions/') && f.endsWith('index.ts'),
    test: (src) => /await fetch\(/.test(src) && !/AbortController|AbortSignal/.test(src),
    message: 'outbound fetch without a timeout / AbortController',
  },
  {
    id: 'hardcoded-color-utility',
    severity: 'low',
    appliesTo: (f) => f.startsWith('src/') && /\.tsx$/.test(f),
    test: /className="[^"]*\bbg-\[#[0-9a-fA-F]{3,8}\]/,
    message: 'hardcoded hex background bypasses design tokens',
  },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const findings = [];
for (const dir of SCAN_DIRS) {
  const abs = join(root, dir);
  let files = [];
  try {
    files = walk(abs);
  } catch {
    continue;
  }
  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, '/');
    const src = readFileSync(file, 'utf8');
    for (const rule of RULES) {
      if (!rule.appliesTo(rel)) continue;
      const hit = typeof rule.test === 'function' ? rule.test(src) : rule.test.test(src);
      if (hit) findings.push({ rule: rule.id, severity: rule.severity, file: rel, message: rule.message });
    }
  }
}

const bySeverity = (s) => findings.filter((f) => f.severity === s);
const order = ['critical', 'high', 'medium', 'low'];

if (findings.length === 0) {
  console.log('[agent-shield] clean — no risky patterns found.');
  process.exit(0);
}

console.log(`\n[agent-shield] ${findings.length} finding(s):`);
for (const sev of order) {
  for (const f of bySeverity(sev)) {
    console.log(`  ${sev.toUpperCase().padEnd(8)} ${f.rule} — ${f.file}: ${f.message}`);
  }
}

const blocking = bySeverity('critical').length + bySeverity('high').length;
if (strict && blocking > 0) {
  console.error(`\n[agent-shield] failing: ${blocking} critical/high finding(s).`);
  process.exit(1);
}
