import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { logger } from '@/lib/utils/logger';

export interface FinanceMetrics {
  totalRevenue: number;
  netProfit: number;
  feesPaid: number;
  pendingRevenue: number;
  leadsCount: number;
  convertedLeadsCount: number;
  conversionRate: number;
  history: {
    date: string;
    revenue: number;
    profit: number;
  }[];
}

/**
 * Hook for aggregating financial metrics from leads and transactions.
 * Used in the "Finance Insights" dashboard widget.
 */
export function useFinanceMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Fetch wallet transactions (gross/fee/net schema)
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions' as any)
        .select('gross_amount, net_amount, fee_amount, status, created_at, type')
        .eq('user_id', user.id);

      // 2. Fetch leads for conversion stats
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('status, created_at')
        .eq('user_id', user.id);

      if (txError) {
        // Gracefully handle case where table might not exist yet or user has no wallet
        if (txError.code !== 'PGRST116' && txError.code !== '42P01') {
          logger.error('Error fetching transactions', txError);
        }
      }

      if (leadsError) {
        logger.error('Error fetching leads for metrics', leadsError);
      }

      const transactions = (txData || []) as any[];
      const leads = (leadsData || []) as any[];

      // Aggregators
      let totalRevenue = 0;
      let netProfit = 0;
      let feesPaid = 0;
      let pendingRevenue = 0;

      transactions.forEach(tx => {
        const gross = Number(tx.gross_amount || 0);
        const net = Number(tx.net_amount || 0);
        const fee = Number(tx.fee_amount || 0);

        // Consider 'completed' or 'success' as final
        if (tx.status === 'completed' || tx.status === 'success') {
          totalRevenue += gross;
          netProfit += net;
          feesPaid += fee;
        } else if (tx.status === 'pending') {
          pendingRevenue += gross;
        }
      });

      const leadsCount = leads.length;
      const convertedLeadsCount = leads.filter(l => l.status === 'converted' || l.status === 'won').length;
      const conversionRate = leadsCount > 0 ? (convertedLeadsCount / leadsCount) * 100 : 0;

      // 30-day historical trend
      const historyMap = new Map<string, { revenue: number, profit: number }>();
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        historyMap.set(dateStr, { revenue: 0, profit: 0 });
      }

      transactions.forEach(tx => {
        if (tx.status === 'completed' || tx.status === 'success') {
          const dateStr = new Date(tx.created_at).toISOString().split('T')[0];
          if (historyMap.has(dateStr)) {
            const current = historyMap.get(dateStr)!;
            current.revenue += Number(tx.gross_amount || 0);
            current.profit += Number(tx.net_amount || 0);
          }
        }
      });

      const history = Array.from(historyMap.entries()).map(([date, vals]) => ({
        date,
        ...vals
      })).sort((a, b) => a.date.localeCompare(b.date));

      setMetrics({
        totalRevenue,
        netProfit,
        feesPaid,
        pendingRevenue,
        leadsCount,
        convertedLeadsCount,
        conversionRate,
        history
      });
    } catch (error) {
      logger.error('Critical error in useFinanceMetrics', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
    
    // Subscribe to changes in transactions for real-time updates
    const channel = supabase
      .channel('finance-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'wallet_transactions',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics, user?.id]);

  return {
    metrics,
    loading,
    refresh: fetchMetrics
  };
}
