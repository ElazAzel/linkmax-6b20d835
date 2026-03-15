
import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales';
const files = ['en.json', 'kk.json', 'uz.json'];
const ruPath = path.join(localesDir, 'ru.json');
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf8').replace(/^\uFEFF/, ''));

function mendObject(source, target) {
    let mended = false;
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
                mended = true;
            }
            if (mendObject(source[key], target[key])) {
                mended = true;
            }
        } else {
            // Fill if strictly missing OR if it's an empty string
            if (target[key] === undefined || target[key] === "" || target[key] === null) {
                target[key] = source[key]; // Fallback to RU value
                mended = true;
            }
        }
    }
    return mended;
}

files.forEach(file => {
    const filePath = path.join(localesDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, not found`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const json = JSON.parse(content);
    
    if (mendObject(ruJson, json)) {
        console.log(`Mending ${file}...`);
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    } else {
        console.log(`${file} is already up to date.`);
    }
});
