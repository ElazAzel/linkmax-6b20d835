/**
 * ErrorState - Error display with retry action
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = memo(function ErrorState({
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("text-center py-16 px-6", className)}>
      <div className="h-20 w-20 rounded-[28px] bg-destructive/10 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="font-bold text-lg mb-2">
        {title || t('dashboard.common.error', 'Произошла ошибка')}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
        {description || t('dashboard.common.errorDescription', 'Не удалось загрузить данные. Попробуйте ещё раз.')}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="lg"
          className="h-12 px-6 rounded-2xl font-bold"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('dashboard.common.retry', 'Повторить')}
        </Button>
      )}
    </div>
  );
});
