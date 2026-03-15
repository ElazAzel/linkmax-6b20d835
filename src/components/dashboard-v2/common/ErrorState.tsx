import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState as UiErrorState } from '@/components/ui/states';

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
    <UiErrorState
      className={className}
      title={title || t('dashboard.common.error', 'Произошла ошибка')}
      description={description || t('dashboard.common.errorDescription', 'Не удалось загрузить данные. Попробуйте ещё раз.')}
      retryLabel={t('dashboard.common.retry', 'Повторить')}
      onRetry={onRetry}
    />
  );
});
