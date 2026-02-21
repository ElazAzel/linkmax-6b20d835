import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ru = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/i18n/locales/ru.json'), 'utf8'));

let emptyStrings = 0;
let noCyrillic = 0;
let totalStrings = 0;
const keysWithoutCyrillic = [];
const emptyKeys = [];

function check(node, parentKey = '') {
    for (const key in node) {
        const fullKey = parentKey ? parentKey + '.' + key : key;
        if (typeof node[key] === 'string') {
            totalStrings++;
            if (node[key].trim() === '') {
                emptyStrings++;
                emptyKeys.push(fullKey);
            } else if (!/[а-яА-ЯёЁ]/.test(node[key])) {
                noCyrillic++;
                keysWithoutCyrillic.push({ key: fullKey, val: node[key] });
            }
        } else if (typeof node[key] === 'object' && node[key] !== null) {
            check(node[key], fullKey);
        }
    }
}
check(ru);

console.log('Total:', totalStrings);
console.log('Empty:', emptyStrings);
console.log('No Cyrillic:', noCyrillic);
if (emptyStrings > 0) console.log('Empty keys (first 10):', emptyKeys.slice(0, 10));
if (noCyrillic > 0) {
    console.log('No Cyrillic samples (first 15):');
    keysWithoutCyrillic.slice(0, 15).forEach(k => console.log(`  ${k.key} = "${k.val}"`));
}
