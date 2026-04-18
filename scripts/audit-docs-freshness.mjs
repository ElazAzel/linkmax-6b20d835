#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const opts = {
  days: 60,
  since: null,
  scope: '.',
};

for (const arg of args) {
  if (arg.startsWith('--days=')) {
    opts.days = Number(arg.split('=')[1]);
  } else if (arg.startsWith('--since=')) {
    opts.since = arg.split('=')[1];
  } else if (arg.startsWith('--scope=')) {
    opts.scope = arg.split('=')[1];
  }
}

const now = opts.since ? new Date(`${opts.since}T00:00:00Z`) : new Date();
if (Number.isNaN(now.getTime())) {
  console.error(`Invalid --since value: ${opts.since}`);
  process.exit(1);
}
if (!Number.isFinite(opts.days) || opts.days < 1) {
  console.error(`Invalid --days value: ${opts.days}`);
  process.exit(1);
}

const cutoffMs = now.getTime() - opts.days * 24 * 60 * 60 * 1000;
const cutoff = new Date(cutoffMs);
const cutoffIso = cutoff.toISOString().slice(0, 10);

const fileListRaw = execFileSync('rg', ['--files', '-g', '*.md', '-g', '*.MD', opts.scope], { encoding: 'utf8' });
const files = fileListRaw
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean)
  .filter((item) => !item.includes('node_modules/'))
  .sort((a, b) => a.localeCompare(b));

const rows = [];
for (const file of files) {
  const normalized = file.replace(/^\.\//, '');
  let lastCommitDate = null;
  let shortSha = '-';

  try {
    const dateRaw = execFileSync('git', ['log', '-1', '--format=%cs', '--', normalized], { encoding: 'utf8' }).trim();
    if (dateRaw) {
      lastCommitDate = new Date(`${dateRaw}T00:00:00Z`);
    }
    shortSha = execFileSync('git', ['log', '-1', '--format=%h', '--', normalized], { encoding: 'utf8' }).trim() || '-';
  } catch {
    // ignore untracked files
  }

  if (!lastCommitDate || Number.isNaN(lastCommitDate.getTime())) {
    continue;
  }

  const ageDays = Math.floor((now.getTime() - lastCommitDate.getTime()) / (24 * 60 * 60 * 1000));
  rows.push({
    file: normalized,
    date: lastCommitDate.toISOString().slice(0, 10),
    ageDays,
    stale: lastCommitDate.getTime() < cutoffMs,
    sha: shortSha,
  });
}

const stale = rows.filter((item) => item.stale);
const fresh = rows.filter((item) => !item.stale);


console.log(`# Docs Freshness Audit`);
console.log(`- Reference date: ${now.toISOString().slice(0, 10)}`);
console.log(`- Freshness window: ${opts.days} days`);
console.log(`- Cutoff date: ${cutoffIso}`);
console.log(`- Scope: ${path.normalize(opts.scope)}`);
console.log(`- Markdown files scanned: ${rows.length}`);
console.log(`- Fresh files: ${fresh.length}`);
console.log(`- Stale files: ${stale.length}`);
console.log('');

console.log('## Stale files (older than freshness window)');
if (stale.length === 0) {
  console.log('- ✅ No stale documentation files found.');
} else {
  console.log(`| Last Commit | Age (days) | File | Commit |`);
  console.log(`|---|---:|---|---|`);
  for (const item of stale.sort((a, b) => b.ageDays - a.ageDays)) {
    console.log(`| ${item.date} | ${item.ageDays} | ${item.file} | ${item.sha} |`);
  }
}

console.log('');
console.log('## Freshness distribution');
const buckets = [
  { label: '0-7 days', min: 0, max: 7 },
  { label: '8-30 days', min: 8, max: 30 },
  { label: '31-60 days', min: 31, max: 60 },
  { label: '61+ days', min: 61, max: Infinity },
];
console.log('| Bucket | Count |');
console.log('|---|---:|');
for (const bucket of buckets) {
  const count = rows.filter((item) => item.ageDays >= bucket.min && item.ageDays <= bucket.max).length;
  console.log(`| ${bucket.label} | ${count} |`);
}

process.exit(stale.length > 0 ? 2 : 0);
