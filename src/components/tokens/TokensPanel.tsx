import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/lib/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTokens } from '@/hooks/user/useTokens';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';
import { TOKEN_REWARDS, PLATFORM_FEE_PERCENT, TOKEN_TO_TENGE_RATE } from '@/services/tokens';
import Coins from 'lucide-react/dist/esm/icons/coins';
import Crown from 'lucide-react/dist/esm/icons/crown';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ArrowDownToLine from 'lucide-react/dist/esm/icons/arrow-down-to-line';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import { cn } from '@/lib/utils/utils';

interface TokensPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokensPanel({ open, onOpenChange }: TokensPanelProps) {
  const { t, i18n } = useTranslation();
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
    return formatDateTime(dateStr, i18n.language);
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

  const premiumEndsDate = trialEndsAt ? formatDateTime(trialEndsAt, i18n.language) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-warning" />
            Linkkon Токены
          </DialogTitle>
          <DialogDescription className="sr-only">
            Управляйте своими токенами, покупайте премиум и выводите средства
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance Card */}
          <Card className="bg-warning/12 p-6 border-warning/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="h-8 w-8 text-warning" />
                <span className="text-4xl font-bold text-warning">
                  {loading ? '...' : (balance?.balance || 0).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Ваш баланс Linkkon</p>
              <p className="text-xs text-muted-foreground mt-1">
                1 Linkkon = {TOKEN_TO_TENGE_RATE} ₸
              </p>

              {balance && (
                <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span>Заработано: {balance.totalEarned.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3 text-primary" />
                    <span>Потрачено: {balance.totalSpent.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Premium Status */}
          {isPremium && premiumEndsDate && (
            <Card className="p-4 border-primary/30">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Premium активен</p>
                  <p className="text-xs text-muted-foreground">до {premiumEndsDate}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Convert to Premium */}
          <Card className="p-4 bg-card border-border/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary-foreground" />
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
          <Card className="p-4 bg-card border-border/30">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Как заработать Linkkon
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ежедневный вход</span>
                <span className="font-medium text-warning">+{TOKEN_REWARDS.daily_visit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Добавить блок (1 раз/день)</span>
                <span className="font-medium text-warning">+{TOKEN_REWARDS.add_block}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Использовать AI</span>
                <span className="font-medium text-warning">+{TOKEN_REWARDS.use_ai}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Пригласить друга (с блоком)</span>
                <span className="font-medium text-warning">+{TOKEN_REWARDS.referral}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Каждые 3 реферала</span>
                <span className="font-medium text-primary">+1 день Premium</span>
              </div>
            </div>
          </Card>

          {/* What you can buy */}
          <Card className="p-4 bg-card border-border/30">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-success" />
              На что потратить
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Premium подписка</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-success/12 text-success">
                  100 / день
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-info" />
                <span className="text-muted-foreground">Шаблоны страниц</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-success/12 text-success">
                  Активно
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground">Товары пользователей</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-success/12 text-success">
                  Активно
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Платные блоки</span>
                <Badge variant="secondary" className="text-xs ml-auto bg-success/12 text-success">
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
            <Card className="bg-success/12 p-4 border-success/30">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-success" />
                Вывод средств
                <Badge variant="outline" className="text-xs ml-auto bg-success/12 border-success/30">
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
            <Card className="p-4 bg-card border-border/30 max-h-48 overflow-y-auto">
              <h4 className="font-medium text-sm mb-3">Последние транзакции</h4>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-muted-foreground">{tx.description || tx.source}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={cn(
                      'font-medium',
                      tx.type === 'earn' || tx.type === 'bonus' ? 'text-success' : 'text-destructive'
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
