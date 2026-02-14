import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getTokenBalance,
  getTokenTransactions,
  addTokens,
  convertToPremium,
  TokenBalance,
  TokenTransaction,
  PREMIUM_COST,
  TOKEN_REWARDS,
} from '@/services/tokens';
import { toast } from 'sonner';

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      const data = await getTokenBalance(user.id);
      setBalance(data);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    const data = await getTokenTransactions(user.id);
    setTransactions(data);
  }, [user]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const earnTokens = useCallback(async (
    source: keyof typeof TOKEN_REWARDS | string,
    description?: string
  ) => {
    if (!user) return false;

    const amount = TOKEN_REWARDS[source as keyof typeof TOKEN_REWARDS] || 5;
    const result = await addTokens(user.id, amount, source, description);

    if (result.success) {
      setBalance(prev => prev ? {
        ...prev,
        balance: result.newBalance || prev.balance + amount,
        totalEarned: prev.totalEarned + amount,
      } : null);
      return true;
    }
    return false;
  }, [user]);

  const buyPremiumDay = useCallback(async () => {
    if (!user || !balance || balance.balance < PREMIUM_COST) {
      toast.error(`Недостаточно Linkkon. Нужно ${PREMIUM_COST} токенов.`);
      return false;
    }

    setConverting(true);
    try {
      const result = await convertToPremium(user.id);

      if (result.success) {
        toast.success('🎉 Вы получили 1 день Premium!');
        setBalance(prev => prev ? {
          ...prev,
          balance: prev.balance - PREMIUM_COST,
          totalSpent: prev.totalSpent + PREMIUM_COST,
        } : null);
        return true;
      } else {
        const errorMessages: Record<string, string> = {
          insufficient_tokens: 'Недостаточно токенов',
        };
        toast.error(errorMessages[result.error || ''] || 'Ошибка при конвертации');
        return false;
      }
    } finally {
      setConverting(false);
    }
  }, [user, balance]);

  const canAffordPremium = balance ? balance.balance >= PREMIUM_COST : false;

  return {
    balance,
    transactions,
    loading,
    converting,
    canAffordPremium,
    premiumCost: PREMIUM_COST,
    earnTokens,
    buyPremiumDay,
    refresh: loadBalance,
    loadTransactions,
  };
}
