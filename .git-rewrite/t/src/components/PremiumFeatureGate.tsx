import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useFreemiumLimits, type FreeTier } from '@/hooks/useFreemiumLimits';

interface PremiumFeatureGateProps {
  requiredTier: FreeTier;
  feature: string;
  children: React.ReactNode;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function PremiumFeatureGate({
  requiredTier,
  feature,
  children,
  showUpgradeButton = true,
  compact = false,
}: PremiumFeatureGateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTier } = useFreemiumLimits();

  // Tier hierarchy: free < pro < business
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

  const tierNames = {
    free: 'BASIC',
    pro: 'PRO',
    business: 'BUSINESS',
  };

  const TierIcon = requiredTier === 'business' ? Sparkles : Crown;

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
          <TooltipContent>
            <p>
              {t('premium.requiresTier', 'Требуется {{tier}}', { tier: tierNames[requiredTier] })}
            </p>
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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          requiredTier === 'business' 
            ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
            : 'bg-gradient-to-br from-violet-500 to-purple-600'
        }`}>
          <TierIcon className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-medium text-center">
          {t('premium.featureRequires', '{{feature}} доступно в {{tier}}', { 
            feature, 
            tier: tierNames[requiredTier] 
          })}
        </p>
        {showUpgradeButton && (
          <Button 
            size="sm" 
            variant="default"
            className={requiredTier === 'business' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
              : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
            }
            onClick={() => navigate('/pricing')}
          >
            {t('premium.upgrade', 'Улучшить до {{tier}}', { tier: tierNames[requiredTier] })}
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
      case 'business': return 3;
      case 'pro': return 2;
      default: return 1;
    }
  };

  return tierLevel(currentTier) >= tierLevel(requiredTier);
}
