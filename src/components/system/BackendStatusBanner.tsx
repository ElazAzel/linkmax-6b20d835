/**
 * BackendStatusBanner — единый баннер деградации.
 *
 * Показывается когда:
 *  • браузер офлайн, или
 *  • бэкенд отвечает ошибками (сеть/5xx) несколько раз подряд.
 *
 * Вместо пустых экранов пользователь видит понятный статус и кнопку «повторить».
 */
import { memo, useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import CloudOff from 'lucide-react/dist/esm/icons/cloud-off';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { cn } from '@/lib/utils/utils';
import { useOnlineStatus } from '@/pwa/useOnlineStatus';
import { getBackendHealth, subscribeBackendHealth } from '@/lib/resilience/backend-health';

export const BackendStatusBanner = memo(function BackendStatusBanner() {
  const { t } = useTranslation();
  const { isOnline } = useOnlineStatus();
  const health = useSyncExternalStore(subscribeBackendHealth, getBackendHealth, getBackendHealth);
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  // При возврате сети автоматически перезапрашиваем всё, что упало.
  useEffect(() => {
    if (isOnline && health.state !== 'ok') {
      void queryClient.refetchQueries({ type: 'active' });
    }
  }, [isOnline, health.state, queryClient]);

  const offline = !isOnline;
  const backendDown = health.state === 'down';
  if (!offline && !backendDown) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'sticky top-0 z-[60] w-full px-3 py-2',
        'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center',
        'text-xs sm:text-sm font-medium border-b',
        offline
          ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20'
          : 'bg-destructive/10 text-destructive border-destructive/20',
      )}
    >
      {offline ? (
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="break-words">
        {offline
          ? t('resilience.offlineBanner', 'Нет сети — работаем в офлайн-режиме, правки сохраняются локально')
          : t('resilience.backendDown', 'Сервер временно недоступен — показываем последние сохранённые данные')}
      </span>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="inline-flex items-center gap-1.5 underline underline-offset-2 disabled:opacity-60"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', retrying && 'animate-spin')} aria-hidden />
        {t('resilience.retry', 'Повторить')}
      </button>
    </div>
  );
});
