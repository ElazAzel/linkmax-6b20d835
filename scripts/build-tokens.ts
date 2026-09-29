/**
 * Writes src/design-system/tokens.css from src/design-system/tokens.ts.
 * Run: npm run tokens:build
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTokensCss } from '../src/design-system/generate-css';

const target = resolve(process.cwd(), 'src/design-system/tokens.css');
writeFileSync(target, generateTokensCss());
console.log(`tokens.css written: ${target}`);
