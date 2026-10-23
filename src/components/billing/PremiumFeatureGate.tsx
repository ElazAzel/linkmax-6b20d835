'use client';
import { useNavigate } from '@/lib/router-compat';

import React from 'react';
import { useTranslation } from 'react-i18next';

import Crown from 'lucide-react/dist/esm/icons/crown';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useFreemiumLimits, type FreeTier } from '@/hooks/user/useFreemiumLimits';
import { hasTierAccess } from '@/domain/billing/tiers';

interface PremiumFeatureGateProps {
  requiredTier: FreeTier;
  feature?: string;
  outcomeKey?: 'forms' | 'crm' | 'analytics' | 'booking' | 'design' | 'ai' | 'export' | 'domain' | 'generic';
  children: React.ReactNode;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function PremiumFeatureGate({
  requiredTier,
  feature,
  outcomeKey = 'generic',
  children,
  showUpgradeButton = true,
  compact = false,
}: PremiumFeatureGateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTier } = useFreemiumLimits();

  const hasAccess = hasTierAccess(currentTier, requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  const tierNames: Record<string, string> = {
    free: 'BASIC',
    starter: 'STARTER',
    identity: 'BASIC',
    pro: 'PRO',
    business: 'BUSINESS',
  };

  const TierIcon = Crown;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative opacity-50 pointer-events-none">
              {children}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-3">
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {t(`freemium.gate.${outcomeKey}`, 'Эта функция приносит больше кликов и заявок в PRO.')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('premium.requiresTier', 'Требуется {{tier}}', { tier: tierNames[requiredTier] })}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // A locked feature is one quiet row in the normal flow. The old overlay sat
  // absolutely on top of the (shorter) locked fields, spilled over the next
  // sections and repeated the full benefits list in every gate.
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Lock className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-foreground">
          {feature || t(`freemium.gate.${outcomeKey}`, 'Эта функция приносит больше кликов и заявок в PRO.')}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <TierIcon className="h-3 w-3" aria-hidden />
          {t('premium.requiresTier', 'Требуется тариф {{tier}}', { tier: tierNames[requiredTier] })}
        </p>
      </div>
      {showUpgradeButton && (
        <Button
          size="sm"
          className="h-9 shrink-0 rounded-full px-4 font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/pricing');
          }}
        >
          {t('freemium.upgradeShort', 'PRO')}
        </Button>
      )}
    </div>
  );
}

// Hook for checking feature access
function useFeatureAccess(requiredTier: FreeTier): boolean {
  const { currentTier } = useFreemiumLimits();

  return hasTierAccess(currentTier, requiredTier);
}
