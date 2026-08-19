import { describe, expect, it, beforeEach } from 'vitest';
import {
  extractStatus,
  isNetworkError,
  isPermanentError,
  shouldRetry,
  retryDelay,
  mutationRetryOptions,
} from './retry-policy';
import {
  getBackendHealth,
  reportBackendFailure,
  reportBackendSuccess,
  resetBackendHealth,
  subscribeBackendHealth,
} from './backend-health';

describe('retry-policy', () => {
  it('извлекает статус из разных форм ошибок', () => {
    expect(extractStatus({ status: 503 })).toBe(503);
    expect(extractStatus({ statusCode: 404 })).toBe(404);
    expect(extractStatus({ response: { status: 500 } })).toBe(500);
    expect(extractStatus({ code: '429' })).toBe(429);
    expect(extractStatus(new Error('boom'))).toBeNull();
  });

  it('распознаёт сетевые ошибки', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('connection reset'))).toBe(true);
    expect(isNetworkError(new Error('invalid input'))).toBe(false);
  });

  it('не повторяет постоянные ошибки', () => {
    expect(isPermanentError({ status: 401 })).toBe(true);
    expect(isPermanentError({ status: 404 })).toBe(true);
    expect(isPermanentError({ status: 429 })).toBe(false);
    expect(isPermanentError({ status: 500 })).toBe(false);
    expect(isPermanentError({ code: '42501' })).toBe(true);
  });

  it('ограничивает количество попыток', () => {
    const netErr = new Error('Failed to fetch');
    expect(shouldRetry(0, netErr)).toBe(true);
    expect(shouldRetry(2, netErr)).toBe(true);
    expect(shouldRetry(3, netErr)).toBe(false);
    expect(shouldRetry(0, { status: 403 })).toBe(false);
  });

  it('растит задержку экспоненциально и упирается в потолок', () => {
    expect(retryDelay(0)).toBeGreaterThanOrEqual(1000);
    expect(retryDelay(0)).toBeLessThan(1300);
    expect(retryDelay(1)).toBeGreaterThanOrEqual(2000);
    expect(retryDelay(10)).toBe(15_000);
  });

  it('мутации повторяются только один раз и только на сети', () => {
    const netErr = new Error('network error');
    expect(mutationRetryOptions.retry(0, netErr)).toBe(true);
    expect(mutationRetryOptions.retry(1, netErr)).toBe(false);
    expect(mutationRetryOptions.retry(0, { status: 400 })).toBe(false);
  });
});

describe('backend-health', () => {
  beforeEach(() => resetBackendHealth());

  it('стартует в состоянии ok', () => {
    expect(getBackendHealth().state).toBe('ok');
  });

  it('деградирует, затем падает после 3 инфраструктурных сбоев', () => {
    const err = new Error('Failed to fetch');
    reportBackendFailure(err);
    expect(getBackendHealth().state).toBe('degraded');
    reportBackendFailure(err);
    reportBackendFailure(err);
    expect(getBackendHealth().state).toBe('down');
    expect(getBackendHealth().failures).toBe(3);
  });

  it('игнорирует ошибки приложения (4xx)', () => {
    reportBackendFailure({ status: 403 });
    expect(getBackendHealth().state).toBe('ok');
  });

  it('успех сбрасывает счётчик и фиксирует восстановление', () => {
    reportBackendFailure({ status: 500 });
    reportBackendSuccess();
    const snap = getBackendHealth();
    expect(snap.state).toBe('ok');
    expect(snap.failures).toBe(0);
    expect(snap.lastRecoveryAt).not.toBeNull();
  });

  it('уведомляет подписчиков и отписывает', () => {
    let calls = 0;
    const unsubscribe = subscribeBackendHealth(() => {
      calls += 1;
    });
    reportBackendFailure({ status: 502 });
    expect(calls).toBe(1);
    unsubscribe();
    reportBackendFailure({ status: 502 });
    expect(calls).toBe(1);
  });
});
