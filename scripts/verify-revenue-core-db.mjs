#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const steps = [
  {
    label: 'Check Docker Linux engine',
    command: 'docker',
    args: ['info'],
    hint: 'Install/enable WSL2 and start Docker Desktop before retrying.',
  },
  {
    label: 'Start local Supabase services',
    command: npxCommand,
    args: ['--yes', 'supabase', 'start'],
  },
  {
    label: 'Rebuild database from committed migrations',
    command: npxCommand,
    args: ['--yes', 'supabase', 'db', 'reset', '--local'],
  },
  {
    label: 'Run the complete pgTAP suite',
    command: npxCommand,
    args: ['--yes', 'supabase', 'test', 'db', '--local', 'supabase/tests'],
  },
  {
    label: 'Lint the rebuilt public schema',
    command: npxCommand,
    args: [
      '--yes', 'supabase', 'db', 'lint', '--local', '--schema', 'public',
      '--level', 'warning', '--fail-on', 'error',
    ],
  },
];

function printable(command, args) {
  return [command, ...args].map((part) => (
    /\s/.test(part) ? JSON.stringify(part) : part
  )).join(' ');
}

if (dryRun) {
  console.log('Revenue Core database verification plan:');
  for (const [index, step] of steps.entries()) {
    console.log(`${index + 1}. ${step.label}`);
    console.log(`   ${printable(step.command, step.args)}`);
  }
  process.exit(0);
}

for (const [index, step] of steps.entries()) {
  console.log(`\n[${index + 1}/${steps.length}] ${step.label}`);
  const result = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`Unable to start: ${printable(step.command, step.args)}`);
    console.error(result.error.message);
    if (step.hint) console.error(step.hint);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Step failed with exit code ${result.status ?? 'unknown'}.`);
    if (step.hint) console.error(step.hint);
    process.exit(result.status ?? 1);
  }
}

console.log('\nRevenue Core database verification passed.');
