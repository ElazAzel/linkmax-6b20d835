#!/usr/bin/env node
/**
 * Full audit of locale files: structure, empty keys, missing/extra keys, English stubs.
 * Reference: en.json. Output: reports/locale-audit-YYYY-MM-DD.txt and console summary.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const REPORTS_DIR = path.resolve(__dirname, '../reports');
const SOURCE = 'en.json';

function collectLeaves(obj, prefix = '') {
  const leaves = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      leaves.push(...collectLeaves(v, key));
    } else {
      leaves.push({ path: key, value: v });
    }
  }
  return leaves;
}

function countEmpty(obj, prefix = '') {
  let n = 0;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      n += countEmpty(v, key);
    } else if (v === '' || (typeof v === 'string' && v.trim() === '')) {
      n++;
    }
  }
  return n;
}

function getLeafPaths(obj, prefix = '') {
  const paths = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      paths.push(...getLeafPaths(v, key));
    } else {
      paths.push(key);
    }
  }
  return paths;
}

function getValueByPath(obj, pathStr) {
  const parts = pathStr.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function main() {
  const sourcePath = path.join(LOCALES_DIR, SOURCE);
  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const refLeaves = collectLeaves(sourceData);
  const refPaths = new Set(refLeaves.map((l) => l.path));
  const refByPath = new Map(refLeaves.map((l) => [l.path, l.value]));
  const totalKeys = refPaths.size;

  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith('.json') && !f.includes('fragment'))
    .sort();

  const lines = [];
  const pad = (s, n) => String(s).padEnd(n);
  const date = new Date().toISOString().slice(0, 10);

  lines.push('# Полный аудит локалей (Locale Audit)');
  lines.push(`Дата: ${date}`);
  lines.push(`Эталон: ${SOURCE} (листовых ключей: ${totalKeys})`);
  lines.push('');

  const summary = [];

  for (const file of localeFiles) {
    const lang = file.replace('.json', '');
    const filePath = path.join(LOCALES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const localePaths = new Set(getLeafPaths(data));
    const emptyCount = countEmpty(data);
    const missing = [...refPaths].filter((p) => !localePaths.has(p));
    const extra = [...localePaths].filter((p) => !refPaths.has(p));
    let sameAsEn = 0;
    if (lang !== 'en') {
      for (const p of refPaths) {
        const enVal = refByPath.get(p);
        const locVal = getValueByPath(data, p);
        if (typeof enVal === 'string' && enVal === locVal) sameAsEn++;
      }
    }
    const filled = totalKeys - missing.length - emptyCount;
    const pct = totalKeys ? Math.round((filled / totalKeys) * 100) : 0;

    summary.push({
      lang,
      total: totalKeys,
      empty: emptyCount,
      missing: missing.length,
      extra: extra.length,
      sameAsEn,
      pct,
    });

    lines.push(`## ${lang}.json`);
    lines.push(`- Всего ключей (по эталону): ${totalKeys}`);
    lines.push(`- Пустых строк: ${emptyCount}`);
    lines.push(`- Отсутствующих ключей: ${missing.length}`);
    lines.push(`- Лишних ключей (нет в en): ${extra.length}`);
    if (lang !== 'en') {
      lines.push(`- Совпадает с английским (заглушки): ${sameAsEn}`);
    }
    lines.push(`- Заполнено уникально: ${filled} (~${pct}%)`);
    if (missing.length > 0 && missing.length <= 20) {
      lines.push(`- Отсутствующие ключи: ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '...' : ''}`);
    } else if (missing.length > 20) {
      lines.push(`- Первые 15 отсутствующих: ${missing.slice(0, 15).join(', ')}...`);
    }
    if (extra.length > 0 && extra.length <= 10) {
      lines.push(`- Лишние ключи: ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? '...' : ''}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('## Сводная таблица');
  lines.push('');
  lines.push('| Локаль | Пусто | Нет ключа | = EN | Заполнено % |');
  lines.push('|--------|-------|-----------|------|--------------|');
  for (const s of summary) {
    lines.push(`| ${pad(s.lang, 6)} | ${String(s.empty).padStart(5)} | ${String(s.missing).padStart(9)} | ${String(s.sameAsEn).padStart(4)} | ${String(s.pct).padStart(11)}% |`);
  }
  lines.push('');
  lines.push('Рекомендации:');
  lines.push('- Пустые: запустите npm run i18n:fill для подстановки из en.json.');
  lines.push('- Отсутствующие ключи: тот же i18n:fill добавит ключи из эталона.');
  lines.push('- Заглушки (= EN): замените на перевод на соответствующий язык.');

  const reportPath = path.join(REPORTS_DIR, `locale-audit-${date}.txt`);
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  console.log('\n' + lines.join('\n'));
  console.log('\nОтчёт сохранён: ' + reportPath);
}

main();
