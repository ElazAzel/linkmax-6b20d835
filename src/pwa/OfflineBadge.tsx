/**
 * OfflineBadge — компактный pill для шапки редактора.
 *
 * Состояния:
 *  • online — ничего не рендерим (тихий канвас).
 *  • offline — амбар-pill «Офлайн • изменения сохраняются локально».
 *  • justRestored — на 4 секунды показываем зелёный «Сеть восстановлена».
 */
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import CloudCheck from 'lucide-react/dist/esm/icons/cloud-check';
import { cn } from '@/lib/utils/utils';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineBadge = memo(function OfflineBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { isOnline, lastOfflineAt } = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowRestored(false);
      return;
    }
    if (wasOfflineRef.current) {
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOnline, lastOfflineAt]);

  if (isOnline && !showRestored) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full',
          'bg-amber-500/10 text-amber-700 dark:text-amber-300',
          'border border-amber-500/20 text-xs font-medium',
          className,
        )}
      >
        <WifiOff className="h-3.5 w-3.5" aria-hidden />
        <span>{t('pwa.offline', 'Офлайн — правки сохраняются локально')}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full',
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        'border border-emerald-500/20 text-xs font-medium',
        'animate-in fade-in slide-in-from-top-1 duration-200',
        className,
      )}
    >
      <CloudCheck className="h-3.5 w-3.5" aria-hidden />
      <span>{t('pwa.restored', 'Сеть восстановлена — синхронизируем')}</span>
    </div>
  );
});
