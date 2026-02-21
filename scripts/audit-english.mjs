import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (['node_modules', '.git', 'ui', 'lib', 'hooks', 'i18n'].includes(file)) continue;
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

const files = walk(srcDir);
let englishFound = [];
const ignoreWords = ['id', 'px', 'div', 'span', 'className', 'http', 'https', 'lnkmx', 'Inkmax', 'inkmax', 'API', 'CRM', 'URL', 'SEO', 'Email', 'Pro', 'AI', 'QR', 'ID', 'MB', 'GB', 'Loading', 'Error', 'Kaspi', 'Stripe', 'VK', 'Telegram', 'WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Google', 'Yandex', 'YouTube', 'Twitch', 'Discord', 'X', 'Twitter', 'GitHub', 'LinkedIn', 'Dribbble', 'Behance', 'Pinterest', 'Spotify', 'Apple', 'Music'];
const ignorePattern = new RegExp(`^(${ignoreWords.join('|')})$`, 'i');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');

    // Quick heuristic: remove all t('key', 'default') calls so we don't catch translated defaults
    content = content.replace(/t\([\s\S]*?\)/g, '');

    // Remove console logs
    content = content.replace(/console\.(log|warn|error|info)\([\s\S]*?\)/g, '');

    // Remove classNames and standard HTML attributes
    content = content.replace(/(className|style|id|key|href|src|type|name|value)=["'][^"']*["']/g, '');

    // Look for text outside of tags and curly braces (JSX text nodes), roughly
    // This looks for > text < 
    const matches = [...content.matchAll(/>\s*([A-Za-z][A-Za-z0-9\s.,'?!-]{2,})\s*</g)];

    matches.forEach(m => {
        const text = m[1].trim();
        // Skip if it's purely uppercase (often Acronyms) or one of the ignored words
        if (text.length > 2 && !ignorePattern.test(text) && !/^[A-Z0-9_\s-]+$/.test(text) && /[a-z]/.test(text)) {
            // Also skip common code syntax that might look like text
            if (!text.includes('=>') && !text.includes('!==') && !text.includes('...')) {
                englishFound.push({ file: f.replace(srcDir, ''), text });
            }
        }
    });

    // Also check for raw string literals being returned or assigned that might be UI text
    // specifically placeholders
    const placeholders = [...content.matchAll(/placeholder=["']([A-Za-z][A-Za-z0-9\s.,'?!-]{2,})["']/g)];
    placeholders.forEach(m => {
        const text = m[1].trim();
        if (text.length > 2 && !ignorePattern.test(text) && /[a-z]/.test(text)) {
            englishFound.push({ file: f.replace(srcDir, ''), text: `[placeholder] ${text}` });
        }
    });
});

console.log(`Scanned ${files.length} files. Found ${englishFound.length} potential hardcoded English strings.`);

const counts = {};
englishFound.forEach(i => {
    counts[i.text] = (counts[i.text] || 0) + 1;
});

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30);
console.log('\n--- Most Frequent Hardcoded English Strings ---');
sorted.forEach(([text, count]) => {
    console.log(`${count}x : "${text}"`);
    // Print one file where it was found
    const sampleFile = englishFound.find(e => e.text === text).file;
    console.log(`      (e.g., in ${sampleFile})`);
});

// Also print the ones specifically in dashboard
console.log('\n--- Dashboard Specific ---');
const dashboardItems = englishFound.filter(e => e.file.includes('dashboard') || e.file.includes('editor'));
dashboardItems.forEach(e => {
    console.log(`${e.file} : "${e.text}"`);
});
