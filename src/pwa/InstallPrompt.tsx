/**
 * InstallPrompt — ненавязчивый toast/баннер «Установить lnkmx.my как приложение».
 *
 * Логика:
 *  • Ловим событие `beforeinstallprompt` (Chrome/Edge/Android).
 *  • Показываем баннер один раз; дальше состояние хранится в localStorage:
 *      - 'lnkmx:install:dismissed'  → больше не показывать.
 *      - 'lnkmx:install:installed'  → уже установлено.
 *  • На iOS Safari beforeinstallprompt не работает — отдельный compact-hint
 *    с инструкцией «Поделиться → На экран Домой» появится только если пользователь
 *    явно открыл Settings / About (тут не рендерим, чтобы не шуметь).
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Download from 'lucide-react/dist/esm/icons/download';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

const DISMISSED_KEY = 'lnkmx:install:dismissed';
const INSTALLED_KEY = 'lnkmx:install:installed';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

function shouldShow(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return false;
    const storage = window.localStorage;
    if (storage.getItem(DISMISSED_KEY)) return false;
    if (storage.getItem(INSTALLED_KEY)) return false;
    return true;
  } catch {
    return false;
  }
}

export const InstallPrompt = memo(function InstallPrompt({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      try {
        window.localStorage.setItem(INSTALLED_KEY, String(Date.now()));
      } catch {
        // ignore
      }
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'dismissed') {
        try { window.localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* noop */ }
      }
    } catch {
      // ignore
    } finally {
      setDeferred(null);
      setVisible(false);
    }
  }, [deferred]);

  const handleDismiss = useCallback(() => {
    try { window.localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* noop */ }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[60]',
        'bottom-[calc(env(safe-area-inset-bottom)+5rem)] md:bottom-6',
        'w-[min(420px,calc(100vw-1.5rem))]',
        'flex items-center gap-3 p-3 pr-2 rounded-2xl',
        'bg-background/95 backdrop-blur-md shadow-lg border border-border/40',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        className,
      )}
    >
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Download className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p id="install-prompt-title" className="text-sm font-semibold leading-tight truncate">
          {t('pwa.install.title', 'Установить lnkmx.my')}
        </p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
          {t('pwa.install.subtitle', 'Быстрый запуск с домашнего экрана')}
        </p>
      </div>
      <Button size="sm" className="h-9 rounded-xl font-semibold shrink-0" onClick={handleInstall}>
        {t('pwa.install.cta', 'Установить')}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg shrink-0"
        aria-label={t('common.close', 'Закрыть')}
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
});
