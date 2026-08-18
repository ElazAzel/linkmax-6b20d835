/**
 * backend-health — крошечный store состояния доступности бэкенда.
 *
 * Питается ошибками из QueryCache и событиями online/offline.
 * Никаких зависимостей, чтобы можно было импортировать откуда угодно.
 */
import { isNetworkError, extractStatus } from './retry-policy';

export type BackendState = 'ok' | 'degraded' | 'down';

interface HealthSnapshot {
  state: BackendState;
  /** Кол-во последовательных сетевых сбоев. */
  failures: number;
  lastFailureAt: number | null;
  lastRecoveryAt: number | null;
}

let snapshot: HealthSnapshot = {
  state: 'ok',
  failures: 0,
  lastFailureAt: null,
  lastRecoveryAt: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* слушатель не должен ломать остальных */
    }
  });
}

function set(next: Partial<HealthSnapshot>) {
  const merged = { ...snapshot, ...next };
  if (
    merged.state === snapshot.state &&
    merged.failures === snapshot.failures &&
    merged.lastFailureAt === snapshot.lastFailureAt &&
    merged.lastRecoveryAt === snapshot.lastRecoveryAt
  ) {
    return;
  }
  snapshot = merged;
  emit();
}

/** Считаем сбой: сетевой обрыв или 5xx от бэкенда. */
export function reportBackendFailure(error: unknown) {
  const status = extractStatus(error);
  const isInfra = isNetworkError(error) || (status !== null && status >= 500);
  if (!isInfra) return;

  const failures = snapshot.failures + 1;
  set({
    failures,
    lastFailureAt: Date.now(),
    state: failures >= 3 ? 'down' : 'degraded',
  });
}

/** Любой успешный запрос сбрасывает счётчик. */
export function reportBackendSuccess() {
  if (snapshot.failures === 0 && snapshot.state === 'ok') return;
  set({
    failures: 0,
    state: 'ok',
    lastRecoveryAt: Date.now(),
  });
}

export function getBackendHealth(): HealthSnapshot {
  return snapshot;
}

export function subscribeBackendHealth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Для тестов. */
export function resetBackendHealth() {
  snapshot = { state: 'ok', failures: 0, lastFailureAt: null, lastRecoveryAt: null };
  emit();
}
