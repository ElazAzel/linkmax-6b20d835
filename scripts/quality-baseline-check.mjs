#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BASELINE_PATH = 'config/quality-baseline.json';

const loadBaseline = () => {
  const raw = readFileSync(BASELINE_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Number.isFinite(parsed.anyMax) || !Number.isFinite(parsed.consoleLogMax)) {
    throw new Error(`Invalid baseline values in ${BASELINE_PATH}`);
  }

  return {
    anyMax: parsed.anyMax,
    consoleLogMax: parsed.consoleLogMax,
  };
};

const baseline = loadBaseline();

const thresholds = {
  anyMax: Number(process.env.ANY_MAX ?? baseline.anyMax),
  consoleLogMax: Number(process.env.CONSOLE_LOG_MAX ?? baseline.consoleLogMax),
};

const countMatches = (command) => {
  const output = execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  const parsed = Number(output);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Failed to parse numeric output for command: ${command}`);
  }

  return parsed;
};

const metrics = {
  any: countMatches("rg -n '\\bany\\b' src --glob '*.{ts,tsx}' | wc -l"),
  consoleLog: countMatches("rg -n 'console\\.log\\(' src --glob '*.{ts,tsx}' | wc -l"),
};

console.log('Quality baseline check');
console.log(`- baseline file: ${BASELINE_PATH}`);
console.log(`- any usages: ${metrics.any} (max: ${thresholds.anyMax})`);
console.log(`- console.log usages: ${metrics.consoleLog} (max: ${thresholds.consoleLogMax})`);

const violations = [];
if (metrics.any > thresholds.anyMax) {
  violations.push(`any usages increased: ${metrics.any} > ${thresholds.anyMax}`);
}
if (metrics.consoleLog > thresholds.consoleLogMax) {
  violations.push(`console.log usages increased: ${metrics.consoleLog} > ${thresholds.consoleLogMax}`);
}

if (violations.length > 0) {
  console.error('\nQuality baseline failed:');
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log('\nQuality baseline passed.');
