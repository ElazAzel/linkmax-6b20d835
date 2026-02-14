/**
 * FreePremiumBlockGate - Visual separation for Free vs Premium blocks
 * Shows lock overlay and upgrade prompts for premium-only blocks
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FREE_BLOCK_TYPES, 
  PREMIUM_BLOCK_TYPES, 
  isFreeBlock, 
  isPremiumBlock,
  type FreeBlockType,
  type PremiumBlockType 
} from '@/lib/block-registry';

// Re-export from registry for backward compatibility
export { FREE_BLOCK_TYPES, PREMIUM_BLOCK_TYPES, isFreeBlock, isPremiumBlock };
export type { FreeBlockType, PremiumBlockType };

// Backward compatibility alias
export const isFreeSlock = isFreeBlock;

interface PremiumBlockOverlayProps {
  blockType: string;
  className?: string;
}

export const PremiumBlockOverlay = memo(function PremiumBlockOverlay({
  blockType,
  className,
}: PremiumBlockOverlayProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={cn(
      "absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center",
      "bg-gradient-to-t from-background/95 via-background/80 to-background/60",
      "backdrop-blur-sm rounded-2xl",
      className
    )}>
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-xl shadow-amber-500/30">
        <Crown className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2">
        {t('premium.blockLocked', 'Блок Premium')}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {t('premium.unlockWith', 'Разблокируйте этот блок с подпиской Pro')}
      </p>
      <Button 
        size="sm" 
        className="h-10 px-5 rounded-xl font-bold shadow-lg shadow-primary/25"
        onClick={() => navigate('/pricing')}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {t('premium.upgrade', 'Перейти на Pro')}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
});

interface TierBadgeProps {
  tier: 'free' | 'pro';
  className?: string;
  size?: 'sm' | 'md';
}

export const BlockTierBadge = memo(function BlockTierBadge({
  tier,
  className,
  size = 'sm',
}: TierBadgeProps) {
  const { t } = useTranslation();

  if (tier === 'free') {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "font-bold",
          size === 'sm' ? "text-xs h-5 px-2" : "text-sm h-6 px-3",
          "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
          className
        )}
      >
        {t('tier.free', 'Free')}
      </Badge>
    );
  }

  return (
    <Badge 
      className={cn(
        "font-bold",
        size === 'sm' ? "text-xs h-5 px-2" : "text-sm h-6 px-3",
        "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
        className
      )}
    >
      <Crown className={cn("mr-1", size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5")} />
      PRO
    </Badge>
  );
});

interface BlockCategoryHeaderProps {
  title: string;
  tier: 'free' | 'pro';
  blockCount?: number;
}

export const BlockCategoryHeader = memo(function BlockCategoryHeader({
  title,
  tier,
  blockCount,
}: BlockCategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-foreground">{title}</span>
        <BlockTierBadge tier={tier} />
      </div>
      {blockCount !== undefined && (
        <span className="text-xs text-muted-foreground">{blockCount} блоков</span>
      )}
    </div>
  );
});

interface LockedBlockCardProps {
  blockType: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

export const LockedBlockCard = memo(function LockedBlockCard({
  blockType,
  label,
  icon,
  color,
  onClick,
}: LockedBlockCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      onClick={onClick || (() => navigate('/pricing'))}
      className="relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all opacity-60 hover:opacity-80"
    >
      {/* Colorful icon with lock overlay */}
      <div className="relative">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
          color
        )}>
          {icon}
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      
      {/* Label */}
      <span className="text-sm font-bold text-center leading-tight text-muted-foreground">
        {label}
      </span>
      
      {/* PRO badge */}
      <div className="absolute top-2 right-2">
        <Crown className="h-4 w-4 text-amber-500" />
      </div>
    </button>
  );
});
