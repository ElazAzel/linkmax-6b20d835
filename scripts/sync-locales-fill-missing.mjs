#!/usr/bin/env node
/**
 * Sync all locale JSON files: ensure every key from en.json exists in every locale.
 * Missing or empty values are filled from en.json (English fallback).
 * Preserves existing translations; only fills gaps.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const SOURCE_LOCALE = 'en';

const LOCALE_FILES = [
  'ru.json', 'kk.json', 'uz.json', 'de.json', 'uk.json', 'be.json',
  'es.json', 'fr.json', 'it.json', 'pt.json', 'zh.json', 'tr.json',
  'ja.json', 'ko.json', 'ar.json'
];

/**
 * Deep merge: for every key in source, if target[key] is missing or empty string, set target[key] = source[key].
 * Modifies target in place. Handles nested objects. Preserves existing non-empty translations.
 */
function fillMissing(target, source) {
  let filled = 0;
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      if (tgtVal === undefined || tgtVal === null) {
        target[key] = JSON.parse(JSON.stringify(srcVal));
        filled += countLeaves(srcVal);
      } else if (typeof tgtVal === 'object' && !Array.isArray(tgtVal)) {
        filled += fillMissing(tgtVal, srcVal);
      } else {
        target[key] = JSON.parse(JSON.stringify(srcVal));
        filled += countLeaves(srcVal);
      }
    } else {
      const isEmpty = tgtVal === undefined || tgtVal === null || (typeof tgtVal === 'string' && tgtVal.trim() === '');
      if (isEmpty) {
        target[key] = Array.isArray(srcVal) ? [...srcVal] : srcVal;
        filled++;
      }
    }
  }
  return filled;
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

  console.log(`Source: ${SOURCE_LOCALE}.json (keys structure as reference)\n`);

  for (const file of LOCALE_FILES) {
    const filePath = path.join(LOCALES_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skip ${file}: file not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const before = JSON.stringify(data).length;
    const filled = fillMissing(data, source);
    if (filled > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`${file}: filled ${filled} missing key(s)`);
    } else {
      console.log(`${file}: no missing keys`);
    }
  }

  console.log('\nDone. All locale files now have the same keys as en.json; missing values filled with English.');
}

main();
