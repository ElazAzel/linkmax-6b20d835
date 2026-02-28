#!/usr/bin/env node
/**
 * Check all locale files for empty strings and report counts.
 * Run after translations. Use npm run i18n:fill to fill empty keys from en.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const SOURCE = 'en.json';

function countEmpty(obj, prefix = '') {
  let empty = 0;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      empty += countEmpty(v, key);
    } else if (v === '' || (typeof v === 'string' && v.trim() === '')) {
      empty++;
    }
  }
  return empty;
}

function main() {
  const locales = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json') && !f.includes('fragment'));
  console.log('Locale coverage (empty string count). Run npm run i18n:fill to copy from en.json for empty keys.\n');

  for (const file of locales.sort()) {
    const filePath = path.join(LOCALES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const empty = countEmpty(data);
    const lang = file.replace('.json', '');
    const status = empty === 0 ? '✓' : empty;
    console.log(`  ${lang.padEnd(6)} ${String(status).padStart(5)} empty`);
  }

  console.log('\nTo fill all empty keys with English: npm run i18n:fill');
}

main();
