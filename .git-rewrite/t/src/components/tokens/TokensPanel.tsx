import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTokens } from '@/hooks/useTokens';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Coins, Crown, ArrowRight, Sparkles, TrendingUp, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokensPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokensPanel({ open, onOpenChange }: TokensPanelProps) {
  const { t } = useTranslation();
  const { balance, loading, converting, canAffordPremium, premiumCost, buyPremiumDay, loadTransactions, transactions } = useTokens();
  const { isPremium, trialEndsAt } = usePremiumStatus();
  const [showHistory, setShowHistory] = useState(false);

  const handleShowHistory = async () => {
    await loadTransactions();
    setShowHistory(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const premiumEndsDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Linkkon Токены
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance Card */}
          <Card className="p-6 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-amber-500/20 border-yellow-500/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="h-8 w-8 text-yellow-500" />
                <span className="text-4xl font-bold text-yellow-500">
                  {loading ? '...' : balance?.balance || 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Ваш баланс Linkkon</p>
              
              {balance && (
                <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>Заработано: {balance.totalEarned}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3 text-violet-500" />
                    <span>Потрачено: {balance.totalSpent}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Premium Status */}
          {isPremium && premiumEndsDate && (
            <Card className="p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-violet-400" />
                <div>
                  <p className="font-medium text-sm">Premium активен</p>
                  <p className="text-xs text-muted-foreground">до {premiumEndsDate}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Convert to Premium */}
          <Card className="p-4 bg-card/60 border-border/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">1 день Premium</p>
                  <p className="text-xs text-muted-foreground">{premiumCost} Linkkon</p>
                </div>
              </div>
              <Button
                size="sm"
                disabled={!canAffordPremium || converting}
                onClick={buyPremiumDay}
                className="gap-1"
              >
                {converting ? 'Конвертация...' : 'Получить'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            
            {!canAffordPremium && (
              <p className="text-xs text-muted-foreground mt-2">
                Не хватает {premiumCost - (balance?.balance || 0)} токенов
              </p>
            )}
          </Card>

          {/* How to earn */}
          <Card className="p-4 bg-card/60 border-border/30">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Как заработать Linkkon
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ежедневный вход</span>
                <span className="font-medium text-yellow-500">+5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Добавить блок</span>
                <span className="font-medium text-yellow-500">+10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Использовать AI</span>
                <span className="font-medium text-yellow-500">+15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Пригласить друга</span>
                <span className="font-medium text-yellow-500">+50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">3 реферала</span>
                <span className="font-medium text-violet-500">+1 день Premium</span>
              </div>
            </div>
          </Card>

          {/* History Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleShowHistory}
          >
            История транзакций
          </Button>

          {/* Transaction History */}
          {showHistory && transactions.length > 0 && (
            <Card className="p-4 bg-card/60 border-border/30 max-h-48 overflow-y-auto">
              <h4 className="font-medium text-sm mb-3">Последние транзакции</h4>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-muted-foreground">{tx.description || tx.source}</p>
                      <p className="text-xs text-muted-foreground/70">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={cn(
                      'font-medium',
                      tx.amount > 0 ? 'text-green-500' : 'text-red-400'
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
