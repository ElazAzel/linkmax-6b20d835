import { memo, ReactNode } from 'react';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@/lib/utils/utils';

interface LoadingStateProps {
  message?: string;
  skeleton?: ReactNode;
  className?: string;
}

export const LoadingState = memo(function LoadingState({
  message,
  skeleton,
  className,
}: LoadingStateProps) {
  if (skeleton) {
    return <div className={cn('space-y-4', className)}>{skeleton}</div>;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-muted-foreground', className)}>
      <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
});
