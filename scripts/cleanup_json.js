import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directory: src/i18n/locales
const localesDir = path.resolve(__dirname, 'src/i18n/locales');

console.log(`Scanning directory: ${localesDir}`);

if (!fs.existsSync(localesDir)) {
    console.error(`Directory not found: ${localesDir}`);
    process.exit(1);
}

const files = fs.readdirSync(localesDir);

files.forEach(file => {
    if (path.extname(file) === '.json') {
        const filePath = path.join(localesDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            // Parse JSON (this handles duplicate keys by keeping the last one)
            const json = JSON.parse(content);
            // Write back formatted JSON
            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`Processed: ${file}`);
        } catch (error) {
            console.error(`Error processing ${file}: ${error.message}`);
        }
    }
});
console.log('Done.');
