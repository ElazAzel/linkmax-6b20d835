import { memo } from 'react';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = memo(function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('text-center py-16 px-6', className)}>
      <div className="h-20 w-20 rounded-[28px] bg-destructive/10 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      {description ? <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{description}</p> : null}
      {onRetry ? (
        <Button size="lg" className="h-12 px-6 rounded-2xl font-bold" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
});
