import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const sourceDir = path.resolve(__dirname, '../src');
const outputPath = path.resolve(__dirname, '../i18n/exports/locales.csv');
const languages = ['en', 'ru', 'kk'];

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part];
    }
    return undefined;
  }, obj);
}

function csvEscape(value) {
  const stringValue = value ?? '';
  const needsQuotes = /[",\n]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

async function getSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }
      files.push(...await getSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function buildUsageMap() {
  const files = await getSourceFiles(sourceDir);
  const usageMap = new Map();
  const tRegex = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
  const i18nKeyRegex = /i18nKey\s*=\s*['"`]([^'"`]+)['"`]/g;

  await Promise.all(files.map(async (file) => {
    const content = await readFile(file, 'utf-8');
    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const key = match[1];
      if (!usageMap.has(key)) {
        usageMap.set(key, file);
      }
    }
    while ((match = i18nKeyRegex.exec(content)) !== null) {
      const key = match[1];
      if (!usageMap.has(key)) {
        usageMap.set(key, file);
      }
    }
  }));

  return usageMap;
}

const locales = {};
for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const raw = await readFile(filePath, 'utf-8');
  locales[lang] = JSON.parse(raw);
}

const keySet = new Set();
for (const lang of languages) {
  collectKeys(locales[lang]).forEach((key) => keySet.add(key));
}

const usageMap = await buildUsageMap();
const keys = Array.from(keySet).sort();
const rows = [];
rows.push(['key', 'namespace', 'en', 'ru', 'kk', 'usage'].map(csvEscape).join(','));

for (const key of keys) {
  const namespace = key.includes('.') ? key.split('.')[0] : 'common';
  const row = [
    key,
    namespace,
    String(getNestedValue(locales.en, key) ?? ''),
    String(getNestedValue(locales.ru, key) ?? ''),
    String(getNestedValue(locales.kk, key) ?? ''),
    usageMap.has(key) ? path.relative(path.resolve(__dirname, '..'), usageMap.get(key)) : '',
  ];
  rows.push(row.map(csvEscape).join(','));
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${rows.join('\n')}\n`, 'utf-8');
console.log(`✅ i18n export completed: ${path.relative(path.resolve(__dirname, '..'), outputPath)}`);
