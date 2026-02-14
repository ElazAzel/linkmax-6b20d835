import { memo, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export const PullToRefresh = memo(function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();

  const handleRefresh = async () => {
    haptic.success();
    await onRefresh();
  };

  const {
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh,
    progress,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120,
    disabled: disabled || !isMobile,
  });

  // Trigger haptic when crossing threshold
  if (canRefresh && progress >= 1 && isPulling) {
    haptic.lightTap();
  }

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-opacity z-50",
          (isPulling || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -60,
          transform: `translateY(${pullDistance}px)`,
          transition: !isPulling ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : undefined,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-lg transition-all",
            canRefresh && "bg-primary border-primary",
            isRefreshing && "bg-primary border-primary"
          )}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "h-5 w-5 transition-all duration-200",
                canRefresh ? "text-primary-foreground rotate-180" : "text-muted-foreground"
              )}
              style={{
                transform: `rotate(${progress * 180}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: !isPulling ? 'transform 0.3s ease-out' : undefined,
        }}
      >
        {children}
      </div>

      {/* Pull hint text */}
      {isPulling && !isRefreshing && (
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{
            top: pullDistance - 30,
            opacity: progress,
            transition: !isPulling ? 'opacity 0.3s ease-out' : undefined,
          }}
        >
          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
            {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      )}
    </div>
  );
});
