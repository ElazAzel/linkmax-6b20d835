import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (['node_modules', '.git', 'dist', '.agent'].includes(file)) continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(filePath);
        }
    }
    return results;
}

const files = walk('src');
const keysInCode = new Set();
const tPattern = /t\(['"]([^'\"]+)['\"]/g;

for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    let match;
    while ((match = tPattern.exec(content)) !== null) {
        keysInCode.add(match[1]);
    }
}

function collectKeys(obj, prefix = '') {
    const res = new Set();
    for (const k in obj) {
        const p = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            collectKeys(obj[k], p).forEach(pk => res.add(pk));
        } else {
            res.add(p);
        }
    }
    return res;
}

const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const enKeys = collectKeys(en);

const missing = [...keysInCode].filter(k =>
    !enKeys.has(k) &&
    !k.startsWith('{{') &&
    !k.includes('${') &&
    k.includes('.') // i18next keys usually have dots
);

console.log(`Keys in code: ${keysInCode.size}`);
console.log(`Keys in EN.json: ${enKeys.size}`);
console.log(`Missing from EN.json: ${missing.length}`);

if (missing.length > 0) {
    console.log('Sample missing keys:');
    console.log(missing.slice(0, 20));
}
