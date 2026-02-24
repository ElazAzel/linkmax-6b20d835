const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules' || file === '.git') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                results.push(filePath);
            }
        }
    }
    return results;
}

const files = walkDir(path.join(__dirname, 'src'));

let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Skip files that were already migrated or don't need it
    if (!content.includes('next/navigation')) continue;

    // 1. Handle useRouter -> useNavigate
    if (content.includes('useRouter')) {
        content = content.replace(/import\s+\{\s*useRouter\s*\}\s+from\s+['"]next\/navigation['"];?/, "import { useNavigate } from 'react-router-dom';");

        // If it has useRouter and other things (like useSearchParams)
        content = content.replace(/import\s+\{\s*useRouter\s*,\s*useParams\s*\}\s+from\s+['"]next\/navigation['"];?/, "import { useNavigate, useParams } from 'react-router-dom';");
        content = content.replace(/import\s+\{\s*usePathname\s*,\s*useRouter\s*,\s*useSearchParams\s*\}\s+from\s+['"]next\/navigation['"];?/, "import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';");

        content = content.replace(/const\s+router\s*=\s*useRouter\(\);?/g, "const navigate = useNavigate();");
        content = content.replace(/router\.push\(/g, "navigate(");
        content = content.replace(/router\.replace\((.*?)\)/g, "navigate($1, { replace: true })");
        content = content.replace(/router\.back\(\)/g, "navigate(-1)");
    }

    // 2. Handle usePathname -> useLocation
    if (content.includes('usePathname')) {
        content = content.replace(/import\s+\{\s*usePathname\s*\}\s+from\s+['"]next\/navigation['"];?/, "import { useLocation } from 'react-router-dom';");
        content = content.replace(/const\s+pathname\s*=\s*usePathname\(\);?/g, "const { pathname } = useLocation();");
    }

    // 3. Handle useParams, useSearchParams without useRouter
    if (content.match(/import.*useParams.*next\/navigation/)) {
        // We already have react-router-dom imported in many files?
        content = content.replace(/import\s+\{\s*useParams\s*,\s*useSearchParams\s*\}\s+from\s+['"]next\/navigation['"];?/, "import { useParams, useSearchParams } from 'react-router-dom';");
    }

    // Clean up duplicate imports from 'react-router-dom'
    let reactRouterDomImports = [];
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"];?/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        reactRouterDomImports.push(...match[1].split(',').map(s => s.trim()).filter(Boolean));
    }

    if (reactRouterDomImports.length > 0) {
        // Deduplicate and consolidate
        const uniqueImports = [...new Set(reactRouterDomImports)];
        content = content.replace(importRegex, '');
        // Add single consolidated import at the top
        content = `import { ${uniqueImports.join(', ')} } from 'react-router-dom';\n` + content.trimStart();
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated: ${file}`);
    }
}

console.log(`Total files modified: ${modifiedCount}`);
