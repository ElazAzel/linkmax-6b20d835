/**
 * useOnlineStatus — reactive online/offline state with reconnect counter.
 * Полностью клиентский, без зависимостей. Возвращает stable объект.
 */
import { useEffect, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  /** Время (ms epoch) последнего перехода в offline. null если ещё ни разу не падали. */
  lastOfflineAt: number | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [state, setState] = useState<OnlineStatus>(() => ({
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    lastOfflineAt: null,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const onOffline = () => setState({ isOnline: false, lastOfflineAt: Date.now() });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return state;
}
