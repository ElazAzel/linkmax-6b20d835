import * as fs from 'fs';
import * as path from 'path';

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const sourceFile = 'en.json';
const targetFiles = ['ru.json', 'kk.json', 'uk.json', 'uz.json'];

function flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(flattenKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

function loadJson(filename: string): any {
    const filePath = path.join(localesDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

try {
    console.log(`Loading source: ${sourceFile}`);
    const sourceData = loadJson(sourceFile);
    const sourceKeys = new Set(flattenKeys(sourceData));
    console.log(`Source keys count: ${sourceKeys.size}`);

    for (const targetFile of targetFiles) {
        console.log(`\nChecking ${targetFile}...`);
        try {
            const targetData = loadJson(targetFile);
            const targetKeys = new Set(flattenKeys(targetData));

            const missingKeys = Array.from(sourceKeys).filter(k => !targetKeys.has(k));

            console.log(`Total keys: ${targetKeys.size}`);
            console.log(`Missing keys count: ${missingKeys.length}`);
            if (missingKeys.length > 0) {
                console.log('Sample missing keys (first 10):');
                missingKeys.slice(0, 10).forEach(k => console.log(`  - ${k}`));
            }
        } catch (error: any) {
            console.error(`Error processing ${targetFile}:`, error.message);
        }
    }

} catch (error: any) {
    console.error('Fatal error:', error.message);
}
