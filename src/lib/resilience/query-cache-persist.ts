/**
 * query-cache-persist — лёгкое сохранение последних успешных ответов в localStorage.
 *
 * Зачем: если бэкенд недоступен, интерфейс показывает последние известные данные
 * вместо пустых экранов. Без внешних зависимостей и без хранения чувствительных сущностей.
 */
import type { QueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'lm.qcache.v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_BYTES = 512 * 1024;
const DEBOUNCE_MS = 1500;

/** Кешируем только «безопасные» и полезные для оффлайна ключи. */
const ALLOWED_PREFIXES = [
  'page',
  'pages',
  'site',
  'sites',
  'appearance',
  'analytics',
  'premium-status',
  'profile',
];

interface PersistedEntry {
  key: unknown[];
  data: unknown;
  updatedAt: number;
}

function isAllowed(key: unknown[]): boolean {
  const head = typeof key[0] === 'string' ? (key[0] as string) : '';
  return ALLOWED_PREFIXES.some((p) => head === p || head.startsWith(`${p}-`) || head.startsWith(`${p}_`));
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Восстанавливаем кеш до первого рендера. */
export function hydrateQueryCache(client: QueryClient) {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as PersistedEntry[];
    if (!Array.isArray(entries)) return;
    const now = Date.now();
    for (const entry of entries) {
      if (!entry || !Array.isArray(entry.key)) continue;
      if (now - entry.updatedAt > MAX_AGE_MS) continue;
      if (!isAllowed(entry.key)) continue;
      client.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
    }
  } catch {
    try {
      ls.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

/** Подписываемся на кеш и периодически сохраняем снимок. */
export function persistQueryCache(client: QueryClient): () => void {
  const ls = safeLocalStorage();
  if (!ls) return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    try {
      const entries: PersistedEntry[] = [];
      for (const query of client.getQueryCache().getAll()) {
        if (query.state.status !== 'success' || query.state.data === undefined) continue;
        const key = query.queryKey as unknown[];
        if (!isAllowed(key)) continue;
        entries.push({ key, data: query.state.data, updatedAt: query.state.dataUpdatedAt });
      }
      if (entries.length === 0) {
        ls.removeItem(STORAGE_KEY);
        return;
      }
      entries.sort((a, b) => b.updatedAt - a.updatedAt);
      let payload = JSON.stringify(entries);
      while (payload.length > MAX_BYTES && entries.length > 1) {
        entries.pop();
        payload = JSON.stringify(entries);
      }
      if (payload.length > MAX_BYTES) return;
      ls.setItem(STORAGE_KEY, payload);
    } catch {
      /* переполнение квоты или циклические данные — молча пропускаем */
    }
  };

  const unsubscribe = client.getQueryCache().subscribe(() => {
    if (timer) return;
    timer = setTimeout(flush, DEBOUNCE_MS);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}

export function clearPersistedQueryCache() {
  try {
    safeLocalStorage()?.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
