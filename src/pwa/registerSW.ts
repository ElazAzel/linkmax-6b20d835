/**
 * Guarded Service Worker registration.
 *
 * Rules (per Lovable PWA skill):
 *  - Never register in dev / Lovable preview / iframe.
 *  - Support `?sw=off` kill switch.
 *  - In refused contexts, unregister any existing `/sw.js`.
 */
import { logger } from '@/lib/utils/logger';

const SW_PATH = '/sw.js';

const PREVIEW_HOSTNAME_SUFFIXES = [
  '.lovableproject.com',
  '.lovableproject-dev.com',
  '.beta.lovable.dev',
  '.lovable.app', // covers id-preview--*.lovable.app
];

function isRefusedContext(): { refused: true; reason: string } | { refused: false } {
  if (typeof window === 'undefined') return { refused: true, reason: 'no-window' };
  if (!import.meta.env.PROD) return { refused: true, reason: 'dev-mode' };

  try {
    if (window.self !== window.top) return { refused: true, reason: 'iframe' };
  } catch {
    return { refused: true, reason: 'iframe-cross-origin' };
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get('sw') === 'off') return { refused: true, reason: 'sw=off' };

  const host = url.hostname;
  if (host.startsWith('id-preview--') || host.startsWith('preview--')) {
    return { refused: true, reason: 'lovable-preview-host' };
  }
  if (
    host === 'lovableproject.com' ||
    host === 'lovableproject-dev.com' ||
    host === 'beta.lovable.dev'
  ) {
    return { refused: true, reason: 'lovable-host' };
  }
  if (PREVIEW_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    // Allow the published linkmax.lovable.app subdomain explicitly (it's the production
    // publish target). Everything else under .lovable.app is a preview.
    if (host === 'linkmax.lovable.app') return { refused: false };
    return { refused: true, reason: 'lovable-preview-suffix' };
  }

  return { refused: false };
}

async function unregisterAppSW(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
          return url.endsWith(SW_PATH);
        })
        .map((r) => r.unregister()),
    );
  } catch (err) {
    logger.warn(`SW unregister failed: ${String(err)}`, { context: 'pwa' });
  }
}

export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const ctx = isRefusedContext();
  if (ctx.refused) {
    logger.info(`SW registration skipped (${ctx.reason})`, { context: 'pwa' });
    void unregisterAppSW();
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_PATH)
      .then((reg) => {
        logger.info('SW registered', { context: 'pwa', scope: reg.scope });
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              logger.info('New SW content available', { context: 'pwa' });
            }
          };
        };
      })
      .catch((err) => logger.error('SW registration failed', err, { context: 'pwa' }));
  });
}
