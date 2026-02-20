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
            keys[newPrefix] = obj[key];
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

function sync() {
    const sourcePath = path.join(LOCALES_DIR, SOURCE_LOCALE);
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const sourceKeys = getFlatKeys(sourceData);

    for (const target of TARGET_LOCALES) {
        const targetPath = path.join(LOCALES_DIR, target);
        let targetData = {};
        if (fs.existsSync(targetPath)) {
            targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        }

        const targetKeys = getFlatKeys(targetData);
        const resultData = {};

        // Ensure all source keys exist in target
        for (const key in sourceKeys) {
            if (targetKeys[key] !== undefined && targetKeys[key] !== "") {
                setNestedKey(resultData, key, targetKeys[key]);
            } else {
                // Missing or empty in target - placeholder
                // For EN, we might want to try to use extracted values if we pass them in
                setNestedKey(resultData, key, "");
            }
        }

        fs.writeFileSync(targetPath, JSON.stringify(resultData, null, 2), 'utf8');
        console.log(`Synced ${target} with ${SOURCE_LOCALE}. Check for empty values.`);
    }
}

sync();
