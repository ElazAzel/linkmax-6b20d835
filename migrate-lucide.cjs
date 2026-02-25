const fs = require('fs');
const path = require('path');

// Helper to reliably convert PascalCase to kebab-case
function toKebabCase(str) {
    // e.g. "MessageCircle" -> "message-circle"
    // e.g. "ArrowLeft" -> "arrow-left"
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Regex to match "import { ... } from 'lucide-react';"
    // Handles multiline and spacing
    const importRegex = /import\s+({[^}]+})\s+from\s+['"]lucide-react['"];?/g;

    content = content.replace(importRegex, (match, importsString) => {
        // Extract individual icon names
        // `importsString` is like "{ Check, ArrowRight }" or multiline
        const icons = importsString
            .replace(/[{}]/g, '') // remove brackets
            .split(',') // split by comma
            .map(i => i.trim()) // trim whitespace
            .filter(i => i.length > 0); // remove empty

        if (icons.length === 0) return match;

        // Optional: some imports might have aliases like "Check as CheckIcon"
        // We should handle "X as Y" aliases if they exist in lucide-react?
        // Let's assume standard "ImportName" for now.

        const individualImports = icons.map(iconDef => {
            let importName = iconDef;
            let aliasName = iconDef;

            if (iconDef.includes(' as ')) {
                const parts = iconDef.split(' as ').map(p => p.trim());
                importName = parts[0];
                aliasName = parts[1];
            }

            if (importName === 'type LucideProps') {
                return `import type { LucideProps } from 'lucide-react';`;
            }

            const kebabName = toKebabCase(importName);
            if (importName === aliasName) {
                return `import ${importName} from 'lucide-react/dist/esm/icons/${kebabName}';`;
            } else {
                return `import ${importName} from 'lucide-react/dist/esm/icons/${kebabName}';\nconst ${aliasName} = ${importName};`;
            }
        });

        return individualImports.join('\n');
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

const targetDir = path.join(__dirname, 'src');
console.log(`Starting migration in ${targetDir}...`);
walkDir(targetDir);
console.log('Migration complete.');
