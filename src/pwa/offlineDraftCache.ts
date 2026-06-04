/**
 * offlineDraftCache — persist a per-page snapshot of the latest editor state
 * to localStorage. Lets the editor recover unsaved work after a refresh or
 * crash while offline.
 *
 * NOT a full mutation queue — just the latest snapshot. When the user comes
 * back online and the autosave batcher flushes, the snapshot is cleared.
 *
 * Keyed by pageId. Bounded to ~500KB per page; older keys are evicted.
 */
import { logger } from '@/lib/utils/logger';

const KEY_PREFIX = 'lnkmx:draft:';
const MAX_KEYS = 8;
const MAX_PAYLOAD_BYTES = 500 * 1024;

interface DraftEnvelope<T> {
  v: 1;
  pageId: string;
  savedAt: number;
  data: T;
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function evictOldest(storage: Storage): void {
  const entries: Array<{ key: string; savedAt: number }> = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const env = JSON.parse(raw) as DraftEnvelope<unknown>;
      entries.push({ key, savedAt: env.savedAt ?? 0 });
    } catch {
      storage.removeItem(key);
    }
  }
  if (entries.length <= MAX_KEYS) return;
  entries.sort((a, b) => a.savedAt - b.savedAt);
  for (const { key } of entries.slice(0, entries.length - MAX_KEYS)) {
    storage.removeItem(key);
  }
}

export function saveDraft<T>(pageId: string, data: T): void {
  const storage = safeStorage();
  if (!storage || !pageId) return;
  const env: DraftEnvelope<T> = { v: 1, pageId, savedAt: Date.now(), data };
  let payload: string;
  try {
    payload = JSON.stringify(env);
  } catch (err) {
    logger.warn(`offlineDraftCache: serialize failed (${String(err)})`, { context: 'pwa' });
    return;
  }
  if (payload.length > MAX_PAYLOAD_BYTES) return; // too big to keep
  try {
    storage.setItem(`${KEY_PREFIX}${pageId}`, payload);
    evictOldest(storage);
  } catch (err) {
    // Quota exceeded — try evicting and retry once
    try {
      evictOldest(storage);
      storage.setItem(`${KEY_PREFIX}${pageId}`, payload);
    } catch {
      logger.warn(`offlineDraftCache: setItem failed (${String(err)})`, { context: 'pwa' });
    }
  }
}

export function loadDraft<T>(pageId: string): { data: T; savedAt: number } | null {
  const storage = safeStorage();
  if (!storage || !pageId) return null;
  try {
    const raw = storage.getItem(`${KEY_PREFIX}${pageId}`);
    if (!raw) return null;
    const env = JSON.parse(raw) as DraftEnvelope<T>;
    if (env.v !== 1 || env.pageId !== pageId) return null;
    return { data: env.data, savedAt: env.savedAt };
  } catch {
    return null;
  }
}

export function clearDraft(pageId: string): void {
  const storage = safeStorage();
  if (!storage || !pageId) return;
  try {
    storage.removeItem(`${KEY_PREFIX}${pageId}`);
  } catch {
    // ignore
  }
}

export function clearAllDrafts(): void {
  const storage = safeStorage();
  if (!storage) return;
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith(KEY_PREFIX)) toRemove.push(key);
  }
  for (const key of toRemove) storage.removeItem(key);
}
