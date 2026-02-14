import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import {
  getTokenBalance,
  getTokenTransactions,
  addTokens,
  claimDailyReward,
  convertToPremium,
  purchaseItem,
  calculatePriceWithFee,
  requestWithdrawal,
  getWithdrawals,
  TokenBalance,
  TokenTransaction,
  WithdrawalRequest,
  PREMIUM_COST,
  TOKEN_REWARDS,
  PLATFORM_FEE_PERCENT,
  TOKEN_TO_TENGE_RATE,
} from '@/services/tokens';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function useTokens() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
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
      logger.error('Error loading balance', error, { context: 'useTokens' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    const data = await getTokenTransactions(user.id);
    setTransactions(data);
  }, [user]);

  const loadWithdrawals = useCallback(async () => {
    if (!user) return;
    const data = await getWithdrawals(user.id);
    setWithdrawals(data);
  }, [user]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // Claim daily rewards with limit check
  const claimDailyTokens = useCallback(async (
    actionType: 'daily_visit' | 'add_block' | 'use_ai'
  ): Promise<boolean> => {
    if (!user) return false;

    const result = await claimDailyReward(user.id, actionType);

    if (result.success && result.newBalance !== undefined) {
      const amount = TOKEN_REWARDS[actionType];
      setBalance(prev => prev ? {
        ...prev,
        balance: result.newBalance!,
        totalEarned: prev.totalEarned + amount,
      } : null);

      const actionLabels = {
        daily_visit: t('tokens.dailyVisit', 'ежедневный вход'),
        add_block: t('tokens.addBlock', 'добавление блока'),
        use_ai: t('tokens.useAi', 'использование AI'),
      };

      toast.success(t('tokens.toastEarned', '+{{count}} Linkkon за {{action}}!', {
        count: amount,
        action: actionLabels[actionType],
      }));
      return true;
    }

    // Already claimed today - no error toast
    return false;
  }, [user, t]);

  // Legacy method for achievements and referrals
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
      toast.error(t('tokens.insufficientForPremium', 'Недостаточно Linkkon. Нужно {{count}} токенов.', {
        count: PREMIUM_COST,
      }));
      return false;
    }

    setConverting(true);
    try {
      const result = await convertToPremium(user.id);

      if (result.success) {
        toast.success(t('tokens.premiumGranted', '🎉 Вы получили 1 день Premium!'));
        setBalance(prev => prev ? {
          ...prev,
          balance: prev.balance - PREMIUM_COST,
          totalSpent: prev.totalSpent + PREMIUM_COST,
        } : null);
        return true;
      } else {
        const errorMessages: Record<string, string> = {
          insufficient_tokens: t('tokens.insufficientTokens', 'Недостаточно токенов'),
        };
        toast.error(errorMessages[result.error || ''] || t('tokens.convertError', 'Ошибка при конвертации'));
        return false;
      }
    } finally {
      setConverting(false);
    }
  }, [user, balance, t]);

  // Purchase marketplace item
  const purchaseMarketplaceItem = useCallback(async (
    sellerId: string | null,
    itemType: 'template' | 'product' | 'block_access' | 'premium',
    itemId: string,
    price: number,
    description?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const { totalPrice } = calculatePriceWithFee(price);

    if (!balance || balance.balance < totalPrice) {
      toast.error(t('tokens.insufficientForPurchase', {
        count: Number(totalPrice.toFixed(2)),
        defaultValue: 'Недостаточно Linkkon. Нужно {{count}} токенов.',
      }));
      return false;
    }

    const result = await purchaseItem(user.id, sellerId, itemType, itemId, price, description);

    if (result.success) {
      setBalance(prev => prev ? {
        ...prev,
        balance: prev.balance - (result.totalCost || totalPrice),
        totalSpent: prev.totalSpent + (result.totalCost || totalPrice),
      } : null);
      toast.success(t('tokens.purchaseSuccess', '✨ Покупка успешна!'));
      return true;
    } else {
      const errorMessages: Record<string, string> = {
        insufficient_balance: t('tokens.insufficientTokens', 'Недостаточно токенов'),
      };
      toast.error(errorMessages[result.error || ''] || t('tokens.purchaseError', 'Ошибка при покупке'));
      return false;
    }
  }, [user, balance, t]);

  // Request withdrawal (premium only)
  const submitWithdrawal = useCallback(async (
    amount: number,
    paymentMethod: string,
    paymentDetails: Record<string, unknown>
  ): Promise<boolean> => {
    if (!user) return false;

    const result = await requestWithdrawal(user.id, amount, paymentMethod, paymentDetails);

    if (result.success) {
      toast.success(t('tokens.withdrawalCreated', 'Заявка на вывод создана!'));
      loadWithdrawals();
      return true;
    } else {
      const errorMessages: Record<string, string> = {
        premium_required: t('tokens.withdrawalPremiumRequired', 'Вывод доступен только для Premium пользователей'),
        insufficient_balance: t('tokens.insufficientTokens', 'Недостаточно токенов'),
      };
      toast.error(errorMessages[result.error || ''] || t('tokens.withdrawalError', 'Ошибка при создании заявки'));
      return false;
    }
  }, [user, loadWithdrawals, t]);

  const canAffordPremium = balance ? balance.balance >= PREMIUM_COST : false;

  return {
    balance,
    transactions,
    withdrawals,
    loading,
    converting,
    canAffordPremium,
    premiumCost: PREMIUM_COST,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    tokenToTengeRate: TOKEN_TO_TENGE_RATE,
    tokenRewards: TOKEN_REWARDS,
    claimDailyTokens,
    earnTokens,
    buyPremiumDay,
    purchaseMarketplaceItem,
    submitWithdrawal,
    calculatePriceWithFee,
    refresh: loadBalance,
    loadTransactions,
    loadWithdrawals,
  };
}
