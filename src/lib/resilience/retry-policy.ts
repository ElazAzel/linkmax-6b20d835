/**
 * Единая политика ретраев для React Query и любых сетевых вызовов.
 *
 * Правила:
 *  • 4xx (кроме 408/429) не повторяем — это ошибка запроса/прав, повтор бесполезен.
 *  • Сетевые сбои и 5xx повторяем с экспоненциальной задержкой (макс. 15 с).
 *  • Мутации повторяем максимум один раз и только при сетевой ошибке.
 */

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 507, 509]);

export function extractStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as Record<string, unknown>;
  const raw = e.status ?? e.statusCode ?? e.code ?? (e.response as Record<string, unknown> | undefined)?.status;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && /^\d{3}$/.test(raw)) return Number(raw);
  return null;
}

export function isNetworkError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('timeout') ||
    msg.includes('connection') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset')
  );
}

/** Ошибка, которую бессмысленно повторять (валидация, права, 404). */
export function isPermanentError(error: unknown): boolean {
  const status = extractStatus(error);
  if (status !== null) return status >= 400 && status < 500 && !RETRYABLE_STATUS.has(status);
  // Postgres/PostgREST коды прав и валидации
  const code = (error as { code?: string } | null)?.code;
  if (typeof code === 'string' && /^(42|22|23|PGRST)/.test(code)) return true;
  return false;
}

export function shouldRetry(failureCount: number, error: unknown, max = 3): boolean {
  if (failureCount >= max) return false;
  if (isPermanentError(error)) return false;
  return true;
}

export function retryDelay(attemptIndex: number): number {
  const base = 1000 * 2 ** attemptIndex;
  const jitter = Math.random() * 250;
  return Math.min(base + jitter, 15_000);
}

export const queryRetryOptions = {
  retry: (failureCount: number, error: unknown) => shouldRetry(failureCount, error, 3),
  retryDelay,
};

export const mutationRetryOptions = {
  retry: (failureCount: number, error: unknown) =>
    failureCount < 1 && isNetworkError(error) && !isPermanentError(error),
  retryDelay,
};
