import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const QUEUE_FILE = path.resolve(__dirname, '../i18n-queue.json');
const BASE_LANG = 'ru';
const ALL_LANGS = ['ru', 'en', 'kk', 'uz', 'de', 'uk', 'be', 'es', 'fr', 'it', 'pt', 'zh', 'tr', 'ja', 'ko', 'ar'];
const TARGET_LANGS = ['en', 'kk', 'uz']; // Primary targets for sync and auto-translation

function getFlatKeys(obj, prefix = '') {
    let keys = {};
    for (const key in obj) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            Object.assign(keys, getFlatKeys(obj[key], newPrefix));
        } else {
            keys[newPrefix] = obj[key] || '';
        }
    }
    return keys;
}

function setNestedKey(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    }
    current[parts[parts.length - 1]] = value;
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (['node_modules', '.git', 'dist', '.agent'].includes(file)) continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(filePath);
        }
    }
    return results;
}

function extractFromCode() {
    console.log('🔍 Scanning code for t() keys...');
    const files = walk(path.resolve(__dirname, '../src'));
    const extracted = {};
    const patterns = [
        /\bt\(['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g,
        /\bt\(['"]([^'"]+)['"]\s*,\s*\{\s*defaultValue:\s*['"]([^'"]+)['"]/g
    ];

    for (const f of files) {
        const content = fs.readFileSync(f, 'utf8');
        for (const pattern of patterns) {
            let match;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                const key = match[1];
                const defaultValue = match[2] || '';
                if (!key.includes('.') || key.startsWith('{{') || key.includes('${')) continue;
                if (!extracted[key] || (!extracted[key].value && defaultValue)) {
                    extracted[key] = { value: defaultValue, file: f };
                }
            }
        }
    }
    return extracted;
}

function loadLocales() {
    const locales = {};
    for (const lang of ALL_LANGS) {
        const p = path.join(LOCALES_DIR, `${lang}.json`);
        if (fs.existsSync(p)) {
            locales[lang] = JSON.parse(fs.readFileSync(p, 'utf8'));
        } else {
            locales[lang] = {};
        }
    }
    return locales;
}

function sync() {
    console.log(`🔄 Syncing all locales with ${BASE_LANG}.json...`);
    const locales = loadLocales();
    const baseFlat = getFlatKeys(locales[BASE_LANG]);
    const extracted = extractFromCode();

    // 1. Add missing extracted keys to base language first
    let addedToBase = 0;
    for (const [key, data] of Object.entries(extracted)) {
        if (baseFlat[key] === undefined) {
            setNestedKey(locales[BASE_LANG], key, data.value || key.split('.').pop());
            baseFlat[key] = data.value || key.split('.').pop();
            addedToBase++;
        }
    }
    if (addedToBase > 0) console.log(`✅ Added ${addedToBase} new keys from code to ${BASE_LANG}.json`);

    // 2. Sync all other languages to match base language structure
    for (const lang of ALL_LANGS) {
        if (lang === BASE_LANG) continue;
        const targetFlat = getFlatKeys(locales[lang]);
        const resultData = {};
        for (const key in baseFlat) {
            const value = targetFlat[key] || '';
            setNestedKey(resultData, key, value);
        }
        locales[lang] = resultData;
        fs.writeFileSync(path.join(LOCALES_DIR, `${lang}.json`), JSON.stringify(resultData, null, 2), 'utf8');
    }
    // Save updated base lang as well
    fs.writeFileSync(path.join(LOCALES_DIR, `${BASE_LANG}.json`), JSON.stringify(locales[BASE_LANG], null, 2), 'utf8');
    console.log('✅ Structure synchronized across all languages.');
}

function prepQueue() {
    sync(); // Run sync first
    console.log('📥 Preparing translation queue...');
    const locales = loadLocales();
    const baseFlat = getFlatKeys(locales[BASE_LANG]);
    const queue = {};

    for (const lang of TARGET_LANGS) {
        if (lang === BASE_LANG) continue;
        const langFlat = getFlatKeys(locales[lang]);
        for (const key in baseFlat) {
            const val = langFlat[key];
            if (!val || String(val).trim() === '') {
                if (!queue[key]) queue[key] = { source: baseFlat[key] };
                queue[key][lang] = ""; // Placeholder for translation
            }
        }
    }

    const count = Object.keys(queue).length;
    if (count > 0) {
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
        console.log(`📝 Created ${QUEUE_FILE} with ${count} keys to translate.`);
        console.log('🚀 SCENARIO: Now ask AI to translate i18n-queue.json.');
    } else {
        console.log('✨ All translations are up to date. Queue is empty.');
        if (fs.existsSync(QUEUE_FILE)) fs.unlinkSync(QUEUE_FILE);
    }
}

function mergeQueue() {
    if (!fs.existsSync(QUEUE_FILE)) {
        console.error('❌ Error: i18n-queue.json not found.');
        return;
    }
    console.log('📤 Merging translations from queue...');
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const locales = loadLocales();

    let mergeCount = 0;
    for (const [key, translations] of Object.entries(queue)) {
        for (const lang of TARGET_LANGS) {
            if (translations[lang] && translations[lang].trim() !== '') {
                setNestedKey(locales[lang], key, translations[lang]);
                mergeCount++;
            }
        }
    }

    for (const lang of TARGET_LANGS) {
        fs.writeFileSync(path.join(LOCALES_DIR, `${lang}.json`), JSON.stringify(locales[lang], null, 2), 'utf8');
    }

    console.log(`✅ Merged ${mergeCount} translations into locale files.`);
    // Run placeholder fix after merge just in case
    fixPlaceholders();
    fs.unlinkSync(QUEUE_FILE);
    console.log('🗑️ Removed translation queue file.');
}

function fixPlaceholders() {
    console.log('🩹 Checking and fixing interpolation placeholders...');
    const locales = loadLocales();
    const baseFlat = getFlatKeys(locales[BASE_LANG]);
    const interpolationPattern = /{{\s*([\w.]+)\s*}}/g;

    for (const lang of ALL_LANGS) {
        if (lang === BASE_LANG) continue;
        const langFlat = getFlatKeys(locales[lang]);
        let fixed = 0;

        for (const key in baseFlat) {
            if (typeof baseFlat[key] !== 'string') continue;
            const baseMatches = [...baseFlat[key].matchAll(interpolationPattern)].map(m => m[0]);
            if (baseMatches.length === 0) continue;

            const targetVal = String(langFlat[key] || '');
            const missing = baseMatches.filter(p => !targetVal.includes(p));

            if (missing.length > 0) {
                if (targetVal === '') {
                    setNestedKey(locales[lang], key, baseFlat[key]);
                } else {
                    setNestedKey(locales[lang], key, targetVal + ' ' + missing.join(' '));
                }
                fixed++;
            }
        }
        if (fixed > 0) {
            fs.writeFileSync(path.join(LOCALES_DIR, `${lang}.json`), JSON.stringify(locales[lang], null, 2), 'utf8');
            console.log(`   Fixed ${fixed} patterns in ${lang}.json`);
        }
    }
}

function status() {
    const locales = loadLocales();
    const baseFlat = getFlatKeys(locales[BASE_LANG]);
    console.log(`📊 i18n Status (Base: ${BASE_LANG}, Target: ${TARGET_LANGS.join(', ')})`);
    console.log(`Total Keys: ${Object.keys(baseFlat).length}`);

    for (const lang of TARGET_LANGS) {
        if (lang === BASE_LANG) continue;
        const langFlat = getFlatKeys(locales[lang]);
        const missingKeys = Object.keys(baseFlat).filter(k => !langFlat[k] || String(langFlat[k]).trim() === '');
        const missing = missingKeys.length;
        const color = missing > 0 ? '\x1b[31m' : '\x1b[32m';
        console.log(`${color}${lang.toUpperCase()}: ${missing} missing${missing > 0 ? ' (run prep)' : ''}\x1b[0m`);
        if (missing > 0 && missing < 10) {
            console.log('   Missing samples:', missingKeys.join(', '));
        } else if (missing >= 10) {
            console.log('   Missing keys found (first 10):', missingKeys.slice(0, 10).join(', '));
        }
    }
}

// CLI Logic
const arg = process.argv[2];
switch (arg) {
    case 'sync': sync(); break;
    case 'prep': prepQueue(); break;
    case 'merge': mergeQueue(); break;
    case 'fix': fixPlaceholders(); break;
    case 'status': status(); break;
    case 'check':
        // Reuse existing check logic or just run status+fix
        status();
        fixPlaceholders();
        break;
    default:
        console.log(`
Usage: node scripts/i18n-manager.mjs <command>
Commands:
  status - Show missing translations summary
  sync   - Align all structured JSON files with base language (and code)
  prep   - Create i18n-queue.json with keys needing translation
  merge  - Merge translated i18n-queue.json back to locales
  fix    - Fix interpolation placeholders missing in targets
  check  - Run status and placeholder checks
        `);
}
