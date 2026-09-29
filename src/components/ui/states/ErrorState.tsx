import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  variant?: 'plain' | 'card';
  className?: string;
}

/** DESIGN.md → Состояния: says what went wrong and offers a retry. */
export const ErrorState = memo(function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  variant = 'plain',
  className,
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center px-6 py-12 text-center',
        variant === 'card' && 'rounded-card border border-destructive/30 bg-card',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {title || t('dashboard.common.error', 'Произошла ошибка')}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description || t('dashboard.common.errorDescription', 'Не удалось загрузить данные. Попробуйте ещё раз.')}
      </p>
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          {retryLabel || t('dashboard.common.retry', 'Повторить')}
        </Button>
      ) : null}
    </div>
  );
});
