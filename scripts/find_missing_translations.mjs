import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(filePath);
        }
    }
    return results;
}

const dirsToCheck = [
    'src/components/landing/v2',
    'src/components/dashboard',
    'src/components/blocks',
    'src/pages',
    'src/components/editor',
];

const cyrillicRegex = /[А-Яа-яёЁ]/;

let missingTranslations = [];

for (const dir of dirsToCheck) {
    const fullDir = path.resolve(dir);
    const files = walk(fullDir);

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, i) => {
            let cleanLine = line.replace(/\/\/.*$/g, '');
            if (cleanLine.includes('console.') || cleanLine.includes('throw new Error')) return;

            if (cyrillicRegex.test(cleanLine)) {
                // If it doesn't have a t( call
                if (!cleanLine.match(/\bt\(/) && !cleanLine.match(/i18n\.t\(/)) {
                    missingTranslations.push({ file: file.replace(path.resolve('.'), ''), line: i + 1, content: cleanLine.trim() });
                }
            }
        });
    }
}

console.log(`Found ${missingTranslations.length} lines with hardcoded Russian text.`);
missingTranslations.forEach(m => console.log(`${m.file}:${m.line} -> ${m.content}`));
