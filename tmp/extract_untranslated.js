
import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales';
const files = ['en.json', 'kk.json', 'uz.json'];
const ruPath = path.join(localesDir, 'ru.json');
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf8').replace(/^\uFEFF/, ''));

function getIdenticalKeys(source, target, results = {}, prefix = '') {
    for (const key in source) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (target[key]) {
                getIdenticalKeys(source[key], target[key], results, fullKey);
            }
        } else {
            if (target[key] === source[key] && source[key] !== "" && source[key] !== null) {
                // Skip common technical keys like "5 MB", or numbers if any
                if (source[key].length > 1 && !/^\d+$/.test(source[key])) {
                    results[fullKey] = source[key];
                }
            }
        }
    }
    return results;
}

files.forEach(file => {
    const filePath = path.join(localesDir, file);
    if (!fs.existsSync(filePath)) return;
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    const identical = getIdenticalKeys(ruJson, json);
    
    const outputPath = path.join('c:/Users/i.azelkhanov/Documents/inkmax/tmp', `untranslated_${file}`);
    fs.writeFileSync(outputPath, JSON.stringify(identical, null, 2), 'utf8');
    console.log(`Saved ${Object.keys(identical).length} keys to ${outputPath}`);
});
