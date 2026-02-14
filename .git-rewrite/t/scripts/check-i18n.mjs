import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const languages = ['ru', 'en', 'kk', 'de', 'uk', 'uz', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'];

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

const locales = {};
for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const raw = await readFile(filePath, 'utf-8');
  try {
    locales[lang] = JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Failed to parse ${lang}.json:`, error);
    process.exit(1);
  }
}

const baseLanguage = 'en';
const langKeys = {};
const langValues = {};
for (const lang of languages) {
  const keys = collectKeys(locales[lang]);
  langKeys[lang] = new Set(keys);
  langValues[lang] = keys.reduce((acc, key) => {
    const value = key.split('.').reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), locales[lang]);
    acc[key] = value;
    return acc;
  }, {});
}

const baseKeys = langKeys[baseLanguage];
if (!baseKeys) {
  console.error(`❌ Base language "${baseLanguage}" not found in locales.`);
  process.exit(1);
}

let hasIssues = false;

for (const lang of languages) {
  const missing = Array.from(baseKeys).filter((key) => !langKeys[lang].has(key));
  const extra = Array.from(langKeys[lang]).filter((key) => !baseKeys.has(key));
  if (missing.length > 0) {
    hasIssues = true;
    console.error(`\nMissing ${missing.length} keys in ${lang}.json:`);
    missing.forEach((key) => console.error(`  - ${key}`));
  }
  if (extra.length > 0) {
    hasIssues = true;
    console.error(`\nExtra ${extra.length} keys in ${lang}.json:`);
    extra.forEach((key) => console.error(`  - ${key}`));
  }
}

const placeholderPattern = /^\[[A-Z]{2}\]/;
const suspiciousPattern = /(TODO|TBD|PLACEHOLDER)/i;
const interpolationPattern = /{{\s*([\w.]+)\s*}}/g;

for (const lang of languages) {
  const values = langValues[lang];
  const emptyKeys = [];
  const suspiciousKeys = [];
  Object.entries(values).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    if (value.trim().length === 0) emptyKeys.push(key);
    if (placeholderPattern.test(value) || suspiciousPattern.test(value)) suspiciousKeys.push(key);
  });
  if (emptyKeys.length > 0) {
    hasIssues = true;
    console.error(`\nEmpty translations in ${lang}.json (${emptyKeys.length}):`);
    emptyKeys.forEach((key) => console.error(`  - ${key}`));
  }
  if (suspiciousKeys.length > 0) {
    hasIssues = true;
    console.error(`\nSuspicious placeholders in ${lang}.json (${suspiciousKeys.length}):`);
    suspiciousKeys.forEach((key) => console.error(`  - ${key}`));
  }
}

const baseValues = langValues[baseLanguage];
Object.keys(baseValues).forEach((key) => {
  const baseValue = baseValues[key];
  if (typeof baseValue !== 'string') return;
  const basePlaceholders = new Set([...baseValue.matchAll(interpolationPattern)].map((match) => match[1]));
  languages.forEach((lang) => {
    const value = langValues[lang][key];
    if (typeof value !== 'string') return;
    const placeholders = new Set([...value.matchAll(interpolationPattern)].map((match) => match[1]));
    const missingPlaceholders = Array.from(basePlaceholders).filter((placeholder) => !placeholders.has(placeholder));
    const extraPlaceholders = Array.from(placeholders).filter((placeholder) => !basePlaceholders.has(placeholder));
    if (missingPlaceholders.length > 0 || extraPlaceholders.length > 0) {
      hasIssues = true;
      console.error(`\nInterpolation mismatch for key "${key}" in ${lang}.json:`);
      if (missingPlaceholders.length > 0) {
        console.error(`  Missing placeholders: ${missingPlaceholders.join(', ')}`);
      }
      if (extraPlaceholders.length > 0) {
        console.error(`  Extra placeholders: ${extraPlaceholders.join(', ')}`);
      }
    }
  });
});

if (hasIssues) {
  console.error('\n❌ i18n check failed: issues detected.');
  process.exit(1);
} else {
  console.log('✅ i18n check passed: all locale keys are aligned and valid.');
}
