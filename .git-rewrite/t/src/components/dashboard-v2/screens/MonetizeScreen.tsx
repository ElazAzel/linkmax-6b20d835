/**
 * MonetizeScreen - Plan, billing, and premium features
 * Mobile-first with clear upgrade path
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles, CreditCard, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardHeader } from '../layout/DashboardHeader';
import { cn } from '@/lib/utils';

interface PlanLimits {
  pagesUsed: number;
  pagesLimit: number;
  paidPages: number;
  freePages: number;
  blocksUsed: number;
  blocksLimit: number;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number;
}

interface MonetizeScreenProps {
  isPremium: boolean;
  tier: 'free' | 'pro';
  inTrial?: boolean;
  trialEndsAt?: string;
  limits?: PlanLimits;
  onUpgrade?: () => void;
  onManageBilling?: () => void;
}

export const MonetizeScreen = memo(function MonetizeScreen({
  isPremium,
  tier,
  inTrial,
  trialEndsAt,
  limits,
  onUpgrade,
  onManageBilling,
}: MonetizeScreenProps) {
  const { t } = useTranslation();

  const defaultLimits: PlanLimits = limits || {
    pagesUsed: 1,
    pagesLimit: isPremium ? 6 : 1,
    paidPages: isPremium ? 1 : 0,
    freePages: isPremium ? 5 : 1,
    blocksUsed: 5,
    blocksLimit: isPremium ? 50 : 8,
    aiGenerationsUsed: 0,
    aiGenerationsLimit: isPremium ? 20 : 3,
  };

  const freeFeatures = [
    t('dashboard.monetize.free.feature1', 'Basic blocks'),
    t('dashboard.monetize.free.feature2', '1 page'),
    t('dashboard.monetize.free.feature3', '3 AI generations'),
    t('dashboard.monetize.free.feature4', 'Basic analytics'),
  ];

  const proFeatures = [
    t('dashboard.monetize.pro.feature1', 'All 25+ blocks'),
    t('dashboard.monetize.pro.feature2', '6 pages (1 paid + 5 free)'),
    t('dashboard.monetize.pro.feature3', '20 AI generations/month'),
    t('dashboard.monetize.pro.feature4', 'Mini-CRM + Telegram'),
    t('dashboard.monetize.pro.feature5', 'Advanced analytics'),
    t('dashboard.monetize.pro.feature6', 'No watermark'),
    t('dashboard.monetize.pro.feature7', 'Priority support'),
  ];

  const formatTrialEnd = () => {
    if (!trialEndsAt) return '';
    const date = new Date(trialEndsAt);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title={t('dashboard.monetize.title', 'Monetize')}
        subtitle={t('dashboard.monetize.subtitle', 'Your plan and billing')}
      />

      <div className="p-4 space-y-6">
        {/* Current Plan Card */}
        <Card className="rounded-2xl border-border/50 overflow-hidden">
          <div className={cn(
            "p-6",
            isPremium 
              ? "bg-gradient-to-br from-primary/10 to-primary/5" 
              : "bg-gradient-to-br from-muted/50 to-muted"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isPremium ? (
                    <Crown className="w-6 h-6 text-primary" />
                  ) : (
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  )}
                  <Badge 
                    variant={isPremium ? "default" : "secondary"}
                    className={cn(
                      "rounded-lg font-bold",
                      isPremium && "bg-primary text-primary-foreground"
                    )}
                  >
                    {isPremium ? 'PRO' : 'FREE'}
                  </Badge>
                  {inTrial && (
                    <Badge variant="outline" className="rounded-lg">
                      {t('dashboard.monetize.trial', 'Trial')}
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold">
                  {isPremium 
                    ? t('dashboard.monetize.proPlan', 'Pro Plan')
                    : t('dashboard.monetize.freePlan', 'Free Plan')
                  }
                </h2>
                {inTrial && trialEndsAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.monetize.trialEnds', 'Trial ends {{date}}', { date: formatTrialEnd() })}
                  </p>
                )}
              </div>
              {isPremium && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl"
                  onClick={onManageBilling}
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  {t('dashboard.monetize.manageBilling', 'Billing')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Usage Limits */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {t('dashboard.monetize.usage', 'Usage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pages */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('dashboard.monetize.pages', 'Pages')}</span>
                <span className="text-muted-foreground">
                  {defaultLimits.pagesUsed} / {defaultLimits.pagesLimit}
                </span>
              </div>
              <Progress 
                value={(defaultLimits.pagesUsed / defaultLimits.pagesLimit) * 100} 
                className="h-2"
              />
              {isPremium && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.monetize.paidPages', 'Paid Pages')}: {defaultLimits.paidPages} • {t('dashboard.monetize.freePages', 'Free Pages')}: {defaultLimits.freePages}
                </p>
              )}
            </div>
            
            {/* Blocks */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('dashboard.monetize.blocks', 'Blocks')}</span>
                <span className="text-muted-foreground">
                  {defaultLimits.blocksUsed} / {defaultLimits.blocksLimit}
                </span>
              </div>
              <Progress 
                value={(defaultLimits.blocksUsed / defaultLimits.blocksLimit) * 100} 
                className="h-2"
              />
            </div>
            
            {/* AI Generations */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('dashboard.monetize.aiGenerations', 'AI Generations')}</span>
                <span className="text-muted-foreground">
                  {defaultLimits.aiGenerationsUsed} / {defaultLimits.aiGenerationsLimit}
                </span>
              </div>
              <Progress 
                value={(defaultLimits.aiGenerationsUsed / defaultLimits.aiGenerationsLimit) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Section (for free users) */}
        {!isPremium && (
          <Card className="rounded-2xl border-2 border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">
                  {t('dashboard.monetize.upgradeTitle', 'Upgrade to Pro')}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('dashboard.monetize.unlockAll', 'Unlock all features')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('dashboard.monetize.upgradeDescription', 'Get more pages, blocks, AI generations, and premium features.')}
              </p>

              <ul className="space-y-3 mb-6">
                {proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={onUpgrade}
                className="w-full h-14 rounded-2xl font-bold text-lg"
              >
                {t('dashboard.monetize.upgradeCta', 'Upgrade Now')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                {t('dashboard.monetize.guarantee', '14-day money-back guarantee')}
              </p>
            </div>
          </Card>
        )}

        {/* What's included in Pro (for pro users) */}
        {isPremium && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                {t('dashboard.monetize.proIncludes', 'Your Pro benefits')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>{t('dashboard.monetize.secure', 'Secure payment')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{t('dashboard.monetize.noCommission', '0% commission')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
