#!/usr/bin/env node
import { readFileSync } from 'node:fs';

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const inputPath = readOption('--input');
const maxWarningsRaw = readOption('--max-warnings');
const baselinePath = readOption('--baseline') ?? 'config/quality-baseline.json';
let maxWarnings = maxWarningsRaw === undefined ? undefined : Number(maxWarningsRaw);

if (maxWarnings === undefined) {
  try {
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
    maxWarnings = Number(baseline.eslintWarningsMax);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Unable to read ESLint warning baseline: ${reason}`);
    process.exit(2);
  }
}

if (!inputPath || !Number.isInteger(maxWarnings) || maxWarnings < 0) {
  console.error('Usage: eslint-warning-ratchet --input <eslint-json> [--max-warnings <integer> | --baseline <json>]');
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`Unable to read ESLint JSON report: ${reason}`);
  process.exit(2);
}

if (!Array.isArray(report)) {
  console.error('Invalid ESLint JSON report: expected an array');
  process.exit(2);
}

const totals = report.reduce(
  (result, file) => ({
    errors: result.errors + Number(file?.errorCount ?? 0),
    warnings: result.warnings + Number(file?.warningCount ?? 0),
  }),
  { errors: 0, warnings: 0 },
);

console.log(`ESLint ratchet: ${totals.errors} errors, ${totals.warnings} warnings (maximum ${maxWarnings})`);

let failed = false;
if (totals.errors > 0) {
  console.error(`${totals.errors} ESLint error${totals.errors === 1 ? '' : 's'} reported; errors are never allowed`);
  failed = true;
}
if (totals.warnings > maxWarnings) {
  console.error(`${totals.warnings} warnings exceeds maximum ${maxWarnings}`);
  failed = true;
}

if (failed) process.exit(1);
