import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales';
const langs = ['en', 'ru', 'kk', 'uz'];

function countKeys(obj) {
    let count = 0;
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            count += countKeys(obj[key]);
        } else {
            count++;
        }
    }
    return count;
}

langs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`${lang}: ${countKeys(content)} keys`);
    } catch (e) {
        console.error(`Error reading ${lang}: ${e.message}`);
    }
});
