/**
 * Client-side guard for the `translate-content` edge function.
 *
 * Public pages can contain hundreds of translatable strings. Firing one request
 * per string in parallel used to trigger HTTP 429 storms (hundreds of failed
 * requests per page view). This module adds:
 *  - an in-memory cache (identical text + target set is fetched once);
 *  - a concurrency limit;
 *  - a circuit breaker that pauses all calls for a cooldown after a 429.
 */

const MAX_CONCURRENCY = 2;
const COOLDOWN_MS = 60_000;
const MAX_CACHE_ENTRIES = 500;

type Translations = Record<string, string>;

const cache = new Map<string, Translations | null>();
const inflight = new Map<string, Promise<Translations | null>>();

let active = 0;
const waiters: Array<() => void> = [];
let pausedUntil = 0;

function isRateLimited(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /429|too many requests|rate limit/i.test(message);
}

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENCY) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  active += 1;
}

function release(): void {
  active -= 1;
  const next = waiters.shift();
  if (next) next();
}

function remember(key: string, value: Translations | null): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

/** True while the breaker is open (a recent 429 pauses all translation calls). */
export function isTranslationPaused(): boolean {
  return Date.now() < pausedUntil;
}

/**
 * Runs `fetcher` for the given text/target pair through the cache + queue.
 * Returns `null` when translation is unavailable (paused, failed or empty).
 */
export async function queueTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguages: string[],
  fetcher: () => Promise<Translations | null>,
): Promise<Translations | null> {
  if (!text?.trim() || targetLanguages.length === 0) return null;
  if (isTranslationPaused()) return null;

  const key = `${sourceLanguage}>${[...targetLanguages].sort().join(',')}::${text}`;

  if (cache.has(key)) return cache.get(key) ?? null;

  const existing = inflight.get(key);
  if (existing) return existing;

  const task = (async () => {
    await acquire();
    try {
      if (isTranslationPaused()) return null;
      const result = await fetcher();
      remember(key, result);
      return result;
    } catch (error) {
      if (isRateLimited(error)) {
        pausedUntil = Date.now() + COOLDOWN_MS;
      }
      return null;
    } finally {
      release();
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}
