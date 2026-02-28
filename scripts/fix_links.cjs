const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(projectRoot, 'src'));
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes("from 'next/link'") || content.includes('from "next/link"')) {
        content = content.replace(/import Link(, {[^}]+})? from ['"]next\/link['"];?/g, "import { Link } from 'react-router-dom';");
        content = content.replace(/<Link([^>]*?)href=/g, '<Link$1to=');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
        count++;
    }
}
console.log('Total fixed: ' + count);
