import { memo, type ReactNode } from 'react';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';

export interface LoadingStateProps {
  message?: string;
  /** Prefer a skeleton shaped like the content that is loading. */
  variant?: 'spinner' | 'skeleton-list' | 'skeleton-cards';
  skeletonCount?: number;
  /** Custom skeleton to render instead of the built-in ones. */
  skeleton?: ReactNode;
  className?: string;
}

export const LoadingState = memo(function LoadingState({
  message,
  variant = 'spinner',
  skeletonCount = 3,
  skeleton,
  className,
}: LoadingStateProps) {
  if (skeleton) {
    return <div className={cn('space-y-4', className)}>{skeleton}</div>;
  }

  if (variant === 'skeleton-list') {
    return (
      <div className={cn('divide-y divide-border rounded-card border border-border bg-card', className)} aria-busy="true">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-cards') {
    return (
      <div className={cn('grid grid-cols-1 gap-3', className)} aria-busy="true">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-card border border-border bg-card p-5">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground', className)}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
});
