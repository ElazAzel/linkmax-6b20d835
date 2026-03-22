import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hooksDir = path.join(__dirname, '../src/hooks');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let replacedCount = 0;

walkDir(hooksDir, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove 'as any' in .from() overrides safely because extended-types handles them!
    content = content.replace(/\.from\('([^']+)'\s+as\s+any\)/g, ".from('$1')");
    
    // 2. Remove trailing 'as any)' for postgrest queries
    content = content.replace(/\s+as\s+any\)/g, ")");
    content = content.replace(/\)\s+as\s+any\n/g, ")\n");
    content = content.replace(/\;\s*\}\s+as\s+any\)/g, "; } )"); // catch inside inserts? No.
    content = content.replace(/\)\s+as\s+any;/g, ");"); // `await ...() as any;` -> `await ...();`

    // 3. Catch generic array casting
    content = content.replace(/\bas\s+any\[\]/g, "as Record<string, unknown>[]");

    // 4. Catch generic error casting
    content = content.replace(/\(error:\s*any\)/g, "(error: unknown)");
    content = content.replace(/\(err:\s*any\)/g, "(err: unknown)");
    content = content.replace(/\(e:\s*any\)/g, "(e: unknown)");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        replacedCount++;
        console.log(`Updated ${filePath}`);
    }
});

console.log(`Replacement complete. Modified ${replacedCount} files.`);
