import { memo, isValidElement, type ComponentType, type ReactNode } from 'react';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import ArrowDownRight from 'lucide-react/dist/esm/icons/arrow-down-right';
import { cn } from '@/lib/utils/utils';

/**
 * Metric card (DESIGN.md → Карточка статистики): mono tabular number,
 * caps label, signed change coloured by direction.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  /** Lucide icon component or a ready element. */
  icon?: ReactNode | ComponentType<{ className?: string }>;
  /** Change in percent; the sign picks the colour. */
  change?: number;
  /** Short context under the number, e.g. «за 7 дней». */
  hint?: string;
  compact?: boolean;
  className?: string;
}

function renderIcon(icon: StatCardProps['icon'], className: string) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('$$typeof' in icon || 'render' in icon))) {
    const Icon = icon as ComponentType<{ className?: string }>;
    return <Icon className={className} aria-hidden="true" />;
  }
  return icon as ReactNode;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  icon,
  change,
  hint,
  compact = false,
  className,
}: StatCardProps) {
  const shownChange = change === undefined ? null : Math.abs(change) > 999 ? '>999' : Math.round(Math.abs(change));

  return (
    <div className={cn('rounded-card border border-border bg-card', compact ? 'p-3.5' : 'p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
        {icon ? (
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-control bg-accent text-accent-foreground',
              compact ? 'h-7 w-7' : 'h-8 w-8',
            )}
          >
            {renderIcon(icon, 'h-4 w-4')}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'font-num font-semibold leading-tight text-foreground',
          compact ? 'mt-1.5 text-xl' : 'mt-2 text-3xl',
        )}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {change !== undefined || hint ? (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {change !== undefined ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-num font-medium',
                change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {change > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {change < 0 ? <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {change > 0 ? '+' : change < 0 ? '−' : ''}
              {shownChange}%
            </span>
          ) : null}
          {hint ? <span className="truncate text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
});
