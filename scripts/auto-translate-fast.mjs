import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queueFile = path.resolve(__dirname, '../i18n-queue.json');

async function translateText(text, targetLang, retries = 3) {
    if (!text || text.trim() === '') return '';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
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

async function processQueue() {
    if (!fs.existsSync(queueFile)) {
        console.log('Queue file not found. Run npm run i18n:prep first.');
        return;
    }

    const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    const keys = Object.keys(queue);
    console.log(`Found ${keys.length} items. Translating with concurrency...`);

    const targetLangs = ['en', 'kk', 'uz'];
    const CONCURRENCY = 30; // 30 parallel keys
    let completed = 0;
    let modified = false;

    // We process keys in chunks to avoid overwhelming memory/connections completely
    for (let i = 0; i < keys.length; i += CONCURRENCY) {
        const chunk = keys.slice(i, i + CONCURRENCY);

        await Promise.all(chunk.map(async (key) => {
            const item = queue[key];
            const sourceText = item.source;
            if (!sourceText) return;

            let itemModified = false;

            // Translate the empty target languages sequentially for this key to avoid 3x the parallel requests
            for (const lang of targetLangs) {
                if (item[lang] === '' || item[lang] == null) {
                    let apiTargetLang = lang === 'kk' || lang === 'uz' ? lang : lang;
                    const translated = await translateText(sourceText, apiTargetLang);
                    if (translated) {
                        item[lang] = translated;
                        itemModified = true;
                    }
                }
            }

            if (itemModified) modified = true;
        }));

        completed += chunk.length;
        process.stdout.write(`\rProgress: ${completed}/${keys.length} (${Math.round((completed / keys.length) * 100)}%)    `);

        if (modified && i % (CONCURRENCY * 5) === 0) {
            fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf8');
        }
    }

    if (modified) {
        fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf8');
        console.log('\n\nFast translation complete! Saved to i18n-queue.json');
        console.log('Now run: npm run i18n:merge');
    } else {
        console.log('\n\nNo missing translations found or translation failed.');
    }
}

processQueue().catch(console.error);
