import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTokens } from '@/hooks/useTokens';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { TOKEN_REWARDS, PLATFORM_FEE_PERCENT, TOKEN_TO_TENGE_RATE } from '@/services/tokens';
import { 
  Coins, Crown, ArrowRight, Sparkles, TrendingUp, Gift, 
  Wallet, ShoppingBag, LayoutTemplate, Lock, Loader2,
  ArrowDownToLine, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokensPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokensPanel({ open, onOpenChange }: TokensPanelProps) {
  const { t } = useTranslation();
  const { 
    balance, loading, converting, canAffordPremium, premiumCost, 
    buyPremiumDay, loadTransactions, transactions, loadWithdrawals,
    withdrawals, submitWithdrawal
  } = useTokens();
  const { isPremium, trialEndsAt } = usePremiumStatus();
  const [showHistory, setShowHistory] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCard, setWithdrawCard] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const handleShowHistory = async () => {
    await loadTransactions();
    setShowHistory(true);
  };

  const handleShowWithdrawals = async () => {
    await loadWithdrawals();
    setShowWithdraw(true);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawCard) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setWithdrawing(true);
    const success = await submitWithdrawal(amount, 'card', { cardNumber: withdrawCard });
    setWithdrawing(false);
    
    if (success) {
      setWithdrawAmount('');
      setWithdrawCard('');
      await loadWithdrawals();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWithdrawalStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { icon: Clock, variant: 'secondary', label: 'На рассмотрении' },
      approved: { icon: CheckCircle2, variant: 'default', label: 'Одобрено' },
      completed: { icon: CheckCircle2, variant: 'default', label: 'Выполнено' },
      rejected: { icon: XCircle, variant: 'destructive', label: 'Отклонено' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {c.label}
      </Badge>
    );
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
                  {loading ? '...' : (balance?.balance || 0).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Ваш баланс Linkkon</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                1 Linkkon = {TOKEN_TO_TENGE_RATE} ₸
              </p>
              
              {balance && (
                <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>Заработано: {balance.totalEarned.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3 text-violet-500" />
                    <span>Потрачено: {balance.totalSpent.toFixed(1)}</span>
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
                {converting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {converting ? 'Конвертация...' : 'Получить'}
                {!converting && <ArrowRight className="h-3 w-3" />}
              </Button>
            </div>
            
            {!canAffordPremium && (
              <p className="text-xs text-muted-foreground mt-2">
                Не хватает {(premiumCost - (balance?.balance || 0)).toFixed(1)} токенов
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
                <span className="font-medium text-yellow-500">+{TOKEN_REWARDS.daily_visit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Добавить блок (1 раз/день)</span>
                <span className="font-medium text-yellow-500">+{TOKEN_REWARDS.add_block}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Использовать AI</span>
                <span className="font-medium text-yellow-500">+{TOKEN_REWARDS.use_ai}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Пригласить друга (с блоком)</span>
                <span className="font-medium text-yellow-500">+{TOKEN_REWARDS.referral}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Каждые 3 реферала</span>
                <span className="font-medium text-violet-500">+1 день Premium</span>
              </div>
            </div>
          </Card>

          {/* What you can buy */}
          <Card className="p-4 bg-card/60 border-border/30">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
              На что потратить
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-violet-500" />
                <span className="text-muted-foreground">Premium подписка</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-green-500/20 text-green-600">
                  100 / день
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Шаблоны страниц</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-green-500/20 text-green-600">
                  Активно
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Товары пользователей</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-green-500/20 text-green-600">
                  Активно
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-pink-500" />
                <span className="text-muted-foreground">Платные блоки</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-green-500/20 text-green-600">
                  Активно
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Комиссия платформы: {PLATFORM_FEE_PERCENT}%
            </p>
          </Card>

          {/* Withdraw (Premium only) */}
          {isPremium && (
            <Card className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Вывод средств
                <Badge variant="outline" className="text-xs ml-auto bg-emerald-500/20 border-emerald-500/30">
                  Premium
                </Badge>
              </h4>
              
              {!showWithdraw ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleShowWithdrawals}
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Вывести на карту
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Сумма (Linkkon)</Label>
                    <Input
                      type="number"
                      placeholder="Минимум 100"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min={100}
                      max={balance?.balance || 0}
                    />
                    {withdrawAmount && (
                      <p className="text-xs text-muted-foreground">
                        = {parseFloat(withdrawAmount) * TOKEN_TO_TENGE_RATE} ₸
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Номер карты</Label>
                    <Input
                      placeholder="4400 1234 5678 9012"
                      value={withdrawCard}
                      onChange={(e) => setWithdrawCard(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!withdrawAmount || !withdrawCard || withdrawing || parseFloat(withdrawAmount) < 100}
                    onClick={handleWithdraw}
                  >
                    {withdrawing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Создать заявку
                  </Button>

                  {withdrawals.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Ваши заявки:</p>
                      {withdrawals.slice(0, 3).map((w) => (
                        <div key={w.id} className="flex justify-between items-center text-xs p-2 rounded bg-muted/30">
                          <div>
                            <span className="font-medium">{w.amount} Linkkon</span>
                            <p className="text-muted-foreground">{formatDate(w.createdAt)}</p>
                          </div>
                          {getWithdrawalStatusBadge(w.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

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
                      tx.type === 'earn' || tx.type === 'bonus' ? 'text-green-500' : 'text-red-400'
                    )}>
                      {tx.type === 'earn' || tx.type === 'bonus' ? '+' : '-'}{Math.abs(tx.amount).toFixed(1)}
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
