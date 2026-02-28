const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Helper to reliably convert PascalCase to kebab-case
function toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    const importRegex = /import\s+({[^}]+})\s+from\s+['"]lucide-react['"];?/g;

    content = content.replace(importRegex, (match, importsString) => {
        const icons = importsString
            .replace(/[{}]/g, '')
            .split(',')
            .map(i => i.trim())
            .filter(i => i.length > 0);

        if (icons.length === 0) return match;

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

const targetDir = path.join(projectRoot, 'src');
console.log(`Starting migration in ${targetDir}...`);
walkDir(targetDir);
console.log('Migration complete.');
