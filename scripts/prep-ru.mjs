import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ruFile = path.resolve(__dirname, '../src/i18n/locales/ru.json');
const queueFile = path.resolve(__dirname, '../ru-queue.json');

const ru = JSON.parse(fs.readFileSync(ruFile, 'utf8'));
const queue = {};

function buildQueue(node, parentKey = '') {
    for (const key in node) {
        const fullKey = parentKey ? parentKey + '.' + key : key;
        if (typeof node[key] === 'string') {
            const val = node[key].trim();
            // Skip purely empty, or numbers
            if (val === '' || !isNaN(Number(val))) continue;
            // If it doesn't contain Cyrillic, it's likely English that needs Russian translation
            if (!/[а-яА-ЯёЁ]/.test(val)) {
                // Skip common non-translated terms
                if (['Email', 'URL', 'ID', '5 MB'].includes(val)) continue;

                queue[fullKey] = {
                    source: val,
                    ru: ''
                };
            }
        } else if (typeof node[key] === 'object' && node[key] !== null) {
            buildQueue(node[key], fullKey);
        }
    }
}
buildQueue(ru);

fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf8');
console.log(`Extracted ${Object.keys(queue).length} strings into ru-queue.json for translation to Russian.`);
