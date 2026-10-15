#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const BASELINE_PATH = 'config/quality-baseline.json';

const loadBaseline = () => {
  const raw = readFileSync(BASELINE_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Number.isFinite(parsed.anyMax) || !Number.isFinite(parsed.consoleLogMax)) {
    throw new Error(`Invalid baseline values in ${BASELINE_PATH}`);
  }

  return {
    anyMax: parsed.anyMax,
    consoleLogMax: parsed.consoleLogMax,
    hexColorMax: parsed.hexColorMax,
    rawPaletteClassMax: parsed.rawPaletteClassMax,
    whiteBlackAlphaMax: parsed.whiteBlackAlphaMax,
  };
};

const baseline = loadBaseline();

const thresholds = {
  anyMax: Number(process.env.ANY_MAX ?? baseline.anyMax),
  consoleLogMax: Number(process.env.CONSOLE_LOG_MAX ?? baseline.consoleLogMax),
};

const SOURCE_DIR = 'src';
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

const collectSourceFiles = (directory) => {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
};

const countMatchingLines = (pattern) => {
  let matches = 0;

  for (const filePath of collectSourceFiles(SOURCE_DIR)) {
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    matches += lines.filter((line) => pattern.test(line)).length;
  }

  return matches;
};

const metrics = {
  any: countMatchingLines(/\bany\b/),
  consoleLog: countMatchingLines(/console\.log\(/),
};

/*
 * Design ratchet (DESIGN.md → Color). Counts literal colors in interface
 * code; the numbers may only go down. User theme data, third-party brand
 * palettes and tests are excluded.
 */
const DESIGN_EXCLUDED = [
  /[\\/]__tests__[\\/]/,
  /\.test\.tsx?$/,
  /[\\/]src[\\/]testing[\\/]/,
  /[\\/]src[\\/]telegram[\\/]/,
  /[\\/]src[\\/]design-system[\\/]/,
  /[\\/]lib[\\/]appearance[\\/]presets\.ts$/,
  /[\\/]lib[\\/]widget-templates\.ts$/,
  /[\\/]lib[\\/]avatar-frame-utils\.ts$/,
  /[\\/]lib[\\/]design[\\/]brand-colors\.ts$/,
  /[\\/]lib[\\/]social[\\/]brand-icon-data\.ts$/,
  /[\\/]integrations[\\/]supabase[\\/]types\.ts$/,
  /[\\/]platform[\\/]supabase[\\/]types\.ts$/,
];

const countOccurrences = (pattern) => {
  let matches = 0;
  for (const filePath of collectSourceFiles(SOURCE_DIR)) {
    if (DESIGN_EXCLUDED.some((rule) => rule.test(filePath))) continue;
    const text = readFileSync(filePath, 'utf8');
    matches += (text.match(pattern) ?? []).length;
  }
  return matches;
};

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const designMetrics = {
  hexColor: countOccurrences(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![-\w])/g),
  rawPaletteClass: countOccurrences(new RegExp(`\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|divide|decoration|accent|caret)-(?:${PALETTE})-\\d{2,3}\\b`, 'g')),
  whiteBlackAlpha: countOccurrences(/\b(?:bg|text|border|ring|from|via|to|fill|stroke|divide)-(?:white|black)\/(?:\[[^\]]+\]|\d{1,3})\b/g),
};

/*
 * Strict design zones (DESIGN.md → Строгие зоны). Screens already moved to
 * the design system must stay at zero literal colours, translucent
 * white/black, glass surfaces and dead `dark:` variants. Every hit is
 * reported with file and line.
 */
const STRICT_ZONES = [
  'src/components/dashboard-v2/',
  'src/components/crm/',
  'src/components/settings/',
  'src/components/billing/',
  'src/components/tokens/',
  'src/components/onboarding/',
];
const STRICT_EXCEPTIONS = [
  // Editor chrome moves in stage 3; the watermark renders on masters' pages.
  'src/components/dashboard-v2/panels/',
  'src/components/dashboard-v2/screens/EditorScreen.tsx',
  'src/components/billing/FreemiumWatermark.tsx',
];
const STRICT_RULES = [
  ['hex colour', /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![-\w])/],
  ['raw palette class', new RegExp(`\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|divide|decoration|accent|caret)-(?:${PALETTE})-\\d{2,3}\\b`)],
  ['white/black alpha', /\b(?:bg|text|border|ring|from|via|to|fill|stroke|divide)-(?:white|black)\/(?:\[[^\]]+\]|\d{1,3})\b/],
  ['glass surface', /(?:^|[\s"'`])(?:glass(?:-[a-z-]+)?|shadow-glass(?:-[a-z]+)?|bg-liquid-mesh)(?=[\s"'`])/],
  ['dark: variant (app themes via tokens)', /(?:^|[\s"'`])(?:[a-z-]+:)*dark:[a-z]/],
];
const strictViolations = [];
for (const filePath of collectSourceFiles(SOURCE_DIR)) {
  const normalized = filePath.split('\\').join('/');
  if (!STRICT_ZONES.some((zone) => normalized.startsWith(zone))) continue;
  if (STRICT_EXCEPTIONS.some((exception) => normalized.startsWith(exception))) continue;
  if (DESIGN_EXCLUDED.some((rule) => rule.test(filePath))) continue;
  readFileSync(filePath, 'utf8').split(/\r?\n/).forEach((line, index) => {
    for (const [label, pattern] of STRICT_RULES) {
      if (pattern.test(line)) strictViolations.push(`${normalized}:${index + 1} ${label}`);
    }
  });
}

console.log('Quality baseline check');
console.log(`- baseline file: ${BASELINE_PATH}`);
console.log(`- any usages: ${metrics.any} (max: ${thresholds.anyMax})`);
console.log(`- console.log usages: ${metrics.consoleLog} (max: ${thresholds.consoleLogMax})`);

const DESIGN_KEYS = [
  ['hexColor', 'hexColorMax', 'HEX_COLOR_MAX', 'hex colors'],
  ['rawPaletteClass', 'rawPaletteClassMax', 'RAW_PALETTE_CLASS_MAX', 'raw palette classes'],
  ['whiteBlackAlpha', 'whiteBlackAlphaMax', 'WHITE_BLACK_ALPHA_MAX', 'white/black alpha classes'],
];

const violations = [];
for (const [metric, key, env, label] of DESIGN_KEYS) {
  const max = Number(process.env[env] ?? baseline[key]);
  console.log(`- ${label}: ${designMetrics[metric]}${Number.isFinite(max) ? ` (max: ${max})` : ' (no baseline yet)'}`);
  if (Number.isFinite(max) && designMetrics[metric] > max) {
    violations.push(`${label} increased: ${designMetrics[metric]} > ${max} (use design tokens, see DESIGN.md)`);
  }
}
console.log(`- strict design zones: ${strictViolations.length} violation(s)`);
for (const violation of strictViolations) {
  violations.push(`strict design zone: ${violation} (see DESIGN.md → Строгие зоны)`);
}
if (metrics.any > thresholds.anyMax) {
  violations.push(`any usages increased: ${metrics.any} > ${thresholds.anyMax}`);
}
if (metrics.consoleLog > thresholds.consoleLogMax) {
  violations.push(`console.log usages increased: ${metrics.consoleLog} > ${thresholds.consoleLogMax}`);
}

if (violations.length > 0) {
  console.error('\nQuality baseline failed:');
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log('\nQuality baseline passed.');
