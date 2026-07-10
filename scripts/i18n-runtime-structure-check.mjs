import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = path.join(rootDir, 'src', 'i18n', 'locales');
const languages = ['ru', 'en', 'kk', 'uz', 'de', 'uk', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'];
const requiredRuntimeKeys = [
  'auth.title',
  'common.cancel',
  'common.save',
  'common.search',
  'dashboard.nav.home',
  'landing.short.title',
  'landing.faq.q1',
  'zones.nav.deals',
];

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function flatten(value, prefix = '', output = {}) {
  for (const [key, nestedValue] of Object.entries(value || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(nestedValue)) {
      flatten(nestedValue, fullKey, output);
    } else {
      output[fullKey] = nestedValue;
    }
  }
  return output;
}

const localeData = Object.fromEntries(
  languages.map((language) => {
    const file = path.join(localesDir, `${language}.json`);
    return [language, JSON.parse(fs.readFileSync(file, 'utf8'))];
  }),
);

const baseKeys = Object.keys(flatten(localeData.ru)).sort();
const baseKeySet = new Set(baseKeys);
const failures = [];

for (const language of languages) {
  const data = localeData[language];
  const flattened = flatten(data);
  const keys = Object.keys(flattened);
  const missing = baseKeys.filter((key) => !(key in flattened));
  const extra = keys.filter((key) => !baseKeySet.has(key));
  const corrupted = keys.filter((key) => {
    const value = flattened[key];
    return typeof value === 'string' && (value.includes('\uFFFD') || /\?{3,}/.test(value));
  });
  const missingRequired = requiredRuntimeKeys.filter((key) => !(key in flattened));
  const alternativesSize = Object.keys(flatten(data.alternatives || {})).length;

  if (data.translation !== undefined) {
    failures.push(`${language}: legacy translation wrapper is still present`);
  }
  if (alternativesSize > 200) {
    failures.push(`${language}: alternatives namespace contains ${alternativesSize} values`);
  }
  if (missing.length > 0) {
    failures.push(`${language}: ${missing.length} keys missing (${missing.slice(0, 5).join(', ')})`);
  }
  if (extra.length > 0) {
    failures.push(`${language}: ${extra.length} extra keys (${extra.slice(0, 5).join(', ')})`);
  }
  if (missingRequired.length > 0) {
    failures.push(`${language}: runtime keys missing (${missingRequired.join(', ')})`);
  }
  if (corrupted.length > 0) {
    failures.push(`${language}: corrupted values detected (${corrupted.slice(0, 5).join(', ')})`);
  }
}

if (failures.length > 0) {
  console.error('i18n runtime structure check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`i18n runtime structure check passed: ${languages.length} locales, ${baseKeys.length} keys each`);
