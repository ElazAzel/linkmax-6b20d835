#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BASELINE_PATH = 'config/quality-baseline.json';

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const maxHardcoded = Number(process.env.I18N_HARDCODED_MAX ?? baseline.i18nHardcodedMax);

if (!Number.isFinite(maxHardcoded)) {
  throw new Error(`Invalid i18nHardcodedMax in ${BASELINE_PATH}`);
}

const result = spawnSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '.', '--quiet', '--format', 'json'], {
  encoding: 'utf8',
  env: { ...process.env, LINT_I18N: 'true' },
  maxBuffer: 1024 * 1024 * 64,
});

if (result.error) {
  throw result.error;
}

let reports;
try {
  reports = JSON.parse(result.stdout || '[]');
} catch (error) {
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  throw error;
}

const messages = reports.flatMap((report) => report.messages || []);
const hardcodedMessages = messages.filter((message) => message.ruleId === 'i18n/no-literal-string');
const otherErrors = messages.filter((message) => message.severity === 2 && message.ruleId !== 'i18n/no-literal-string');

console.log('i18n literal baseline check');
console.log(`- hardcoded UI strings: ${hardcodedMessages.length} (max: ${maxHardcoded})`);

if (otherErrors.length > 0) {
  console.error('\nNon-i18n ESLint errors found while running i18n gate:');
  for (const message of otherErrors.slice(0, 20)) {
    console.error(`  - ${message.ruleId ?? 'eslint'}: ${message.message}`);
  }
  if (otherErrors.length > 20) {
    console.error(`  - ${otherErrors.length - 20} more errors omitted`);
  }
  process.exit(1);
}

if (hardcodedMessages.length > maxHardcoded) {
  console.error('\ni18n literal baseline failed:');
  console.error(`  - hardcoded UI strings increased: ${hardcodedMessages.length} > ${maxHardcoded}`);
  process.exit(1);
}

console.log('\ni18n literal baseline passed.');
