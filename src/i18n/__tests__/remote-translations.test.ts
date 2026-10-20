import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { i18n } from 'i18next';

const { sync } = vi.hoisted(() => ({ sync: vi.fn() }));
vi.mock('@/lib/i18n-db-backend', () => ({ syncI18nWithDB: sync }));

describe('remote locale configuration', () => {
  beforeEach(async () => {
    // i18next is a singleton: remove listeners installed by the previous
    // config module before importing a fresh module with different env flags.
    const { default: instance } = await import('i18next');
    instance.off('languageChanged');
    vi.resetModules();
    vi.stubGlobal('requestIdleCallback', () => 0);
    vi.stubEnv('VITE_ENABLE_REMOTE_TRANSLATIONS', '');
    sync.mockReset();
    sync.mockImplementation(async (instance: i18n, lang: string) => {
      // The remote response must never arrive before the bundled fallback.
      expect(Object.keys(instance.getResourceBundle(lang, 'translation'))).not.toHaveLength(0);
      instance.addResourceBundle(lang, 'translation', { remotePriority: 'Saved in admin' }, true, true);
    });
  });

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    delete (window as unknown as Record<string, unknown>)['$_TSR'];
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('enables saved admin overrides by default and applies them after the bundled locale', async () => {
    const { default: i18n, i18nReady, changeLanguageLoaded } = await import('../config');
    await i18nReady;
    await Promise.all([changeLanguageLoaded('uz'), changeLanguageLoaded('uz')]);
    expect(i18n.t('remotePriority')).toBe('Saved in admin');
    expect(sync.mock.calls.filter(([, lang]) => lang === 'uz')).toHaveLength(1);
  });

  it('keeps SSR hydration static until the root browser effect runs', async () => {
    (window as unknown as Record<string, unknown>)['$_TSR'] = {};
    const { i18nReady, changeLanguageLoaded, applyPreferredLanguage } = await import('../config');
    await i18nReady;
    await changeLanguageLoaded('en');
    expect(sync).not.toHaveBeenCalled();
    await applyPreferredLanguage();
    await vi.waitFor(() => expect(sync).toHaveBeenCalled());
  });

  it('retries a failed remote request when the locale is selected again', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    sync.mockRejectedValueOnce(new Error('offline'));
    const { i18nReady, changeLanguageLoaded } = await import('../config');
    await i18nReady;
    await changeLanguageLoaded('uz');
    await changeLanguageLoaded('uz');
    expect(sync.mock.calls.filter(([, lang]) => lang === 'uz')).toHaveLength(2);
  });

  it('honors an explicit remote translation opt-out', async () => {
    vi.stubEnv('VITE_ENABLE_REMOTE_TRANSLATIONS', 'false');
    const { i18nReady, changeLanguageLoaded } = await import('../config');
    await i18nReady;
    await changeLanguageLoaded('uz');
    expect(sync).not.toHaveBeenCalled();
  });

  it('removes omitted remote overrides when rebuilding a replaced locale', async () => {
    const { default: i18n, i18nReady, reloadLanguageResources } = await import('../config');
    await i18nReady;
    i18n.addResourceBundle('uz', 'translation', { removedUploadKey: 'Old uploaded text' }, true, true);
    await reloadLanguageResources('uz');
    expect(i18n.exists('removedUploadKey', { lng: 'uz', fallbackLng: false })).toBe(false);
    expect(i18n.getResource('uz', 'translation', 'remotePriority')).toBe('Saved in admin');
  });
});
