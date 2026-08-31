import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = resolve('scripts/eslint-warning-ratchet.mjs');

function runRatchet(report, maxWarnings) {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'lnkmx-eslint-ratchet-'));
  const inputPath = join(fixtureDir, 'eslint-results.json');
  writeFileSync(inputPath, JSON.stringify(report), 'utf8');

  try {
    return spawnSync(
      process.execPath,
      [scriptPath, '--input', inputPath, '--max-warnings', String(maxWarnings)],
      { encoding: 'utf8' },
    );
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
}

function runRatchetWithBaseline(report, baseline) {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'lnkmx-eslint-ratchet-'));
  const inputPath = join(fixtureDir, 'eslint-results.json');
  const baselinePath = join(fixtureDir, 'quality-baseline.json');
  writeFileSync(inputPath, JSON.stringify(report), 'utf8');
  writeFileSync(baselinePath, JSON.stringify(baseline), 'utf8');

  try {
    return spawnSync(
      process.execPath,
      [scriptPath, '--input', inputPath, '--baseline', baselinePath],
      { encoding: 'utf8' },
    );
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
}

test('fails whenever ESLint reports an error', () => {
  const result = runRatchet(
    [{ filePath: 'broken.ts', errorCount: 1, warningCount: 2, messages: [] }],
    2,
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /1 ESLint error/i);
});

test('fails when warnings exceed the committed ceiling', () => {
  const result = runRatchet(
    [{ filePath: 'warning.ts', errorCount: 0, warningCount: 3, messages: [] }],
    2,
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /3 warnings exceeds maximum 2/i);
});

test('passes at the warning ceiling with no errors', () => {
  const result = runRatchet(
    [
      { filePath: 'one.ts', errorCount: 0, warningCount: 1, messages: [] },
      { filePath: 'two.ts', errorCount: 0, warningCount: 1, messages: [] },
    ],
    2,
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 errors, 2 warnings/i);
});

test('loads the committed warning ceiling from a quality baseline', () => {
  const result = runRatchetWithBaseline(
    [{ filePath: 'warning.ts', errorCount: 0, warningCount: 2, messages: [] }],
    { eslintWarningsMax: 1 },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /2 warnings exceeds maximum 1/i);
});
