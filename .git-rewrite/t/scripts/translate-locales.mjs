#!/usr/bin/env node

/**
 * Automatic translation script for locale files
 * Translates all 11 new languages from English using Supabase Edge Function
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const LANGUAGES_TO_TRANSLATE = [
    { code: 'uz', name: 'Uzbek' },
    { code: 'be', name: 'Belarusian' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' }
];

const CHUNK_SIZE = 30; // Keys per API call
const DELAY_BETWEEN_REQUESTS = 3000; // ms (to respect rate limits)

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Flatten nested JSON to dot notation
 */
function flattenObject(obj, prefix = '') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = value;
        }
    }

    return result;
}

/**
 * Unflatten dot notation to nested object
 */
function unflattenObject(flat) {
    const result = {};

    for (const [key, value] of Object.entries(flat)) {
        const parts = key.split('.');
        let current = result;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
    }

    return result;
}

/**
 * Split object into chunks
 */
function chunkObject(obj, size) {
    const entries = Object.entries(obj);
    const chunks = [];

    for (let i = 0; i < entries.length; i += size) {
        chunks.push(Object.fromEntries(entries.slice(i, i + size)));
    }

    return chunks;
}

/**
 * Translate a chunk of text using Supabase Edge Function
 */
async function translateChunk(text, targetLang) {
    try {
        const { data, error } = await supabase.functions.invoke('translate-content', {
            body: {
                text: text,
                sourceLanguage: 'en',
                targetLanguages: [targetLang]
            }
        });

        if (error) throw error;

        return data?.translations?.[targetLang] || text;
    } catch (error) {
        console.error(`  ❌ Error translating to ${targetLang}:`, error.message);
        return text; // Return original on error
    }
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Translate entire locale file
 */
async function translateLocale(targetLang, langName) {
    console.log(`\n🌍 Translating to ${langName} (${targetLang})...`);

    try {
        // Load English locale
        const enPath = join(__dirname, '../src/i18n/locales/en.json');
        const enContent = await readFile(enPath, 'utf-8');
        const enLocale = JSON.parse(enContent);

        // Flatten to key-value pairs
        const flatEn = flattenObject(enLocale);
        const totalKeys = Object.keys(flatEn).length;
        console.log(`  📊 Total keys: ${totalKeys}`);

        // Split into chunks
        const chunks = chunkObject(flatEn, CHUNK_SIZE);
        console.log(`  📦 Chunks: ${chunks.length}`);

        const translatedFlat = {};
        let processedKeys = 0;

        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkKeys = Object.keys(chunk);

            console.log(`  🔄 Processing chunk ${i + 1}/${chunks.length} (${chunkKeys.length} keys)...`);

            // Translate each key in chunk
            for (const [key, value] of Object.entries(chunk)) {
                if (typeof value === 'string' && value.trim()) {
                    const translated = await translateChunk(value, targetLang);
                    translatedFlat[key] = translated;
                    processedKeys++;

                    // Progress indicator
                    if (processedKeys % 10 === 0) {
                        process.stdout.write(`\r  ⏳ Progress: ${processedKeys}/${totalKeys} keys`);
                    }
                } else {
                    translatedFlat[key] = value;
                    processedKeys++;
                }

                // Small delay between individual translations
                await sleep(100);
            }

            // Delay between chunks to respect rate limits
            if (i < chunks.length - 1) {
                console.log(`\n  ⏸️  Waiting ${DELAY_BETWEEN_REQUESTS}ms before next chunk...`);
                await sleep(DELAY_BETWEEN_REQUESTS);
            }
        }

        console.log(`\n  ✅ Translation complete!`);

        // Unflatten back to nested structure
        const translatedLocale = unflattenObject(translatedFlat);

        // Save to file
        const targetPath = join(__dirname, `../src/i18n/locales/${targetLang}.json`);
        await writeFile(targetPath, JSON.stringify(translatedLocale, null, 2), 'utf-8');

        console.log(`  💾 Saved to ${targetLang}.json`);

        return true;
    } catch (error) {
        console.error(`  ❌ Failed to translate ${langName}:`, error.message);
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Starting automatic translation of locale files...\n');
    console.log(`📋 Languages to translate: ${LANGUAGES_TO_TRANSLATE.length}`);
    console.log(`⚙️  Chunk size: ${CHUNK_SIZE} keys`);
    console.log(`⏱️  Delay between chunks: ${DELAY_BETWEEN_REQUESTS}ms\n`);

    const results = [];

    for (const { code, name } of LANGUAGES_TO_TRANSLATE) {
        const success = await translateLocale(code, name);
        results.push({ code, name, success });

        // Delay between languages
        console.log(`\n  ⏸️  Waiting before next language...\n`);
        await sleep(2000);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRANSLATION SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    successful.forEach(r => console.log(`   - ${r.name} (${r.code})`));

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        failed.forEach(r => console.log(`   - ${r.name} (${r.code})`));
    }

    console.log('\n✨ Done!\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
