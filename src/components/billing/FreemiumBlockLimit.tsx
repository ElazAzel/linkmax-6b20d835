import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Crown, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FREE_LIMITS } from '@/hooks/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/upgrade-utils';

interface FreemiumBlockLimitProps {
  currentBlocks: number;
  isPremium: boolean;
}

export const FreemiumBlockLimit = memo(function FreemiumBlockLimit({
  currentBlocks,
  isPremium,
}: FreemiumBlockLimitProps) {
  const { t } = useTranslation();
  
  if (isPremium) return null;
  
  const remaining = FREE_LIMITS.maxBlocks - currentBlocks;
  const percentage = (currentBlocks / FREE_LIMITS.maxBlocks) * 100;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 2 && remaining > 0;
  
  if (currentBlocks === 0) return null;
  
  return (
    <Alert 
      variant={isAtLimit ? 'destructive' : 'default'} 
      className={`mb-4 ${isNearLimit ? 'border-amber-500 bg-amber-500/10' : ''}`}
    >
      <div className="flex items-start gap-3 w-full">
        {isAtLimit ? (
          <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
        )}
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-sm">
            {isAtLimit ? (
              <span>{t('freemium.blockLimitReached', 'Достигнут лимит блоков. Перейдите на Premium для неограниченного количества.')}</span>
            ) : (
              <span>
                {t('freemium.blocksRemaining', 'Осталось блоков: {{count}} из {{max}}', {
                  count: remaining,
                  max: FREE_LIMITS.maxBlocks,
                })}
              </span>
            )}
          </AlertDescription>
          
          <Progress value={percentage} className="h-1.5" />
          
          {(isAtLimit || isNearLimit) && (
            <Button 
              size="sm" 
              onClick={openPremiumPurchase}
              className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              {t('freemium.upgradeToPremium', 'Перейти на Premium')}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
});
