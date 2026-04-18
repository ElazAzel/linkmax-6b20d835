#!/usr/bin/env node
import { execSync } from 'node:child_process';

const defaults = {
  anyMax: 808,
  consoleLogMax: 24,
};

const thresholds = {
  anyMax: Number(process.env.ANY_MAX ?? defaults.anyMax),
  consoleLogMax: Number(process.env.CONSOLE_LOG_MAX ?? defaults.consoleLogMax),
};

const countMatches = (command) => {
  try {
    const output = execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const parsed = Number(output);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

const metrics = {
  any: countMatches("rg -n '\\bany\\b' src --glob '*.{ts,tsx}' | wc -l"),
  consoleLog: countMatches("rg -n 'console\\.log\\(' src --glob '*.{ts,tsx}' | wc -l"),
};

console.log('Quality baseline check');
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
