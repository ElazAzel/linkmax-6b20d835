'use client';
import { useNavigate } from 'react-router-dom';

import React from 'react';
import { useTranslation } from 'react-i18next';

import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useFreemiumLimits, type FreeTier } from '@/hooks/user/useFreemiumLimits';

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

  // Tier hierarchy: free < pro
  const tierLevel = (tier: FreeTier): number => {
    switch (tier) {
      case 'business': return 3;
      case 'pro': return 2;
      default: return 1;
    }
  };

  const hasAccess = tierLevel(currentTier) >= tierLevel(requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  const tierNames: Record<string, string> = {
    free: 'BASIC',
    starter: 'BASIC',
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

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 backdrop-blur-md rounded-lg p-5 border border-primary/20 shadow-xl z-20 transition-all hover:bg-background/98">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-primary/20">
          <TierIcon className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1.5 text-center">
          <p className="text-base font-bold text-foreground max-w-[280px] leading-tight">
            {t(`freemium.gate.${outcomeKey}`, 'Эта функция приносит больше кликов и заявок в PRO.')}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {t('premium.requiresTier', 'Требуется тариф {{tier}}', {
              tier: tierNames[requiredTier]
            })}
          </p>
        </div>
        {showUpgradeButton && (
          <Button
            size="default"
            className="mt-2 w-full max-w-[200px] h-10 font-bold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md transition-transform hover:scale-[1.02] rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/pricing');
            }}
          >
            {t('freemium.upgradePro', 'Включить PRO')}
          </Button>
        )}
      </div>
    </div>
  );
}

// Hook for checking feature access
export function useFeatureAccess(requiredTier: FreeTier): boolean {
  const { currentTier } = useFreemiumLimits();

  const tierLevel = (tier: FreeTier): number => {
    switch (tier) {
      case 'pro': return 2;
      default: return 1;
    }
  };

  return tierLevel(currentTier) >= tierLevel(requiredTier);
}
