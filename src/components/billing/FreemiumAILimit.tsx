import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Crown, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FREE_LIMITS } from '@/hooks/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/upgrade-utils';

interface FreemiumAILimitProps {
  remainingGenerations: number;
  isPremium: boolean;
}

export const FreemiumAILimit = memo(function FreemiumAILimit({
  remainingGenerations,
  isPremium,
}: FreemiumAILimitProps) {
  const { t } = useTranslation();
  
  if (isPremium) return null;
  
  const isAtLimit = remainingGenerations <= 0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isAtLimit ? 'destructive' : 'secondary'}
            className="cursor-help flex items-center gap-1"
          >
            {isAtLimit ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            <span>
              AI: {remainingGenerations}/{FREE_LIMITS.maxAIPageGenerationsPerMonth}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isAtLimit 
                ? t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан')
                : t('freemium.aiGenerationsRemaining', 'Осталось AI генераций в этом месяце: {{count}}', { count: remainingGenerations })
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {t('freemium.aiLimitResetsMonthly', 'Лимит обновляется каждый месяц')}
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={openPremiumPurchase}
              className="w-full mt-2"
            >
              <Crown className="h-3 w-3 mr-1.5 text-amber-500" />
              {t('freemium.moreAIGenerations', '5 генераций в месяц')}
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});