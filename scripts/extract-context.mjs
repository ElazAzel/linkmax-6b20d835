import fs from 'node:fs';
import path from 'node:path';

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

const files = walk('src');
const extractedData = {};
// Patterns for t('key') or t('key', 'default') or t('key', { defaultValue: '...' })
const patterns = [
    /t\(['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g,
    /t\(['"]([^'"]+)['"]\s*,\s*\{\s*defaultValue:\s*['"]([^'"]+)['"]/g
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

            if (!extractedData[key] || (!extractedData[key].value && defaultValue)) {
                extractedData[key] = {
                    value: defaultValue,
                    file: f
                };
            }
        }
    }
}

// Load current RU keys to filter
function getFlatKeys(obj, prefix = '') {
    const keys = {};
    for (const k in obj) {
        const p = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(keys, getFlatKeys(obj[k], p));
        } else {
            keys[p] = obj[k];
        }
    }
    return keys;
}

const ru = JSON.parse(fs.readFileSync('src/i18n/locales/ru.json', 'utf8'));
const ruFlatKeys = getFlatKeys(ru);

const missingFromRu = {};
for (const [key, data] of Object.entries(extractedData)) {
    if (ruFlatKeys[key] === undefined) {
        missingFromRu[key] = data;
    }
}

fs.writeFileSync('i18n_extracted_missing.json', JSON.stringify(missingFromRu, null, 2));
console.log(`Extracted ${Object.keys(extractedData).length} total keys from code.`);
console.log(`Found ${Object.keys(missingFromRu).length} keys missing from ru.json.`);
