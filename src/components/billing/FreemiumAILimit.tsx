import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FREE_LIMITS } from '@/hooks/user/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/utils/upgrade-utils';

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
        <TooltipContent side="bottom" className="max-w-xs p-4 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-xl">
          <div className="space-y-3">
            {isAtLimit ? (
              <>
                <p className="text-sm font-bold text-foreground">
                  {t('freemium.aiLimitReached', 'Стартовая генерация исчерпана')}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('freemium.aiLimitDesc', 'С PRO-тарифом наш AI генерирует десятки продающих заголовков и описаний, чтобы увеличить клики.')}
                </p>
              </>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground">
                {t('freemium.aiGenerationsRemaining', 'Осталось AI генераций: {{count}}', { count: remainingGenerations })}
              </p>
            )}
            
            <Button 
              size="sm" 
              onClick={openPremiumPurchase}
              className="w-full h-9 rounded-lg font-bold bg-gradient-to-r from-violet-500 to-purple-600 shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              <Crown className="h-4 w-4 mr-1.5" />
              {t('freemium.moreAIGenerations', '10 генераций в месяц с PRO')}
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
