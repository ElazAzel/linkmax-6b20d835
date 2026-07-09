#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BASELINE_PATH = 'config/quality-baseline.json';
const ISSUE_KEYS = [
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'types',
  'nsExports',
  'nsTypes',
  'classMembers',
  'enumMembers',
  'duplicates',
  'catalog',
];

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const maxIssues = Number(process.env.KNIP_ISSUES_MAX ?? baseline.knipIssuesMax);

if (!Number.isFinite(maxIssues)) {
  throw new Error(`Invalid knipIssuesMax in ${BASELINE_PATH}`);
}

const result = spawnSync(
  process.execPath,
  ['node_modules/knip/bin/knip.js', '--config', 'config/knip.config.ts', '--reporter', 'json', '--no-exit-code'],
  {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  process.exit(result.status ?? 1);
}

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch (error) {
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  throw error;
}

const countCollection = (value) => {
  if (!value) {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === 'object') {
    return Object.values(value).reduce((total, nestedValue) => total + countCollection(nestedValue), 0);
  }

  return 1;
};

const issues = Array.isArray(report.issues) ? report.issues : [];
const counts = {
  files: countCollection(report.files),
};

for (const key of ISSUE_KEYS) {
  counts[key] = issues.reduce((total, issue) => total + countCollection(issue[key]), 0);
}

const totalIssues = Object.values(counts).reduce((total, count) => total + count, 0);

console.log('Knip baseline check');
console.log(`- unused issues: ${totalIssues} (max: ${maxIssues})`);
console.log(
  `- files=${counts.files}, deps=${counts.dependencies + counts.devDependencies}, exports=${counts.exports}, types=${counts.types}, duplicates=${counts.duplicates}`,
);

if (totalIssues > maxIssues) {
  console.error('\nKnip baseline failed:');
  console.error(`  - unused issue count increased: ${totalIssues} > ${maxIssues}`);
  process.exit(1);
}

console.log('\nKnip baseline passed.');
