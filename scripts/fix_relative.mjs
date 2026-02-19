import fs from 'fs';
import path from 'path';

const dir = 'src/components/editor';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(f => {
    const fp = path.join(dir, f);
    const content = fs.readFileSync(fp, 'utf8');
    const newContent = content
        .replace(/'\.\/blocks\//g, "'../blocks/")
        .replace(/"\.\/blocks\//g, '"../blocks/')
        .replace(/'\.\/block-editors\//g, "'../block-editors/")
        .replace(/"\.\/block-editors\//g, '"../block-editors/');

    if (content !== newContent) {
        fs.writeFileSync(fp, newContent, 'utf8');
        console.log('Fixed relative imports in', f);
    }
});
