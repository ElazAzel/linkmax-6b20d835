import { expect, it } from 'vitest';
import ru from '../locales/ru.json';
import en from '../locales/en.json';
import { fallbackWarmup } from '../config';

type Tree = Record<string, unknown>;
const flatten = (tree: Tree, prefix = '', out = new Set<string>()) => {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value as Tree, path, out);
    else out.add(path);
  }
  return out;
};
const keys = (json: Tree) => {
  const { translation, ...rest } = json as { translation?: Tree };
  return flatten({ ...(translation ?? {}), ...rest });
};

// Russian visitors skip the English bundle, so Russian must have every key.
it('has every English key in Russian', () => {
  const ruKeys = keys(ru as Tree);
  expect([...keys(en as Tree)].filter((key) => !ruKeys.has(key))).toEqual([]);
});

it('warms only reachable fallbacks', () => {
  expect(fallbackWarmup('ru')).toEqual([]);
  expect(fallbackWarmup('kk')).toEqual(['ru']);
  expect(fallbackWarmup('uz')).toEqual(['ru']);
  expect(fallbackWarmup('de')).toEqual(['ru', 'en']);
  expect(fallbackWarmup('en')).toEqual(['ru']);
});
