const fs = require('fs');
const path = require('path');

const corrections = {
    'users2': 'users-2',
    'edit2': 'edit-2',
    'grid2x2': 'grid-2x2',
    'maximize2': 'maximize-2',
    'image-icon': 'image',
    'gamepad2': 'gamepad-2',
    'minimize2': 'minimize-2',
    'mouse-pointer2': 'mouse-pointer-2',
    'redo2': 'redo-2',
    'grid3-x3': 'grid-3x3',
    "import LucideIcon from 'lucide-react/dist/esm/icons/lucide-icon';": "import type { LucideIcon } from 'lucide-react';",
    "import * as LucideIcon from 'lucide-react/dist/esm/icons/lucide-icon';": "import type { LucideIcon } from 'lucide-react';"
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    for (const [wrong, right] of Object.entries(corrections)) {
        if (wrong.includes('import')) {
            // Replace whole lines for types
            content = content.replace(wrong, right);
        } else {
            const wrongPath = `lucide-react/dist/esm/icons/${wrong}`;
            const rightPath = `lucide-react/dist/esm/icons/${right}`;
            content = content.split(wrongPath).join(rightPath);
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Corrected icon paths in ${filePath}`);
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

walkDir(path.join(__dirname, 'src'));
