// Shared guard for the translate-content function: caches results,
// dedupes in-flight requests, and pauses all calls after a 429.
const cache = new Map<string, Record<string, string> | null>();
const inflight = new Map<string, Promise<Record<string, string> | null>>();
let pausedUntil = 0;

export function isTranslationPaused(): boolean {
  return Date.now() < pausedUntil;
}

export async function guardedTranslate(
  key: string,
  run: () => Promise<{ data: any; error: any }>,
): Promise<Record<string, string> | null> {
  if (cache.has(key)) return cache.get(key)!;
  if (isTranslationPaused()) return null;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const { data, error } = await run();
    if (error) {
      const status = (error as any)?.context?.status;
      if (status === 429 || /429|Too Many/i.test(String(error?.message))) {
        pausedUntil = Date.now() + 60_000;
      }
      return null;
    }
    const result = (data?.translations as Record<string, string>) || null;
    cache.set(key, result);
    return result;
  })().finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}
