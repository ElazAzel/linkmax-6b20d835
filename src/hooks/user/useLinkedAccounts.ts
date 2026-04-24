import { useCallback, useEffect, useState } from 'react';
import {
  loadLinkedAccounts,
  startOAuthAccountLink,
  unlinkOAuthAccount,
  type LinkedAccount,
  type OAuthAccountProvider,
} from '@/services/account-connections';

export function useLinkedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setAccounts(await loadLinkedAccounts());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const linkAccount = useCallback((provider: OAuthAccountProvider) => {
    return startOAuthAccountLink(provider);
  }, []);

  const unlinkAccount = useCallback(
    async (provider: OAuthAccountProvider) => {
      const result = await unlinkOAuthAccount(provider);
      await refresh();
      return result;
    },
    [refresh]
  );

  return {
    accounts,
    isLoading,
    refresh,
    linkAccount,
    unlinkAccount,
  };
}
