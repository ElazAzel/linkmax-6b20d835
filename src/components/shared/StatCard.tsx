/**
 * StatCard - Reusable metric/stat display card
 * Used on: landing hero, dashboard home, analytics screens.
 * Features:
 *   - tabular-nums for stable numeric widths across locales
 *   - glass / solid variants
 *   - optional trend indicator
 *   - compact mode for mobile
 */
import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils/utils';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';

interface StatCardProps {
    /** Icon element or Lucide icon */
    icon: ReactNode;
    /** Numeric or text value */
    value: string | number;
    /** Label below the value */
    label: string;
    /** Trend percentage (positive = up, negative = down) */
    trend?: number;
    /** Visual style */
    variant?: 'glass' | 'solid';
    /** Compact mode — smaller padding & font */
    compact?: boolean;
    /** Custom className */
    className?: string;
}

export const StatCard = memo(function StatCard({
    icon,
    value,
    label,
    trend,
    variant = 'solid',
    compact = false,
    className,
}: StatCardProps) {
    const isPositive = trend !== undefined && trend >= 0;

    return (
        <div
            className={cn(
                'rounded-[2rem] transition-smooth duration-500',
                variant === 'glass'
                    ? 'glass border-white/20'
                    : 'bg-card border border-border/50 shadow-sm hover:shadow-glass hover:border-primary/20',
                compact ? 'p-3.5' : 'p-5 md:p-6',
                className
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                </div>
                {trend !== undefined && (
                    <div
                        className={cn(
                            'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
                            isPositive
                                ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
                                : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30'
                        )}
                    >
                        {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="tabular-nums">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <div className={cn('mt-3', compact && 'mt-2')}>
                <div
                    className={cn(
                        'font-bold text-foreground tabular-nums',
                        compact ? 'text-xl' : 'text-2xl md:text-3xl'
                    )}
                >
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div
                    className={cn(
                        'text-muted-foreground font-medium mt-0.5',
                        compact ? 'text-xs' : 'text-sm'
                    )}
                >
                    {label}
                </div>
            </div>
        </div>
    );
});
