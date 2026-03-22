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

    // 1. Convert  .from('table' as any)  =>  (supabase as unknown as { from: (schema: string) => any }).from('table')
    content = content.replace(/\.from\('([^']+)'\s+as\s+any\)/g, "(supabase as unknown as { from: (schema: string) => any }).from('$1')");
    
    // 2. Convert  as any[]  =>  as Record<string, unknown>[]
    content = content.replace(/\bas\s+any\[\]/g, "as Record<string, unknown>[]");

    // 3. Convert  (error: any)  =>  (error: unknown)
    content = content.replace(/\(error:\s*any\)/g, "(error: unknown)");
    content = content.replace(/\(err:\s*any\)/g, "(err: unknown)");
    content = content.replace(/\(e:\s*any\)/g, "(e: unknown)");

    // 4. Convert  updateData as any  =>  updateData as Record<string, unknown>
    // Just replace general ` as any` if it's safe? No, might break things.
    // Let's replace  as any)  with  as Record<string, unknown>)
    content = content.replace(/(\w+)\s+as\s+any\)/g, "$1 as Record<string, unknown>)");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        replacedCount++;
        console.log(`Updated ${filePath}`);
    }
});

console.log(`Replacement complete. Modified ${replacedCount} files.`);
