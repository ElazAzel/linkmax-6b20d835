import fs from 'node:fs';
import path from 'node:path';

const localesDir = 'src/i18n/locales';

function collectKeys(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, collectKeys(value, fullKey));
        } else {
            result[fullKey] = value;
        }
    }
    return result;
}

const ru = JSON.parse(fs.readFileSync(path.join(localesDir, 'ru.json'), 'utf-8'));
const languages = ['en', 'kk', 'uz'];
const ruFlat = collectKeys(ru);

const worklist = {};

const placeholderPattern = /^\[[A-Z]{2}\]/;
const suspiciousPattern = /(TODO|TBD|PLACEHOLDER)/i;

for (const lang of languages) {
    const langJson = JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf-8'));
    const langFlat = collectKeys(langJson);

    worklist[lang] = {};
    for (const [key, value] of Object.entries(ruFlat)) {
        const targetValue = langFlat[key];
        const isMissing = targetValue === undefined;
        const isEmpty = typeof targetValue === 'string' && targetValue.trim().length === 0;
        const isPlaceholder = typeof targetValue === 'string' && (placeholderPattern.test(targetValue) || suspiciousPattern.test(targetValue));

        if (isMissing || isEmpty || isPlaceholder) {
            worklist[lang][key] = value;
        }
    }
}

fs.writeFileSync('i18n_worklist.json', JSON.stringify(worklist, null, 2));
console.log('Worklist generated in i18n_worklist.json');
for (const lang of languages) {
    console.log(`${lang}: ${Object.keys(worklist[lang]).length} missing or untranslated keys`);
}
