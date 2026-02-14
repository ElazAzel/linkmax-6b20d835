import { memo } from 'react';
import { BadgeCheck, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  type?: 'platform' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Platform verified badge - shown for users who completed identity verification
 * Different from premium badge which is just for paid subscribers
 */
export const VerifiedBadge = memo(function VerifiedBadge({
  type = 'platform',
  size = 'md',
  className,
  showTooltip = true,
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const containerClasses = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-1.5',
  };

  const badge = (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        containerClasses[size],
        type === 'platform'
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
          : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30',
        className
      )}
    >
      {type === 'platform' ? (
        <Shield className={cn('text-white', sizeClasses[size])} />
      ) : (
        <BadgeCheck className={cn('text-white', sizeClasses[size])} />
      )}
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">
            {type === 'platform' 
              ? 'Личность подтверждена платформой' 
              : 'Premium аккаунт'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
