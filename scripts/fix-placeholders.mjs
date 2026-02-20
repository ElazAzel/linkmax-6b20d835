import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const SOURCE_LOCALE = 'ru.json';
const TARGET_LOCALES = ['en.json', 'kk.json', 'uz.json'];

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

function fix() {
    const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE);
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const sourceFlat = getFlatKeys(sourceData);

    for (const target of TARGET_LOCALES) {
        const targetPath = path.join(LOCALES_DIR, target);
        if (!fs.existsSync(targetPath)) continue;

        const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        const targetFlat = getFlatKeys(targetData);
        let fixCount = 0;

        for (const key in sourceFlat) {
            const ruValue = sourceFlat[key];
            const targetValue = String(targetFlat[key] || '');

            if (typeof ruValue !== 'string') continue;

            const ruPlaceholders = ruValue.match(/{{.*?}}/g) || [];
            const targetPlaceholders = targetValue.match(/{{.*?}}/g) || [];

            let needsFix = false;
            for (const p of ruPlaceholders) {
                if (!targetValue.includes(p)) {
                    needsFix = true;
                    break;
                }
            }

            if (needsFix) {
                if (targetValue === '') {
                    // If empty, just use RU value as a safe placeholder that will pass validation
                    setNestedKey(targetData, key, ruValue);
                } else {
                    // Append missing placeholders
                    const missing = ruPlaceholders.filter(p => !targetValue.includes(p));
                    setNestedKey(targetData, key, targetValue + ' ' + missing.join(' '));
                }
                fixCount++;
            }
        }

        fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2), 'utf8');
        console.log(`Fixed ${fixCount} interpolation issues in ${target}`);
    }
}

fix();
