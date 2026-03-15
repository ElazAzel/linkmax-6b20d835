import { logger } from '@/lib/utils/logger';

export const CHUNK_RECOVERY_KEY = 'linkmax_chunk_recovery_once';

const BUILD_CACHE_KEY_PREFIXES = [
  'linkmax-build-',
  'linkmax-build:',
  'linkmax-chunk-',
  'linkmax-chunk:',
  'vite-preload-error',
  'vite:preload-error',
] as const;

const BUILD_CACHE_NAME_PREFIXES = ['lnkmx-', 'linkmax-', 'vite-'] as const;

export type RecoveryReason = 'window.error' | 'unhandledrejection';
export type RecoveryOutcome =
  | 'skipped_already_attempted'
  | 'reloaded_after_cleanup'
  | 'reloaded_without_cache_api'
  | 'reloaded_after_failure';

function showRecoveryScreen(doc: Document): void {
  const overlay = doc.createElement('div');
  overlay.setAttribute('data-recovery-overlay', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.background = 'linear-gradient(180deg, #0f172a 0%, #111827 100%)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '24px';
  overlay.style.color = '#f8fafc';
  overlay.style.textAlign = 'center';
  overlay.innerHTML = `
    <div style="font-size:24px;font-weight:700;margin-bottom:8px;">Обновляем приложение</div>
    <div style="font-size:14px;opacity:0.8;max-width:420px;line-height:1.5;">
      Обнаружили устаревшие файлы. Сейчас обновим приложение и вернём вас в работу.
    </div>
  `;

  doc.body?.appendChild(overlay);
}

function removeTechnicalBuildKeys(storage: Storage): string[] {
  const removed: string[] = [];
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (!key) continue;

    if (BUILD_CACHE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      storage.removeItem(key);
      removed.push(key);
    }
  }
  return removed;
}

function isRelevantCacheName(name: string): boolean {
  return BUILD_CACHE_NAME_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export function isChunkRuntimeError(err: unknown): boolean {
  const message = typeof err === 'string'
    ? err
    : (err as { message?: string })?.message || '';

  return [
    'ChunkLoadError',
    'Loading chunk',
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'O is not a function',
  ].some((token) => message.includes(token));
}

export function recoverFromStaleAssets(reason: RecoveryReason): void {
  const alreadyAttempted = window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1';
  if (alreadyAttempted) {
    logger.warn('Chunk recovery skipped: already attempted in this session', {
      context: 'runtime-recovery',
      data: { reason, outcome: 'skipped_already_attempted' satisfies RecoveryOutcome },
    });
    return;
  }

  window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');

  logger.warn('Chunk recovery started', {
    context: 'runtime-recovery',
    data: { reason },
  });

  try {
    showRecoveryScreen(window.document);

    let removedKeys = 0;
    try {
      removedKeys = removeTechnicalBuildKeys(window.localStorage).length;
    } catch {
      // ignore localStorage access issues
    }

    const reloadWithOutcome = (outcome: RecoveryOutcome): void => {
      logger.warn('Chunk recovery finished', {
        context: 'runtime-recovery',
        data: { reason, outcome, removedKeys },
      });

      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
    };

    if ('caches' in window) {
      caches.keys()
        .then((names) => Promise.all(
          names
            .filter((name) => isRelevantCacheName(name))
            .map((name) => caches.delete(name)),
        ))
        .then(() => {
          reloadWithOutcome('reloaded_after_cleanup');
        })
        .catch(() => {
          reloadWithOutcome('reloaded_after_failure');
        });
      return;
    }

    reloadWithOutcome('reloaded_without_cache_api');
  } catch {
    logger.error('Chunk recovery failed unexpectedly', undefined, {
      context: 'runtime-recovery',
      data: { reason, outcome: 'reloaded_after_failure' satisfies RecoveryOutcome },
    });
    window.location.reload();
  }
}
