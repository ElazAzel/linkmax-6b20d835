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

    // Fix the broken replacement
    // Previous replacement made: supabase\n \t (supabase as unknown...)
    // We want to remove the redundant `supabase` before the paren
    content = content.replace(/supabase\s*\(supabase as unknown as/g, "(supabase as unknown as");
    
    // Also, some might be on the same line: supabase(supabase as unknown
    // Let's replace any `supabase[\s\n]*\(supabase` with `(supabase`
    // Actually, maybe `await supabase` was there, so we just want to remove the extra supabase.
    content = content.replace(/supabase\s*\(supabase/g, "(supabase");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        replacedCount++;
        console.log(`Fixed ${filePath}`);
    }
});

console.log(`Fix complete. Modified ${replacedCount} files.`);
