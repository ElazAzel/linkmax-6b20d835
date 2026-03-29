import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Lock from 'lucide-react/dist/esm/icons/lock';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FREE_LIMITS } from '@/hooks/user/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/utils/upgrade-utils';

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
              <div className="space-y-1 mt-1">
                <p className="font-bold text-foreground">{t('freemium.blockLimitReached', 'Базовых 5 блоков достаточно для старта 🚀')}</p>
                <p className="text-muted-foreground leading-snug">{t('freemium.blockLimitDesc', 'Включи PRO, чтобы добавить форму заявок, товары и собрать полноценный лендинг без ограничений.')}</p>
              </div>
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
              className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 w-full font-bold shadow-lg shadow-primary/25 rounded-xl h-10"
            >
              <Crown className="h-4 w-4 mr-2" />
              {t('freemium.upgradePro', 'Включить PRO')}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
});
