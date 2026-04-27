/**
 * LinkedAccountsSection - manage OAuth login methods and calendar integrations.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import { useGoogleCalendarIntegration } from '@/hooks/user/useGoogleCalendarIntegration';
import { useLinkedAccounts } from '@/hooks/user/useLinkedAccounts';
import type {
  LinkedAccountProvider,
  OAuthAccountProvider,
} from '@/services/account-connections';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Unlink from 'lucide-react/dist/esm/icons/unlink';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import CalendarSync from 'lucide-react/dist/esm/icons/calendar-sync';
import { cn } from '@/lib/utils/utils';

interface LinkedAccountsSectionProps {
  userEmail?: string;
}

type LinkingProvider = OAuthAccountProvider | 'google_calendar' | null;

function isOAuthProvider(provider: LinkedAccountProvider): provider is OAuthAccountProvider {
  return provider === 'google' || provider === 'apple';
}

function cleanupUrlParams(params: string[]) {
  const newUrl = new URL(window.location.href);
  params.forEach((param) => newUrl.searchParams.delete(param));
  window.history.replaceState(null, '', newUrl.toString());
}

export function LinkedAccountsSection({ userEmail }: LinkedAccountsSectionProps) {
  const { t } = useTranslation();
  const { handleError } = useAppError();
  const {
    accounts: linkedAccounts,
    isLoading,
    linkAccount,
    unlinkAccount,
    refresh: refreshLinkedAccounts,
  } = useLinkedAccounts();
  const {
    status: calendarStatus,
    isLoading: gcalIsLoading,
    connect: connectGoogleCalendar,
    disconnect: disconnectGoogleCalendar,
    refresh: refreshGoogleCalendar,
    markConnectedNow,
  } = useGoogleCalendarIntegration();
  const [linkingProvider, setLinkingProvider] = useState<LinkingProvider>(null);

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const authError = searchParams.get('auth_error');
    const authErrorDescription = searchParams.get('auth_error_description');

    if (!authError) return;

    toast.error(t('settings.linkedAccounts.linkFailedReason', 'Failed to link account: {{reason}}', {
      reason: authErrorDescription || authError,
    }));
    cleanupUrlParams(['auth_error', 'auth_error_description']);
    refreshLinkedAccounts().catch((error) => {
      handleError(error, t('settings.linkedAccounts.loadFailed', 'Failed to refresh login methods'));
    });
  }, [handleError, refreshLinkedAccounts, t]);

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const gcalConnected = searchParams.get('gcal_connected');
    const gcalError = searchParams.get('gcal_error');

    if (gcalConnected === 'true') {
      toast.success(t('settings.integrations.gcalConnected', 'Google Calendar connected'));
      markConnectedNow();
      refreshGoogleCalendar().catch((error) => {
        handleError(error, t('settings.integrations.gcalStatusFailed', 'Failed to refresh Google Calendar status'));
      });
      cleanupUrlParams(['gcal_connected']);
    }

    if (gcalError) {
      toast.error(t('settings.integrations.gcalFailed', 'Google Calendar connection failed: {{reason}}', {
        reason: gcalError,
      }));
      cleanupUrlParams(['gcal_error']);
    }
  }, [handleError, markConnectedNow, refreshGoogleCalendar, t]);

  const handleLinkAccount = async (provider: OAuthAccountProvider) => {
    setLinkingProvider(provider);
    try {
      await linkAccount(provider);
    } catch (error) {
      handleError(error, t('settings.linkedAccounts.linkFailed', 'Failed to link account'));
      setLinkingProvider(null);
    }
  };

  const handleUnlinkAccount = async (provider: OAuthAccountProvider) => {
    const linkedCount = linkedAccounts.filter((account) => account.linked).length;
    if (linkedCount <= 1) {
      toast.error(t('settings.linkedAccounts.cannotUnlinkLast', 'You must have at least one login method'));
      return;
    }

    setLinkingProvider(provider);
    try {
      const result = await unlinkAccount(provider);
      if (!result.identityFound) {
        toast.error(t('settings.linkedAccounts.identityNotFound', 'Identity not found or already unlinked'));
        return;
      }

      toast.success(t('settings.linkedAccounts.unlinkSuccess', 'Account unlinked'));
    } catch (error) {
      handleError(error, t('settings.linkedAccounts.unlinkFailed', 'Failed to unlink account'));
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleConnectGcal = async () => {
    setLinkingProvider('google_calendar');
    try {
      const authUrl = await connectGoogleCalendar(`${window.location.origin}/dashboard/settings`);
      toast.info(t('settings.integrations.gcalRedirecting', 'Redirecting to Google...'));
      window.location.href = authUrl;
    } catch (error) {
      handleError(error, t('settings.integrations.gcalFailed', 'Google Calendar connection failed'));
      setLinkingProvider(null);
    }
  };

  const handleDisconnectGcal = async () => {
    setLinkingProvider('google_calendar');
    try {
      await disconnectGoogleCalendar();
      toast.success(t('settings.integrations.gcalDisconnected', 'Google Calendar disconnected'));
    } catch (error) {
      handleError(error, t('settings.integrations.gcalDisconnectFailed', 'Failed to disconnect Google Calendar'));
    } finally {
      setLinkingProvider(null);
    }
  };

  const getProviderIcon = (provider: LinkedAccountProvider) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        );
      case 'apple':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        );
      case 'email':
        return <Mail className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: LinkedAccountProvider) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'email':
        return t('settings.linkedAccounts.email', 'Email');
    }
  };

  const getProviderBgColor = (provider: LinkedAccountProvider) => {
    switch (provider) {
      case 'google':
        return 'bg-destructive/15';
      case 'apple':
        return 'bg-muted';
      case 'email':
        return 'bg-primary/15';
    }
  };

  const getProviderIconColor = (provider: LinkedAccountProvider) => {
    switch (provider) {
      case 'google':
        return 'text-destructive';
      case 'apple':
        return 'text-foreground';
      case 'email':
        return 'text-primary';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
        {t('settings.linkedAccounts.title', 'Login Methods')}
      </h3>
      <Card className="divide-y divide-border/50 overflow-hidden">
        {linkedAccounts.map((account) => {
          const accountEmail = account.provider === 'email' ? account.email || userEmail : account.email;
          const oauthProvider = isOAuthProvider(account.provider) ? account.provider : null;

          return (
            <div key={account.provider} className="flex items-center gap-4 p-4">
              <div className={cn(
                'h-11 w-11 rounded-2xl flex items-center justify-center shrink-0',
                getProviderBgColor(account.provider)
              )}>
                <div className={getProviderIconColor(account.provider)}>
                  {getProviderIcon(account.provider)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getProviderName(account.provider)}</span>
                  {account.linked && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      {t('settings.linkedAccounts.connected', 'Connected')}
                    </Badge>
                  )}
                </div>
                {accountEmail && (
                  <p className="text-sm text-muted-foreground truncate">{accountEmail}</p>
                )}
              </div>
              {oauthProvider && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-xl"
                  disabled={linkingProvider !== null}
                  onClick={() => account.linked ? handleUnlinkAccount(oauthProvider) : handleLinkAccount(oauthProvider)}
                >
                  {linkingProvider === account.provider ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : account.linked ? (
                    <>
                      <Unlink className="h-4 w-4 mr-1" />
                      {t('settings.linkedAccounts.unlink', 'Unlink')}
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-1" />
                      {t('settings.linkedAccounts.link', 'Link')}
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </Card>

      {/* Google Calendar integration временно скрыта до конфигурации OAuth-секретов
          (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GCAL_STATE_SECRET).
          Раскомментировать после добавления секретов в Lovable Cloud. */}
    </div>
  );
}
