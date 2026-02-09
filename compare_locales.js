const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const sourceFile = 'en.json';
const targetFiles = ['ru.json', 'kk.json', 'uk.json', 'uz.json'];

function flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(flattenKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

function loadJson(filename) {
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
            const targetKeysList = flattenKeys(targetData);

            const missingKeys = [...sourceKeys].filter(k => !targetKeys.has(k));

            console.log(`Total keys: ${targetKeys.size}`);
            console.log(`Missing keys count: ${missingKeys.length}`);

            if (missingKeys.length > 0) {
                console.log('Sample missing keys (first 20):');
                missingKeys.slice(0, 20).forEach(k => console.log(`  - ${k}`));

                // Write missing keys to a file for later processing if needed
                const missingKeysFile = `missing_keys_${targetFile.replace('.json', '')}.txt`;
                fs.writeFileSync(missingKeysFile, missingKeys.join('\n'));
                console.log(`Missing keys written to ${missingKeysFile}`);
            }
        } catch (error) {
            console.error(`Error processing ${targetFile}:`, error.message);
        }
    }

} catch (error) {
    console.error('Fatal error:', error.message);
}
