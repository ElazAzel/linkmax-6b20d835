import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHUNK_RECOVERY_KEY, recoverFromStaleAssets } from '@/lib/utils/runtime-recovery';
import { logger } from '@/lib/utils/logger';

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('recoverFromStaleAssets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('runs recovery on first attempt, clears only technical build keys and logs outcome', async () => {
    window.localStorage.setItem('linkmax-build-v123', '1');
    window.localStorage.setItem('linkmax_user_prefs', 'keep');
    window.localStorage.setItem('sb-access-token', 'keep');

    const cacheDelete = vi.fn().mockResolvedValue(true);
    const cacheKeys = vi.fn().mockResolvedValue(['linkmax-app-v1', 'custom-user-cache']);

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: cacheKeys,
        delete: cacheDelete,
      },
    });

    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined);

    recoverFromStaleAssets('window.error');
    await Promise.resolve();
    await Promise.resolve();
    await vi.runAllTimersAsync();

    expect(window.sessionStorage.getItem(CHUNK_RECOVERY_KEY)).toBe('1');
    expect(window.localStorage.getItem('linkmax-build-v123')).toBeNull();
    expect(window.localStorage.getItem('linkmax_user_prefs')).toBe('keep');
    expect(window.localStorage.getItem('sb-access-token')).toBe('keep');

    expect(cacheDelete).toHaveBeenCalledWith('linkmax-app-v1');
    expect(cacheDelete).not.toHaveBeenCalledWith('custom-user-cache');
    expect(document.querySelector('[data-recovery-overlay="true"]')).not.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'Chunk recovery started',
      expect.objectContaining({
        context: 'runtime-recovery',
        data: expect.objectContaining({
          reason: 'window.error',
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Chunk recovery finished',
      expect.objectContaining({
        context: 'runtime-recovery',
        data: expect.objectContaining({
          reason: 'window.error',
          outcome: 'reloaded_after_cleanup',
        }),
      }),
    );
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('skips repeated recovery attempts in same session and logs skip outcome', () => {
    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');

    recoverFromStaleAssets('unhandledrejection');

    expect(logger.warn).toHaveBeenCalledWith(
      'Chunk recovery skipped: already attempted in this session',
      expect.objectContaining({
        context: 'runtime-recovery',
        data: expect.objectContaining({
          reason: 'unhandledrejection',
          outcome: 'skipped_already_attempted',
        }),
      }),
    );
    expect(document.querySelector('[data-recovery-overlay="true"]')).toBeNull();
  });
});
