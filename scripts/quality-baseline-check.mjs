#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

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

const SOURCE_DIR = 'src';
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

const collectSourceFiles = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
};

const countMatchingLines = (pattern) => {
  let matches = 0;

  for (const filePath of collectSourceFiles(SOURCE_DIR)) {
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    matches += lines.filter((line) => pattern.test(line)).length;
  }

  return matches;
};

const metrics = {
  any: countMatchingLines(/\bany\b/),
  consoleLog: countMatchingLines(/console\.log\(/),
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
