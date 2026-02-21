import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queueFile = path.resolve(__dirname, '../ru-queue.json');
const ruLocFile = path.resolve(__dirname, '../src/i18n/locales/ru.json');

async function translateText(text, targetLang, retries = 3) {
    if (!text || text.trim() === '') return '';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 429) {
                    await new Promise(r => setTimeout(r, 2000 * (i + 1))); // backoff
                    continue;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            if (data && data[0]) {
                return data[0].map(item => item[0]).join('');
            }
        } catch (err) {
            if (i === retries - 1) {
                console.error(`Failed to translate "${text.substring(0, 20)}..." to ${targetLang}`, err.message);
            } else {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    return '';
}

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


async function processQueue() {
    if (!fs.existsSync(queueFile)) {
        console.log('Queue file not found.');
        return;
    }

    const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    const ru = JSON.parse(fs.readFileSync(ruLocFile, 'utf8'));
    const keys = Object.keys(queue);
    console.log(`Translating ${keys.length} items to Russian...`);

    let completed = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const item = queue[key];
        const sourceText = item.source;

        if (!sourceText) continue;

        const translated = await translateText(sourceText, 'ru');
        if (translated) {
            setNestedKey(ru, key, translated);
            completed++;
            process.stdout.write(`\rProgress: ${i + 1}/${keys.length} (${Math.round(((i + 1) / keys.length) * 100)}%)    `);
        }
    }

    if (completed > 0) {
        fs.writeFileSync(ruLocFile, JSON.stringify(ru, null, 2), 'utf8');
        console.log('\n\nTranslation complete! Saved ' + completed + ' Russian texts to ru.json');

        // After adding to ru.json we should ideally sync so that other files don't lose anything
        // but since we only modified values of existing keys, we just sync if needed.
    } else {
        console.log('\n\nNo translations were processed.');
    }
}

processQueue().catch(console.error);
