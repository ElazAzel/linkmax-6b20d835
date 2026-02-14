import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const inputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../i18n/exports/locales.csv');

const languages = ['en', 'ru', 'kk'];
const interpolationPattern = /{{\s*([\w.]+)\s*}}/g;

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

function setNestedValue(obj, key, value) {
  const parts = key.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function parseCsv(content) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\n') {
        row.push(current);
        if (row.some((cell) => cell.length > 0)) {
          rows.push(row);
        }
        row = [];
        current = '';
      } else if (char === '\r') {
        // ignore
      } else {
        current += char;
      }
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function getPlaceholders(value) {
  if (typeof value !== 'string') return new Set();
  return new Set([...value.matchAll(interpolationPattern)].map((match) => match[1]));
}

const csvContent = await readFile(inputPath, 'utf-8');
const rows = parseCsv(csvContent);

if (rows.length === 0) {
  console.error('❌ Import failed: CSV is empty.');
  process.exit(1);
}

const header = rows[0].map((cell) => cell.trim());
const requiredColumns = ['key', 'en', 'ru', 'kk'];
const missingColumns = requiredColumns.filter((col) => !header.includes(col));
if (missingColumns.length > 0) {
  console.error(`❌ Import failed: missing columns ${missingColumns.join(', ')}.`);
  process.exit(1);
}

const columnIndex = Object.fromEntries(header.map((col, idx) => [col, idx]));
const records = rows.slice(1).map((row) => {
  const record = {
    key: row[columnIndex.key]?.trim() ?? '',
    en: row[columnIndex.en] ?? '',
    ru: row[columnIndex.ru] ?? '',
    kk: row[columnIndex.kk] ?? '',
  };
  return record;
}).filter((record) => record.key.length > 0);

const duplicateKeys = records
  .map((record) => record.key)
  .filter((key, index, arr) => arr.indexOf(key) !== index);
if (duplicateKeys.length > 0) {
  console.error(`❌ Import failed: duplicate keys in CSV: ${duplicateKeys.join(', ')}`);
  process.exit(1);
}

const locales = {};
for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const raw = await readFile(filePath, 'utf-8');
  locales[lang] = JSON.parse(raw);
}

const existingKeys = new Set();
for (const lang of languages) {
  collectKeys(locales[lang]).forEach((key) => existingKeys.add(key));
}

const csvKeys = new Set(records.map((record) => record.key));
const missingKeys = Array.from(existingKeys).filter((key) => !csvKeys.has(key));
const extraKeys = Array.from(csvKeys).filter((key) => !existingKeys.has(key));

if (missingKeys.length > 0 || extraKeys.length > 0) {
  if (missingKeys.length > 0) {
    console.error(`❌ Import failed: CSV is missing ${missingKeys.length} keys.`);
  }
  if (extraKeys.length > 0) {
    console.error(`❌ Import failed: CSV has ${extraKeys.length} unknown keys.`);
  }
  process.exit(1);
}

const translationMap = new Map(records.map((record) => [record.key, record]));
let hasPlaceholderIssues = false;

for (const key of existingKeys) {
  const record = translationMap.get(key);
  const baseValue = record.en;
  const basePlaceholders = getPlaceholders(baseValue);

  for (const lang of languages) {
    const value = record[lang];
    const placeholders = getPlaceholders(value);
    const missing = Array.from(basePlaceholders).filter((p) => !placeholders.has(p));
    const extra = Array.from(placeholders).filter((p) => !basePlaceholders.has(p));
    if (missing.length > 0 || extra.length > 0) {
      hasPlaceholderIssues = true;
      console.error(`❌ Placeholder mismatch for key "${key}" in ${lang}:`);
      if (missing.length > 0) {
        console.error(`   Missing: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.error(`   Extra: ${extra.join(', ')}`);
      }
    }
  }
}

if (hasPlaceholderIssues) {
  process.exit(1);
}

for (const lang of languages) {
  for (const record of records) {
    setNestedValue(locales[lang], record.key, record[lang]);
  }
  const filePath = path.join(localesDir, `${lang}.json`);
  await writeFile(filePath, `${JSON.stringify(locales[lang], null, 2)}\n`, 'utf-8');
}

console.log(`✅ i18n import completed from ${path.relative(path.resolve(__dirname, '..'), inputPath)}`);
