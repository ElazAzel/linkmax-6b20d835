
import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales';
const ruJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'ru.json'), 'utf8').replace(/^\uFEFF/, ''));
const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8').replace(/^\uFEFF/, ''));

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(getKeys(obj[key], `${prefix}${key}.`));
        } else {
            keys.push(`${prefix}${key}`);
        }
    }
    return keys;
}

const ruKeys = new Set(getKeys(ruJson));
const enKeys = new Set(getKeys(enJson));

const missingInEn = [...ruKeys].filter(k => !enKeys.has(k));
const missingInRu = [...enKeys].filter(k => !ruKeys.has(k));

console.log('--- Missing in EN ---');
missingInEn.forEach(k => console.log(k));

console.log('\n--- Missing in RU ---');
missingInRu.forEach(k => console.log(k));

const emptyRu = [...ruKeys].filter(k => {
    const val = k.split('.').reduce((o, i) => o[i], ruJson);
    return val === "" || val === null || val === undefined;
});

const emptyEn = [...enKeys].filter(k => {
    const val = k.split('.').reduce((o, i) => o[i], enJson);
    return val === "" || val === null || val === undefined;
});

console.log('\n--- Empty in RU ---');
emptyRu.forEach(k => console.log(k));

console.log('\n--- Empty in EN ---');
emptyEn.forEach(k => console.log(k));
