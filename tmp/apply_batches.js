
import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales';
const tmpDir = 'c:/Users/i.azelkhanov/Documents/inkmax/tmp';

function setDeep(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}

function applyBatches(targetFile, batchPrefix) {
    const targetPath = path.join(localesDir, targetFile);
    const json = JSON.parse(fs.readFileSync(targetPath, 'utf8').replace(/^\uFEFF/, ''));
    
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(batchPrefix) && f.endsWith('.json'));
    
    files.forEach(file => {
        const batch = JSON.parse(fs.readFileSync(path.join(tmpDir, file), 'utf8'));
        for (const key in batch) {
            setDeep(json, key, batch[key]);
        }
    });
    
    fs.writeFileSync(targetPath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Applied batches to ${targetFile}`);
}

const lang = process.argv[2]; // 'en', 'kk', or 'uz'
if (lang) {
    applyBatches(`${lang}.json`, `${lang}_batch`);
} else {
    console.log("Please specify language: en, kk, or uz");
}
