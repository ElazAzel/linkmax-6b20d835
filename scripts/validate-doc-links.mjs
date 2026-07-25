#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';

const markdownFiles = [
  'README.md',
  'docs/README.md',
  'docs/DOCUMENTATION_GOVERNANCE.md',
  'docs/PLATFORM_SNAPSHOT.md',
  'docs/getting-started/DEVELOPER-QUICKSTART.md',
  'docs/deployment/GITHUB_ACTIONS_SETUP.md',
  'docs/deployment/runbooks/LOCAL_DEVELOPMENT.md',
  'docs/security/SECURITY.md',
  'docs/testing/TESTING.md',
  'docs/seo/CLOUDFLARE_WORKER_DEPLOY.md',
  'docs/operations/ai-agent-rules.md',
  'docs/roadmap/POST_AUDIT_EXECUTION_PLAN_2026-07.md',
  'docs/audits/README.md',
  '.agent/README.md',
].filter(existsSync);

const markdownLink = /(?<!!)\[[^\]]*\]\((?<target>[^)\s]+)(?:\s+[^)]*)?\)/g;
const missing = [];

for (const file of markdownFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(markdownLink)) {
    const raw = match.groups?.target?.replace(/^<|>$/g, '');
    if (!raw || raw.startsWith('#') || /^(https?:|mailto:|tel:|data:)/i.test(raw)) continue;
    const target = raw.split('#', 1)[0];
    if (!target || extname(target).match(/^\.(png|jpe?g|gif|svg|webp)$/i)) continue;
    if (!existsSync(resolve(dirname(file), target))) missing.push(`${file} -> ${raw}`);
  }
}

if (missing.length) {
  console.error('Broken local Markdown links:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Validated ${markdownFiles.length} Markdown files: no broken local links.`);
