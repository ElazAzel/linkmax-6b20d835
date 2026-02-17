/**
 * LinkedAccountsSection - Manage linked OAuth accounts
 * Allows users to link/unlink Google and Apple accounts
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Link2, Unlink, Loader2 } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';


import { cn } from '@/lib/utils';

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
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadLinkedAccounts();
  }, []);

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
      const { data, error } = await supabase.auth.linkIdentity({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Link identity error:', error);
        toast.error(error.message || t('settings.linkedAccounts.linkFailed', 'Failed to link account'));
        setLinkingProvider(null);
        return;
      }

      // If successful, the browser will redirect to the OAuth provider
    } catch (error) {
      console.error('Link identity exception:', error);
      toast.error(t('settings.linkedAccounts.linkFailed', 'Failed to link account'));
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
      if (!identity) return;

      const { error } = await supabase.auth.unlinkIdentity(identity);

      if (error) {
        toast.error(error.message || t('settings.linkedAccounts.unlinkFailed', 'Failed to unlink account'));
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
                disabled={linkingProvider !== null}
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
    </div>
  );
}
