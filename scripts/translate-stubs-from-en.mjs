#!/usr/bin/env node
/**
 * Translates locale leaves that still match English (stubs after i18n:fill)
 * using the public Google Translate endpoint (same approach as auto-translate-ru.mjs).
 *
 * Preserves {{ i18n.interpolation }} tokens.
 *
 * Usage:
 *   node scripts/translate-stubs-from-en.mjs --lang=ru
 *   node scripts/translate-stubs-from-en.mjs --lang=kk,uz
 *   node scripts/translate-stubs-from-en.mjs --lang=ru --max=200 --delay=150
 *   node scripts/translate-stubs-from-en.mjs --rounds=20 --max=400 --delay=45
 *     (повторяет ru,kk,uz до 20 раз, каждый раз до 400 ключей; остановка, если прогресс 0)
 *
 * Options:
 *   --lang    Comma-separated: ru, kk, uz (default: ru,kk,uz)
 *   --max     Max keys per language per round (default: unlimited)
 *   --delay   Ms between requests (default: 120)
 *   --rounds  Repeat lang loop N times (default: 1); early exit if a full round updates 0 keys
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

const PLACEHOLDER = /\{\{[\s]*([\w.]+)[\s]*\}\}/g;

/** @type {Set<string>} */
const SKIP_SUBSTR = new Set([
  'http://',
  'https://',
  'www.',
  '@',
  'rgb(',
  'hsl(',
  '#',
  '0x',
]);

/** Do not send to MT — keep English */
function shouldSkipValue(s) {
  if (typeof s !== 'string') return true;
  const t = s.trim();
  if (!t) return true;
  if (t.length > 2800) return true; // avoid huge blobs
  for (const sub of SKIP_SUBSTR) {
    if (t.includes(sub)) return true;
  }
  // Mostly non-letters (IDs, slugs)
  if (!/[a-zA-Zа-яА-ЯёЁқғүұөһіәөүұқңғһәі]/.test(t)) return true;
  return false;
}

function protectInterpolation(str) {
  const parts = [];
  const out = str.replace(PLACEHOLDER, (m) => {
    const i = parts.length;
    parts.push(m);
    return `⟦${i}⟧`;
  });
  return { text: out, parts };
}

function restoreInterpolation(str, parts) {
  return str.replace(/⟦(\d+)⟧/g, (_, i) => parts[Number(i)] ?? _);
}

function getFlatLeaves(obj, prefix = '') {
  /** @type {Record<string, string>} */
  const out = {};
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return out;
  }
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, getFlatLeaves(v, p));
    } else if (typeof v === 'string') {
      out[p] = v;
    }
  }
  return out;
}

function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateText(text, tl, retries = 4) {
  const { text: masked, parts } = protectInterpolation(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(masked)}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.[0]) {
        const joined = data[0].map((row) => row[0]).join('');
        return restoreInterpolation(joined, parts);
      }
    } catch (e) {
      if (i === retries - 1) console.error('translate error:', e.message);
      else await new Promise((r) => setTimeout(r, 800));
    }
  }
  return '';
}

function parseArgs() {
  const a = process.argv.slice(2);
  const out = { langs: ['ru', 'kk', 'uz'], max: Infinity, delay: 120, rounds: 1 };
  for (const x of a) {
    if (x.startsWith('--lang=')) out.langs = x.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    if (x.startsWith('--max=')) out.max = Number(x.slice(6)) || Infinity;
    if (x.startsWith('--delay=')) out.delay = Number(x.slice(8)) || 120;
    if (x.startsWith('--rounds=')) out.rounds = Math.max(1, Number(x.slice(9)) || 1);
  }
  return out;
}

async function runLang(tl, opts) {
  const { max, delay } = opts;
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const locPath = path.join(LOCALES_DIR, `${tl}.json`);
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'));
  const enFlat = getFlatLeaves(en);
  const locFlat = getFlatLeaves(loc);

  const candidates = [];
  for (const key of Object.keys(enFlat)) {
    const ev = enFlat[key];
    const lv = locFlat[key];
    if (lv === undefined) continue;
    if (lv !== ev) continue; // already differs from EN = translated
    if (shouldSkipValue(ev)) continue;
    candidates.push(key);
  }

  const toDo = candidates.slice(0, Number.isFinite(max) ? max : candidates.length);
  console.log(`\n[${tl}] stubs equal to EN: ${candidates.length}, will translate: ${toDo.length}`);

  let ok = 0;
  for (let i = 0; i < toDo.length; i++) {
    const key = toDo[i];
    const source = enFlat[key];
    const tr = await translateText(source, tl);
    if (tr && tr !== source) {
      setNestedKey(loc, key, tr);
      ok++;
    }
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    if ((i + 1) % 40 === 0) {
      fs.writeFileSync(locPath, JSON.stringify(loc, null, 2), 'utf8');
    }
    if ((i + 1) % 25 === 0 || i === toDo.length - 1) {
      process.stdout.write(`\r[${tl}] ${i + 1}/${toDo.length} translated_ok=${ok}   `);
    }
  }
  console.log('');
  fs.writeFileSync(locPath, JSON.stringify(loc, null, 2), 'utf8');
  console.log(`[${tl}] wrote ${locPath} (${ok} values updated)`);
  return { total: toDo.length, ok };
}

async function main() {
  const opts = parseArgs();
  const { langs, max, delay, rounds } = opts;
  console.log(`translate-stubs-from-en: langs=${langs.join(',')}, max=${max}, delay=${delay}ms, rounds=${rounds}`);
  for (let r = 0; r < rounds; r++) {
    console.log(`\n=== Round ${r + 1}/${rounds} ===`);
    let roundOk = 0;
    for (const tl of langs) {
      if (!['ru', 'kk', 'uz'].includes(tl)) {
        console.warn(`Skip unknown lang code: ${tl} (only ru, kk, uz supported here)`);
        continue;
      }
      const { ok } = await runLang(tl, opts);
      roundOk += ok;
    }
    if (roundOk === 0) {
      console.log('No strings updated this round — stopping early (likely no stubs left or MT returned originals).');
      break;
    }
  }
  console.log('\nDone. Run: npm run i18n:check && npm run i18n:audit');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
