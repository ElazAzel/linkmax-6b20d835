import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  ShieldCheck, 
  ArrowUpRight,
  History,
  Info,
  Banknote
} from 'lucide-react';
import { motion } from 'framer-motion';

export const TMAPaymentsScreen: React.FC = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="p-6 space-y-8 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tma.paymentsTitle', 'TMA Payments')}</h1>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Secure</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          {t('tma.paymentsSubtitle', 'Manage native Telegram payments and checkout experience.')}
        </p>
      </div>

      {/* Main Balance Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-zinc-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  {t('tma.availableBalance', 'Available Balance')}
                </p>
                <h2 className="text-4xl font-bold mt-1">$0.00</h2>
              </div>
              <Button className="bg-white text-black hover:bg-zinc-200">
                {t('tma.withdraw', 'Withdraw')}
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <div className="flex-1">
                <p className="text-zinc-500 text-xs uppercase">{t('tma.pendingFunds', 'Pending')}</p>
                <p className="text-lg font-semibold">$0.00</p>
              </div>
              <div className="flex-1">
                <p className="text-zinc-500 text-xs uppercase">{t('tma.thisMonth', 'This Month')}</p>
                <p className="text-lg font-semibold">$0.00</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Methods */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{t('tma.gateways', 'Payment Gateways')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('tma.gatewaysDesc', 'Enable various payment providers supported by Telegram Stars and native checkout.')}
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold text-[10px]">Stripe</div>
                  <span className="text-sm font-medium">Stripe</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-yellow-400 flex items-center justify-center text-black font-bold text-lg">★</div>
                  <span className="text-sm font-medium">Telegram Stars</span>
                </div>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] uppercase">Enabled</Badge>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Security & Verification */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 space-y-4 bg-muted/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-bold">{t('tma.security', 'Transaction Security')}</h3>
            </div>
            <div className="p-4 bg-white rounded-xl border border-zinc-100 flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">{t('tma.verificationRequired', 'Verification Required')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('tma.verificationDesc', 'Complete your identity verification to enable direct bank payouts.')}
                </p>
                <Button variant="link" className="p-0 h-auto text-xs text-blue-500 underline">
                  {t('tma.startVerification', 'Start Verification Now')}
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              * Payments processed through Telegram are subject to Telegram's Terms of Service and common platform fees (up to 30% for Apple/Google transactions).
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Transaction History Placeholder */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{t('tma.recentTransactions', 'Recent Activity')}</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              {t('common.viewAll', 'View All')}
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 opacity-40">
            <div className="p-4 rounded-full bg-muted">
              <History className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">{t('tma.noTransactions', 'No transactions yet.')}</p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
