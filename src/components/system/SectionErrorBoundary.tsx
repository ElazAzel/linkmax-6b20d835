/**
 * SectionErrorBoundary — гранулярная защита секции/вкладки/блока.
 *
 * Падение одного участка UI не убивает всю страницу: показываем компактный
 * fallback с кнопкой «повторить», которая пересоздаёт поддерево.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { cn } from '@/lib/utils/utils';

interface Props {
  children: React.ReactNode;
  /** Имя секции для логов (не показывается пользователю). */
  name?: string;
  /** Компактный режим — для отдельных блоков публичной страницы. */
  compact?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  key: number;
}

function DefaultFallback({
  compact,
  className,
  onRetry,
}: {
  compact?: boolean;
  className?: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        'w-full rounded-xl border border-border/60 bg-muted/30 text-center',
        compact ? 'p-3' : 'p-6',
        className,
      )}
    >
      <AlertTriangle
        className={cn('mx-auto text-muted-foreground', compact ? 'h-4 w-4' : 'h-6 w-6')}
        aria-hidden
      />
      <p className={cn('mt-2 text-muted-foreground break-words', compact ? 'text-xs' : 'text-sm')}>
        {t('resilience.sectionError', 'Этот раздел не загрузился')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline underline-offset-2"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        {t('resilience.retry', 'Повторить')}
      </button>
    </div>
  );
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, key: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[SectionErrorBoundary:${this.props.name ?? 'unknown'}]`, error);
  }

  private retry = () => {
    this.setState((s) => ({ hasError: false, key: s.key + 1 }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <DefaultFallback
          compact={this.props.compact}
          className={this.props.className}
          onRetry={this.retry}
        />
      );
    }
    return <React.Fragment key={this.state.key}>{this.props.children}</React.Fragment>;
  }
}

export default SectionErrorBoundary;
