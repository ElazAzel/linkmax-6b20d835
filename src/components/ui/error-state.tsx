import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface ErrorStateProps {
  title: string;
  description?: string;
  className?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  description,
  className,
  retryLabel,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={cn('rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center', className)}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {retryLabel && onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
