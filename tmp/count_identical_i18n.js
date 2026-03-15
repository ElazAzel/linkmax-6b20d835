
import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales';
const files = ['en.json', 'kk.json', 'uz.json'];
const ruPath = path.join(localesDir, 'ru.json');
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf8').replace(/^\uFEFF/, ''));

function compareObjects(source, target, results = { count: 0, identicalKeys: [] }, prefix = '') {
    for (const key in source) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (target[key]) {
                compareObjects(source[key], target[key], results, fullKey);
            }
        } else {
            if (target[key] === source[key]) {
                results.count++;
                results.identicalKeys.push(fullKey);
            }
        }
    }
}

files.forEach(file => {
    const filePath = path.join(localesDir, file);
    if (!fs.existsSync(filePath)) return;
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    const results = { count: 0, identicalKeys: [] };
    compareObjects(ruJson, json, results);
    console.log(`${file}: ${results.count} identical keys found.`);
});
