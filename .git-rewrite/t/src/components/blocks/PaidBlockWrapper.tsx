/**
 * Wrapper component for paid blocks - handles token-based unlocking
 */
import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Coins, Unlock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { redirectToTokenPurchase } from '@/lib/token-purchase-helper';
import type { BlockStyle } from '@/types/page';

interface PaidBlockWrapperProps {
  blockId: string;
  blockStyle?: BlockStyle;
  pageOwnerId?: string;
  children: React.ReactNode;
  isPreview?: boolean;
}

// Store unlocked blocks in session
const unlockedBlocks = new Set<string>();

export const PaidBlockWrapper = memo(function PaidBlockWrapper({
  blockId,
  blockStyle,
  pageOwnerId,
  children,
  isPreview = false,
}: PaidBlockWrapperProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { balance, purchaseMarketplaceItem, refresh } = useTokens();
  const [unlocking, setUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const isPaidContent = blockStyle?.isPaidContent || false;
  const price = blockStyle?.paidContentPrice || 0;

  // Check if already unlocked
  useEffect(() => {
    if (!isPaidContent) return;
    
    // Owner always sees content
    if (user?.id === pageOwnerId) {
      setIsUnlocked(true);
      return;
    }

    // Check session cache
    if (unlockedBlocks.has(blockId)) {
      setIsUnlocked(true);
      return;
    }

    // Check database for purchase
    const checkPurchase = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('token_transactions')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('item_type', 'block_access')
        .eq('item_id', blockId)
        .limit(1);

      if (data && data.length > 0) {
        setIsUnlocked(true);
        unlockedBlocks.add(blockId);
      }
    };

    checkPurchase();
  }, [user, blockId, pageOwnerId, isPaidContent]);

  // If not paid content, just render children
  if (!isPaidContent || price <= 0) {
    return <>{children}</>;
  }

  // In preview mode, owner sees content with badge
  if (isPreview && user?.id === pageOwnerId) {
    return (
      <div className="relative">
        <Badge className="absolute top-2 right-2 z-10 bg-amber-500/90">
          <Lock className="h-3 w-3 mr-1" />
          {price} Linkkon
        </Badge>
        {children}
      </div>
    );
  }

  // Owner always sees content
  if (user?.id === pageOwnerId || isUnlocked) {
    return <>{children}</>;
  }

  const handleUnlock = async () => {
    if (!user) {
      toast.error(t('paidContent.loginRequired', 'Войдите в аккаунт для покупки'));
      return;
    }

    const currentBalance = balance?.balance || 0;
    
    if (currentBalance < price) {
      const deficit = price - currentBalance;
      toast.info(t('paidContent.notEnoughTokens', { count: Math.ceil(deficit), defaultValue: `Недостаточно токенов. Нужно еще ${Math.ceil(deficit)} Linkkon.` }));
      redirectToTokenPurchase(deficit, t('paidContent.content', 'контент'));
      return;
    }

    setUnlocking(true);
    try {
      const success = await purchaseMarketplaceItem(
        pageOwnerId || null,
        'block_access',
        blockId,
        price,
        t('paidContent.unlockDescription', 'Разблокировка платного контента')
      );

      if (success) {
        setIsUnlocked(true);
        unlockedBlocks.add(blockId);
        refresh();
      }
    } finally {
      setUnlocking(false);
    }
  };

  // Show locked state
  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      {/* Blurred preview */}
      <div className="blur-lg opacity-30 pointer-events-none select-none">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 bg-background/60 backdrop-blur-sm">
        <div className="text-center space-y-3 sm:space-y-4 max-w-xs">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
          </div>
          
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-1">{t('paidContent.title', 'Платный контент')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('paidContent.unlockWithTokens', 'Разблокируйте этот контент за Linkkon токены')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-base sm:text-lg px-3 py-1.5 bg-amber-500/10 text-amber-600">
              <Coins className="h-4 w-4 mr-1.5" />
              {price} Linkkon
            </Badge>
          </div>

          <Button
            onClick={handleUnlock}
            disabled={unlocking}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-11 sm:h-12"
          >
            {unlocking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('paidContent.unlocking', 'Разблокировка...')}
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                {t('paidContent.unlock', 'Разблокировать')}
              </>
            )}
          </Button>

          {balance && (
            <p className="text-xs text-muted-foreground">
              {t('paidContent.yourBalance', 'Ваш баланс')}: {balance.balance.toFixed(0)} Linkkon
            </p>
          )}
        </div>
      </div>
    </Card>
  );
});