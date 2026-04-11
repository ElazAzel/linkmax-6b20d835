#!/usr/bin/env node
/**
 * Sync all locale JSON files to the exact key tree of en.json.
 * - Drops keys that do not exist in en.json (orphans).
 * - Keeps non-empty translated leaves; otherwise uses the English string.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const SOURCE_LOCALE = 'en';

const LOCALE_FILES = [
  'ru.json', 'kk.json', 'uz.json', 'de.json', 'uk.json', 'uk_restored.json', 'be.json',
  'es.json', 'fr.json', 'it.json', 'pt.json', 'zh.json', 'tr.json',
  'ja.json', 'ko.json', 'ar.json',
];

/**
 * @param {unknown} enNode
 * @param {unknown} locNode
 * @returns {unknown}
 */
function alignToEnglishShape(enNode, locNode) {
  if (Array.isArray(enNode)) {
    if (Array.isArray(locNode) && locNode.length > 0) return locNode.map((v, i) =>
      alignToEnglishShape(enNode[i] !== undefined ? enNode[i] : enNode[0], v)
    );
    return JSON.parse(JSON.stringify(enNode));
  }
  if (enNode !== null && typeof enNode === 'object') {
    const out = {};
    for (const k of Object.keys(enNode)) {
      out[k] = alignToEnglishShape(
        enNode[k],
        locNode && typeof locNode === 'object' && !Array.isArray(locNode) ? locNode[k] : undefined
      );
    }
    return out;
  }
  if (locNode !== undefined && locNode !== null && (typeof locNode !== 'string' || locNode.trim() !== '')) {
    return locNode;
  }
  return enNode;
}

function countLeaves(obj) {
  let n = 0;
  for (const v of Object.values(obj)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) n += countLeaves(v);
    else n++;
  }
  return n;
}

function main() {
  const sourcePath = path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`);
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  console.log(`Source: ${SOURCE_LOCALE}.json (canonical tree)\n`);

  for (const file of LOCALE_FILES) {
    const filePath = path.join(LOCALES_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skip ${file}: file not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const aligned = alignToEnglishShape(source, data);
    const beforeLeaves = countLeaves(data);
    const afterLeaves = countLeaves(aligned);
    fs.writeFileSync(filePath, JSON.stringify(aligned, null, 2), 'utf8');
    console.log(`${file}: aligned (${beforeLeaves} → ${afterLeaves} leaves)`);
  }

  console.log('\nDone. Locales match en.json shape; orphans removed; gaps filled from English.');
}

main();
