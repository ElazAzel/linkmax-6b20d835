import { useCallback, useEffect, useState } from 'react';
import {
  disconnectGoogleCalendar,
  getGoogleCalendarAuthUrl,
  loadGoogleCalendarStatus,
  type GoogleCalendarIntegrationStatus,
} from '@/services/google-calendar-integration';

const DISCONNECTED_STATUS: GoogleCalendarIntegrationStatus = {
  isConnected: false,
  updatedAt: null,
};

export function useGoogleCalendarIntegration() {
  const [status, setStatus] = useState<GoogleCalendarIntegrationStatus>(DISCONNECTED_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setStatus(await loadGoogleCalendarStatus());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const connect = useCallback((redirectUrl: string) => {
    return getGoogleCalendarAuthUrl(redirectUrl);
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectGoogleCalendar();
    setStatus(DISCONNECTED_STATUS);
  }, []);

  const markConnectedNow = useCallback(() => {
    setStatus({
      isConnected: true,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  return {
    status,
    isLoading,
    refresh,
    connect,
    disconnect,
    markConnectedNow,
  };
}
