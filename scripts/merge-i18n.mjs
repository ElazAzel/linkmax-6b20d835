import fs from 'node:fs';
import path from 'node:path';

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

export function mergeKeys(targetFile, newKeysMap) {
    let data = {};
    if (fs.existsSync(targetFile)) {
        data = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    }

    for (const [key, value] of Object.entries(newKeysMap)) {
        setNestedKey(data, key, value);
    }

    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${targetFile} with ${Object.keys(newKeysMap).length} keys.`);
}

if (process.argv[2] && process.argv[3]) {
    const target = process.argv[2];
    const map = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    mergeKeys(target, map);
}
