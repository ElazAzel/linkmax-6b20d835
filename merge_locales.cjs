const fs = require('fs');
const path = require('path');

function mergeLocales(sourcePath, targetPath) {
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

    function mergeRecursive(src, tgt) {
        const result = {};
        for (const key in src) {
            if (typeof src[key] === 'object' && src[key] !== null && !Array.isArray(src[key])) {
                result[key] = mergeRecursive(src[key], tgt[key] || {});
            } else {
                // If target has it and it's not the same as source (unless it's a known intentional identical string)
                // we keep target's value. 
                // For this project, many placeholders are exact copies of RU or EN.
                result[key] = tgt[key] !== undefined ? tgt[key] : src[key];
            }
        }
        return result;
    }

    const merged = mergeRecursive(source, target);
    fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`Merged ${sourcePath} into ${targetPath}`);
}

const source = 'src/i18n/locales/ru.json';
const targets = ['src/i18n/locales/kk.json', 'src/i18n/locales/uz.json'];

targets.forEach(t => {
    const fullPath = path.resolve(process.cwd(), t);
    const sourcePath = path.resolve(process.cwd(), source);
    if (fs.existsSync(fullPath)) {
        mergeLocales(sourcePath, fullPath);
    }
});
