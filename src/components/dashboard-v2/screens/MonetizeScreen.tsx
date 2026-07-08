/**
 * MonetizeScreen - Plan, billing, and premium features
 * Mobile-first with clear upgrade path
 * Updated for 4-tier model: Identity/Starter/Pro/Business (ADR 0026)
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Check from 'lucide-react/dist/esm/icons/check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Shield from 'lucide-react/dist/esm/icons/shield';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardHeader } from '../layout/DashboardHeader';
import { cn } from '@/lib/utils/utils';

interface PlanLimits {
  pagesUsed: number;
  pagesLimit: number;
  paidPages: number;
  freePages: number;
  blocksUsed: number;
  blocksLimit: number | null;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number | null;
}

interface MonetizeScreenProps {
  isPremium: boolean;
  tier: 'identity' | 'starter' | 'pro' | 'business';
  inTrial?: boolean;
  trialEndsAt?: string;
  limits?: PlanLimits;
  onUpgrade?: () => void;
  onManageBilling?: () => void;
}

// Tier display configuration
const TIER_CONFIG = {
  identity: {
    name: 'IDENTITY',
    icon: Zap,
    color: 'from-slate-400 to-slate-500',
    badge: 'secondary' as const,
    commission: null,
  },
  starter: {
    name: 'STARTER',
    icon: Rocket,
    color: 'from-emerald-500 to-teal-600',
    badge: 'default' as const,
    commission: '7%',
  },
  pro: {
    name: 'PRO',
    icon: Crown,
    color: 'from-violet-500 to-purple-600',
    badge: 'default' as const,
    commission: '1%',
  },
  business: {
    name: 'BUSINESS',
    icon: Building2,
    color: 'from-amber-500 to-orange-600',
    badge: 'default' as const,
    commission: '0%',
  },
};

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

  const currentTierConfig = TIER_CONFIG[tier] || TIER_CONFIG.identity;
  const TierIcon = currentTierConfig.icon;

  const defaultLimits: PlanLimits = limits || {
    pagesUsed: 1,
    pagesLimit: tier === 'identity' ? 1 : tier === 'starter' ? 3 : 6,
    paidPages: tier === 'pro' || tier === 'business' ? 1 : 0,
    freePages: tier === 'identity' ? 1 : tier === 'starter' ? 3 : 5,
    blocksUsed: 5,
    blocksLimit: (tier === "pro" || tier === "business") ? null : (tier === "identity" ? 10 : 50),
    aiGenerationsUsed: 0,
    aiGenerationsLimit: (tier === "pro" || tier === "business") ? null : (tier === "identity" ? 1 : tier === "starter" ? 5 : 20),
  };

  // Features by tier
  const identityFeatures = [
    t('dashboard.monetize.identity.feature1', 'Basic blocks'),
    t('dashboard.monetize.identity.feature2', '1 page'),
    t('dashboard.monetize.identity.feature3', '1 AI generation/month'),
    t('dashboard.monetize.identity.feature4', 'LinkMAX watermark'),
  ];

  const starterFeatures = [
    t('dashboard.monetize.starter.feature1', 'All 25+ blocks'),
    t('dashboard.monetize.starter.feature2', '3 pages'),
    t('dashboard.monetize.starter.feature3', 'Full CRM access'),
    t('dashboard.monetize.starter.feature4', 'Telegram notifications'),
    t('dashboard.monetize.starter.feature5', 'No watermark'),
    t('dashboard.monetize.starter.feature6', '7% commission on transactions'),
  ];

  const proFeatures = [
    t('dashboard.monetize.pro.feature1', 'All 25+ blocks'),
    t('dashboard.monetize.pro.feature2', '6 pages (1 paid + 5 free)'),
    t('dashboard.monetize.pro.feature3', '20 AI generations/month'),
    t('dashboard.monetize.pro.feature4', 'Full CRM + analytics'),
    t('dashboard.monetize.pro.feature5', 'Custom domain'),
    t('dashboard.monetize.pro.feature6', 'Priority support'),
    t('dashboard.monetize.pro.feature7', '1% commission only'),
  ];

  const businessFeatures = [
    t('dashboard.monetize.business.feature1', 'Everything in Pro'),
    t('dashboard.monetize.business.feature2', 'Business Zones'),
    t('dashboard.monetize.business.feature3', 'Team CRM & Kanban'),
    t('dashboard.monetize.business.feature4', 'Up to 5 team members'),
    t('dashboard.monetize.business.feature5', 'Role-based access'),
    t('dashboard.monetize.business.feature6', '0% commission'),
  ];

  const getFeatures = () => {
    switch (tier) {
      case 'business': return businessFeatures;
      case 'pro': return proFeatures;
      case 'starter': return starterFeatures;
      default: return identityFeatures;
    }
  };

  const formatTrialEnd = () => {
    if (!trialEndsAt) return '';
    const date = new Date(trialEndsAt);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = () => {
    switch (tier) {
      case 'business': return t('dashboard.monetize.businessPlan', 'Business Plan');
      case 'pro': return t('dashboard.monetize.proPlan', 'Pro Plan');
      case 'starter': return t('dashboard.monetize.starterPlan', 'Starter Plan');
      default: return t('dashboard.monetize.identityPlan', 'Identity Plan');
    }
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
            tier !== 'identity'
              ? `bg-gradient-to-br ${currentTierConfig.color}/10`
              : "bg-gradient-to-br from-muted/50 to-muted"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TierIcon className={cn(
                    "w-6 h-6",
                    tier !== 'identity' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Badge
                    variant={currentTierConfig.badge}
                    className={cn(
                      "rounded-lg font-bold",
                      tier !== 'identity' && "bg-primary text-primary-foreground"
                    )}
                  >
                    {currentTierConfig.name}
                  </Badge>
                  {inTrial && (
                    <Badge variant="outline" className="rounded-lg">
                      {t('dashboard.monetize.trial', 'Trial')}
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold">{getPlanName()}</h2>
                {inTrial && trialEndsAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.monetize.trialEnds', 'Trial ends {{date}}', { date: formatTrialEnd() })}
                  </p>
                )}
                {currentTierConfig.commission && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.monetize.commissionRate', 'Transaction fee: {{rate}}', { rate: currentTierConfig.commission })}
                  </p>
                )}
              </div>
              {tier !== 'identity' && (
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
              {(tier === 'pro' || tier === 'business') && (
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
                  {defaultLimits.blocksUsed} / {defaultLimits.blocksLimit == null ? '∞' : defaultLimits.blocksLimit}
                </span>
              </div>
              <Progress
                value={defaultLimits.blocksLimit == null ? 10 : (defaultLimits.blocksUsed / defaultLimits.blocksLimit) * 100}
                className="h-2"
              />
            </div>

            {/* AI Generations */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('dashboard.monetize.aiGenerations', 'AI Generations')}</span>
                <span className="text-muted-foreground">
                  {defaultLimits.aiGenerationsUsed} / {defaultLimits.aiGenerationsLimit == null ? '∞' : defaultLimits.aiGenerationsLimit}
                </span>
              </div>
              <Progress
                value={defaultLimits.aiGenerationsLimit == null ? 10 : (defaultLimits.aiGenerationsUsed / defaultLimits.aiGenerationsLimit) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Section (for identity/starter users) */}
        {(tier === 'identity' || tier === 'starter') && (
          <Card className="rounded-2xl border-2 border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">
                  {tier === 'identity'
                    ? t('dashboard.monetize.upgradeToStarter', 'Upgrade to Starter — FREE')
                    : t('dashboard.monetize.upgradeToPro', 'Upgrade to Pro')
                  }
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">
                {tier === 'identity'
                  ? t('dashboard.monetize.unlockCRM', 'Unlock CRM & notifications')
                  : t('dashboard.monetize.reduceFees', 'Reduce fees to 1%')
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {tier === 'identity'
                  ? t('dashboard.monetize.starterDescription', 'Get full CRM access, all blocks, and grow your business. Free to use, 7% on transactions.')
                  : t('dashboard.monetize.proDescription', 'Get custom domain, advanced analytics, and reduce commission to just 1%.')
                }
              </p>

              <ul className="space-y-3 mb-6">
                {(tier === 'identity' ? starterFeatures : proFeatures).map((feature, i) => (
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
                {tier === 'identity'
                  ? t('dashboard.monetize.activateStarter', 'Activate Starter — Free')
                  : t('dashboard.monetize.upgradeCta', 'Upgrade Now')
                }
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {tier === 'starter' && (
                <p className="text-xs text-center text-muted-foreground mt-4">
                  {t('dashboard.monetize.guarantee', '14-day money-back guarantee')}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* What's included (for pro/business users) */}
        {(tier === 'pro' || tier === 'business') && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TierIcon className="w-5 h-5 text-primary" />
                {t('dashboard.monetize.yourBenefits', 'Your {{plan}} benefits', { plan: currentTierConfig.name })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {getFeatures().map((feature, i) => (
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
            <span>
              {tier === 'business'
                ? t('dashboard.monetize.noCommission', '0% commission')
                : tier === 'pro'
                  ? t('dashboard.monetize.lowCommission', '1% commission')
                  : tier === 'starter'
                    ? t('dashboard.monetize.starterCommission', '7% commission')
                    : t('dashboard.monetize.freeTier', 'Free tier')
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
