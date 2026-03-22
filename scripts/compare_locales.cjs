const fs = require('fs');

function getKeys(data, prefix = '') {
    let keys = {};
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const entries = Object.entries(data);
        if (entries.length === 0) {
            keys[prefix] = "{}"; // Handle empty objects
        } else {
            for (const [k, v] of entries) {
                const newPrefix = prefix ? `${prefix}.${k}` : k;
                Object.assign(keys, getKeys(v, newPrefix));
            }
        }
    } else {
        keys[prefix] = data;
    }
    return keys;
}

function compareLocales(sourcePath, targetPath) {
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    
    const sourceKeys = getKeys(source);
    const targetKeys = getKeys(target);
    
    const missing = [];
    const placeholders = [];
    
    for (const [k, v] of Object.entries(sourceKeys)) {
        if (!(k in targetKeys)) {
            missing.push(k);
        } else if (targetKeys[k] === v || targetKeys[k] === "" || (typeof v === 'string' && typeof targetKeys[k] === 'string' && targetKeys[k].toLowerCase() === v.toLowerCase())) {
            placeholders.push(k);
        }
    }
    
    return { missing, placeholders };
}

const sourcePath = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/ru.json';
const kkPath = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/kk.json';
const uzPath = 'c:/Users/i.azelkhanov/Documents/inkmax/src/i18n/locales/uz.json';

const kkRes = compareLocales(sourcePath, kkPath);
const uzRes = compareLocales(sourcePath, uzPath);

console.log(`KK: Missing ${kkRes.missing.length}, Placeholders ${kkRes.placeholders.length}`);
console.log(`UZ: Missing ${uzRes.missing.length}, Placeholders ${uzRes.placeholders.length}`);

console.log("\nTop 20 Missing in KK:");
console.log(kkRes.missing.slice(0, 20));

console.log("\nTop 20 Missing in UZ:");
console.log(uzRes.missing.slice(0, 20));

console.log("\nTop 20 Placeholders in KK (examples):");
console.log(kkRes.placeholders.slice(0, 20));
