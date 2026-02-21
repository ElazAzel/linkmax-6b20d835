import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

async function fixRu() {
    const ru = JSON.parse(fs.readFileSync(ruLocFile, 'utf8'));
    let toTranslate = [];

    const collect = (obj, currentPath) => {
        for (const key in obj) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (typeof obj[key] === 'string') {
                const text = obj[key];
                if (/[a-zA-Z]/.test(text) && !/[а-яА-ЯёЁ]/.test(text) && !text.match(/^(AI|SEO|URL|SaaS|PRO|lnkmx|lnkmx.my|Linktree|Taplink|Koji|Beacons|\d+|https?:\/\/.*)$/i)) {
                    toTranslate.push({ path: newPath, text });
                }
            } else if (typeof obj[key] === 'object') {
                collect(obj[key], newPath);
            }
        }
    };

    collect(ru, '');
    console.log(`Found ${toTranslate.length} English strings in ru.json. Translating...`);

    let completed = 0;

    // Process with concurrency of 5
    const concurrency = 5;
    for (let i = 0; i < toTranslate.length; i += concurrency) {
        const batch = toTranslate.slice(i, i + concurrency);
        await Promise.all(batch.map(async (item) => {
            const translated = await translateText(item.text, 'ru');
            if (translated && translated !== item.text) {
                // Set nested key
                const parts = item.path.split('.');
                let current = ru;
                for (let j = 0; j < parts.length - 1; j++) {
                    current = current[parts[j]];
                }
                current[parts[parts.length - 1]] = translated;
                completed++;
            }
        }));
        process.stdout.write(`\rProgress: ${Math.min(i + concurrency, toTranslate.length)}/${toTranslate.length}    `);
    }

    if (completed > 0) {
        fs.writeFileSync(ruLocFile, JSON.stringify(ru, null, 2), 'utf8');
        console.log(`\nFixed ${completed} items in ru.json.`);
    } else {
        console.log('\nNo translations needed.');
    }
}

fixRu().catch(console.error);
