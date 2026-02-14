import { memo } from 'react';
import { Check, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface VerifiedBadgeProps {
  /** User is platform-verified (documents confirmed) */
  isVerified?: boolean;
  /** User has Pro/Business subscription */
  isPremium?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Unified verification badge that shows:
 * - Verified only: blue checkmark
 * - Premium only: yellow/gold circle
 * - Both: checkmark on yellow/gold background
 */
export const VerifiedBadge = memo(function VerifiedBadge({
  isVerified = false,
  isPremium = false,
  size = 'md',
  className,
  showTooltip = true,
}: VerifiedBadgeProps) {
  const { t } = useTranslation();

  // Don't render if neither verified nor premium
  if (!isVerified && !isPremium) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const containerSizes = {
    sm: 'h-[18px] w-[18px]',
    md: 'h-[22px] w-[22px]',
    lg: 'h-[26px] w-[26px]',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  // Determine styling based on verification state
  const getStyles = () => {
    if (isVerified && isPremium) {
      // Both: checkmark on gold background
      return {
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30',
        icon: <Check className={cn('text-white', iconSizes[size])} strokeWidth={3} />,
        tooltip: t('verification.verifiedPremium', 'Верифицирован + Premium')
      };
    }
    if (isPremium) {
      // Premium only: gold circle (crown icon)
      return {
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30',
        icon: <Crown className={cn('text-white', iconSizes[size])} />,
        tooltip: t('verification.premiumBadge', 'Premium аккаунт')
      };
    }
    // Verified only: blue checkmark
    return {
      bg: 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30',
      icon: <Check className={cn('text-white', iconSizes[size])} strokeWidth={3} />,
      tooltip: t('verification.platformBadge', 'Личность подтверждена платформой')
    };
  };

  const { bg, icon, tooltip } = getStyles();

  const badge = (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        containerSizes[size],
        bg,
        className
      )}
    >
      {icon}
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Legacy support for old API
export interface LegacyVerifiedBadgeProps {
  type?: 'platform' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const LegacyVerifiedBadge = memo(function LegacyVerifiedBadge({
  type = 'platform',
  size = 'md',
  className,
  showTooltip = true,
}: LegacyVerifiedBadgeProps) {
  return (
    <VerifiedBadge
      isVerified={type === 'platform'}
      isPremium={type === 'premium'}
      size={size}
      className={className}
      showTooltip={showTooltip}
    />
  );
});