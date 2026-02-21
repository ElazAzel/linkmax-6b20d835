import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queueFile = path.resolve(__dirname, '../i18n-queue.json');

async function translateText(text, targetLang) {
    if (!text || text.trim() === '') return '';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data[0]) {
            return data[0].map(item => item[0]).join('');
        }
    } catch (err) {
        console.error(`Failed to translate "${text.substring(0, 20)}..." to ${targetLang}`, err.message);
    }
    return '';
}

async function processQueue() {
    if (!fs.existsSync(queueFile)) {
        console.log('Queue file not found. Run npm run i18n:prep first.');
        return;
    }

    const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    const keys = Object.keys(queue);
    console.log(`Found ${keys.length} items in translation queue.`);

    const targetLangs = ['en', 'kk', 'uz'];
    let modified = false;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const item = queue[key];
        const sourceText = item.source;

        if (!sourceText) continue;

        let itemModified = false;
        for (const lang of targetLangs) {
            if (item[lang] === '' || item[lang] == null) {
                // Determine actual target language code for Google API
                let apiTargetLang = lang;
                if (lang === 'kk') apiTargetLang = 'kk'; // Kazakh
                if (lang === 'uz') apiTargetLang = 'uz'; // Uzbek

                const translated = await translateText(sourceText, apiTargetLang);
                if (translated) {
                    item[lang] = translated;
                    itemModified = true;
                }

                // Add a small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 200));
            }
        }

        if (itemModified) {
            modified = true;
            process.stdout.write(`\rProgress: ${i + 1}/${keys.length} (${Math.round(((i + 1) / keys.length) * 100)}%)    `);

            // Periodically save to avoid losing data on crash
            if (i % 50 === 0) {
                fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf8');
            }
        }
    }

    if (modified) {
        fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf8');
        console.log('\n\nTranslation complete! Saved to i18n-queue.json');
        console.log('Now run: npm run i18n:merge');
    } else {
        console.log('\n\nNo missing translations found or translation failed.');
    }
}

processQueue().catch(console.error);
