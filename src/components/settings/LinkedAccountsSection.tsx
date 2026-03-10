/**
 * LinkedAccountsSection - Manage linked OAuth accounts
 * Allows users to link/unlink Google and Apple accounts
 * and connect Google Calendar integration via OAuth 2.0
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import Unlink from 'lucide-react/dist/esm/icons/unlink';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import CalendarSync from 'lucide-react/dist/esm/icons/calendar-sync';
import { supabase } from '@/platform/supabase/client';


import { cn } from '@/lib/utils/utils';

interface LinkedAccount {
  provider: 'email' | 'google' | 'apple';
  email?: string;
  linked: boolean;
}

interface LinkedAccountsSectionProps {
  userEmail?: string;
}

export function LinkedAccountsSection({ userEmail }: LinkedAccountsSectionProps) {
  const { t } = useTranslation();
  const { handleError } = useAppError();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  // Google Calendar Integration State
  const [gcalIsLoading, setGcalIsLoading] = useState(true);
  const [gcalIsConnected, setGcalIsConnected] = useState(false);
  const [gcalLastSync, setGcalLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadLinkedAccounts();
    checkGcalIntegration();
  }, []);

  // Handle OAuth error params from Supabase auth redirect
  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const authError = searchParams.get('auth_error');
    const authErrorDescription = searchParams.get('auth_error_description');

    if (authError) {
      toast.error(t('settings.linkedAccounts.linkFailedReason', 'Failed to link account: {{reason}}', {
        reason: authErrorDescription || authError
      }));
      cleanupUrlParams(['auth_error', 'auth_error_description']);
    }
  }, [t]);

  // Handle Google Calendar OAuth callback params
  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const gcalConnected = searchParams.get('gcal_connected');
    const gcalError = searchParams.get('gcal_error');

    if (gcalConnected === 'true') {
      toast.success(t('settings.integrations.gcalConnected', 'Google Calendar успешно подключён!'));
      setGcalIsConnected(true);
      setGcalLastSync(new Date().toISOString());
      cleanupUrlParams(['gcal_connected']);
    }

    if (gcalError) {
      toast.error(t('settings.integrations.gcalFailed', 'Ошибка подключения Google Calendar: {{reason}}', {
        reason: gcalError
      }));
      cleanupUrlParams(['gcal_error']);
    }
  }, [t]);

  /** Remove specified query params from current URL without reload */
  const cleanupUrlParams = (params: string[]) => {
    const newUrl = new URL(window.location.href);
    params.forEach(p => newUrl.searchParams.delete(p));
    window.history.replaceState(null, '', newUrl.toString());
  };

  const loadLinkedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const identities = user.identities || [];

      const accounts: LinkedAccount[] = [
        {
          provider: 'email',
          email: user.email,
          linked: identities.some(i => i.provider === 'email') || !!user.email,
        },
        {
          provider: 'google',
          email: identities.find(i => i.provider === 'google')?.identity_data?.email,
          linked: identities.some(i => i.provider === 'google'),
        },
        {
          provider: 'apple',
          email: identities.find(i => i.provider === 'apple')?.identity_data?.email,
          linked: identities.some(i => i.provider === 'apple'),
        },
      ];

      setLinkedAccounts(accounts);
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'apple') => {
    setLinkingProvider(provider);
    try {
      // Manual linking is disabled in this Supabase project.
      // Use signInWithOAuth — Supabase auto-links identities when
      // the OAuth email matches an existing account ("automatic linking").
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard/settings`,
        },
      });

      if (error) {
        console.error('Link account error:', error);
        toast.error(t('settings.linkedAccounts.linkFailed', 'Не удалось привязать аккаунт'));
        setLinkingProvider(null);
        return;
      }

      // Browser will redirect to the OAuth provider → Supabase auto-links → redirects back
    } catch (error) {
      console.error('Link account exception:', error);
      toast.error(t('settings.linkedAccounts.linkFailed', 'Не удалось привязать аккаунт'));
      setLinkingProvider(null);
    }
  };

  const handleUnlinkAccount = async (provider: 'google' | 'apple') => {
    const linkedCount = linkedAccounts.filter(a => a.linked).length;
    if (linkedCount <= 1) {
      toast.error(t('settings.linkedAccounts.cannotUnlinkLast', 'You must have at least one login method'));
      return;
    }

    setLinkingProvider(provider);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const identity = user.identities?.find(i => i.provider === provider);
      if (!identity) {
        toast.error(t('settings.linkedAccounts.identityNotFound', 'Identity not found or already unlinked'));
        await loadLinkedAccounts();
        setLinkingProvider(null);
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(identity);

      if (error) {
        if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('primary')) {
          toast.error(t('settings.linkedAccounts.primaryIdentity', 'Основной метод входа отвязать нельзя. В настройках Supabase также должно быть включено Manual Linking.'));
          await loadLinkedAccounts();
        } else if (error.message?.includes('Manual linking is disabled') || error.status === 422) {
          toast.error('Отвязка и ручная привязка отключены в вашем проекте Supabase. Включите "Manual Linking" в настройках Authentication -> Providers.', { duration: 6000 });
        } else {
          handleError(error, t('settings.linkedAccounts.unlinkFailed', 'Failed to unlink account'));
        }
      } else {
        toast.success(t('settings.linkedAccounts.unlinkSuccess', 'Account unlinked'));
        await loadLinkedAccounts();
      }
    } catch (error) {
      toast.error(t('settings.linkedAccounts.unlinkFailed', 'Failed to unlink account'));
    } finally {
      setLinkingProvider(null);
    }
  };

  // ─── Google Calendar Integration Functions ───

  const checkGcalIntegration = async () => {
    try {
      setGcalIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_integrations_status' as any)
        .select('is_connected, updated_at')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .maybeSingle() as any;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setGcalIsConnected(!!data?.is_connected);
      if (data?.updated_at) {
        setGcalLastSync(data.updated_at);
      }
    } catch (error) {
      console.error('Error checking gcal integration:', error);
    } finally {
      setGcalIsLoading(false);
    }
  };

  const handleConnectGcal = async () => {
    setLinkingProvider('google_calendar');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const redirectUrl = `${window.location.origin}/dashboard/settings`;

      // Call Edge Function to get the Google OAuth consent URL
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'get_auth_url',
          payload: { redirect_url: redirectUrl },
        },
      });

      if (error) {
        console.error('get_auth_url error:', error);
        toast.error(t('settings.integrations.gcalFailed', 'Ошибка подключения Google Calendar'));
        setLinkingProvider(null);
        return;
      }

      if (!data?.auth_url) {
        toast.error(t('settings.integrations.gcalNotConfigured', 'Google Calendar не настроен на сервере'));
        setLinkingProvider(null);
        return;
      }

      toast.info(t('settings.integrations.gcalRedirecting', 'Перенаправление в Google...'));

      // Redirect to Google OAuth Consent Screen
      window.location.href = data.auth_url;
    } catch (err) {
      console.error(err);
      toast.error(t('settings.integrations.gcalFailed', 'Ошибка подключения Google Calendar'));
      setLinkingProvider(null);
    }
  };

  const handleDisconnectGcal = async () => {
    setLinkingProvider('google_calendar');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'disconnect',
          payload: {},
        },
      });

      if (error) {
        console.error('disconnect error:', error);
        toast.error(t('settings.integrations.gcalDisconnectFailed', 'Ошибка отключения Google Calendar'));
      } else {
        toast.success(t('settings.integrations.gcalDisconnected', 'Google Calendar отключен'));
        setGcalIsConnected(false);
        setGcalLastSync(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('settings.integrations.gcalDisconnectFailed', 'Ошибка отключения Google Calendar'));
    } finally {
      setLinkingProvider(null);
    }
  };

  const getProviderIcon = (provider: string) => {
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
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      default:
        return t('settings.linkedAccounts.email', 'Email');
    }
  };

  const getProviderBgColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-destructive/15';
      case 'apple':
        return 'bg-muted';
      default:
        return 'bg-primary/15';
    }
  };

  const getProviderIconColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'text-destructive';
      case 'apple':
        return 'text-foreground';
      default:
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
        {linkedAccounts.map((account) => (
          <div key={account.provider} className="flex items-center gap-4 p-4">
            <div className={cn(
              "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
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
                {account.provider === 'apple' && !account.linked && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase tracking-wider font-bold opacity-70">
                    {t('common.coming_soon', 'Скоро')}
                  </Badge>
                )}
              </div>
              {account.email && (
                <p className="text-sm text-muted-foreground truncate">{account.email}</p>
              )}
            </div>
            {account.provider !== 'email' && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl"
                disabled={linkingProvider !== null || (account.provider === 'apple' && !account.linked)}
                onClick={() => account.linked ? handleUnlinkAccount(account.provider as 'google' | 'apple') : handleLinkAccount(account.provider as 'google' | 'apple')}
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
        ))}
      </Card>

      {/* Integrations Section */}
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1 mt-8">
        {t('settings.integrations.title', 'Интеграции')}
      </h3>
      <Card className="divide-y divide-border/50 overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 bg-blue-500/15">
            <CalendarSync className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">Google Calendar</span>
              {gcalIsConnected && (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  {t('settings.integrations.active', 'Активно')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {t('settings.integrations.gcalDesc', 'Синхронизация бронирований с календарем')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            disabled={linkingProvider === 'google_calendar' || gcalIsLoading}
            onClick={() => gcalIsConnected ? handleDisconnectGcal() : handleConnectGcal()}
          >
            {linkingProvider === 'google_calendar' || gcalIsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : gcalIsConnected ? (
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
        </div>
      </Card>
    </div>
  );
}
