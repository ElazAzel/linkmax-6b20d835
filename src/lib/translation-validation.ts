export interface TranslationValidation {
  valid: boolean;
  errors: { key: string; issue: string }[];
  warnings: { key: string; issue: string }[];
  stats: { totalKeys: number; missingKeys: number; extraKeys: number; emptyValues: number };
}

function entries(value: Record<string, unknown>, prefix = ''): [string, unknown][] {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return item && typeof item === 'object' && !Array.isArray(item)
      ? entries(item as Record<string, unknown>, path) : [[path, item]];
  });
}

/** Validate structure and coverage, never generate or change translation text. */
export function validateTranslationUpload(payload: Record<string, unknown>, reference: Record<string, unknown>): TranslationValidation {
  const uploaded = new Map(entries(payload));
  const expected = new Map(entries(reference));
  const errors: TranslationValidation['errors'] = [];
  const warnings: TranslationValidation['warnings'] = [];
  let missingKeys = 0;
  let extraKeys = 0;
  let emptyValues = 0;
  for (const key of expected.keys()) {
    if (!uploaded.has(key)) {
      missingKeys++;
      warnings.push({ key, issue: 'Ключ отсутствует; будет использована встроенная локаль' });
    }
  }
  for (const [key, value] of uploaded) {
    if (!expected.has(key)) {
      extraKeys++;
      warnings.push({ key, issue: 'Дополнительный ключ' });
    }
    if (typeof value !== 'string') errors.push({ key, issue: 'Значение должно быть строкой' });
    else if (!value.trim()) {
      emptyValues++;
      warnings.push({ key, issue: 'Пустое значение; будет использована встроенная локаль' });
    }
    if (key.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) {
      errors.push({ key, issue: 'Недопустимое имя ключа' });
    }
  }
  return { valid: errors.length === 0, errors, warnings, stats: { totalKeys: uploaded.size, missingKeys, extraKeys, emptyValues } };
}
