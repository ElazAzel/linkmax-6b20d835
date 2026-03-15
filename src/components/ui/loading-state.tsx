import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@/lib/utils/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  className?: string;
  message?: string;
  variant?: 'spinner' | 'skeleton-list' | 'skeleton-cards';
  skeletonCount?: number;
}

export function LoadingState({
  className,
  message,
  variant = 'spinner',
  skeletonCount = 3,
}: LoadingStateProps) {
  if (variant === 'skeleton-list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="rounded-2xl border p-4 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-cards') {
    return (
      <div className={cn('grid grid-cols-1 gap-3', className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="rounded-2xl border p-5 space-y-3">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground', className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
