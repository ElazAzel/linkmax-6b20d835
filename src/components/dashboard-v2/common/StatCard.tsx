/**
 * StatCard - KPI/metric card component
 */
import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Minus from 'lucide-react/dist/esm/icons/minus';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';

interface StatCardProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  value: string | number;
  label: string;
  change?: number;
  variant?: 'glass' | 'solid';
  compact?: boolean;
  className?: string;
}
export const StatCard = memo(function StatCard({
  icon: Icon,
  iconBg = 'bg-primary/15',
  iconColor = 'text-primary',
  value,
  label,
  change,
  variant = 'solid',
  compact = false,
  className,
}: StatCardProps) {
  const renderTrendIcon = () => {
    if (change === undefined || compact) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const renderTrendBadge = () => {
    if (change === undefined || compact) return null;
    const isPositive = change > 0;
    const displayChange = Math.abs(change) > 100 ? '>100' : Math.round(change);

    return (
      <Badge
        variant="outline"
        className={cn(
          "font-black border-0 shadow-sm",
          isPositive
            ? "bg-emerald-500/10 text-emerald-500"
            : change < 0
              ? "bg-red-500/10 text-red-500"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isPositive && '+'}
        {displayChange}%
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "transition-smooth duration-500 relative overflow-hidden group",
      variant === 'glass' 
        ? "glass border-white/20 shadow-glass-lg rounded-[2rem]" 
        : "bg-card border-border/50 shadow-sm rounded-2xl hover:shadow-glass hover:border-primary/20",
      compact ? "p-3.5" : "p-6",
      className
    )}>
      <div className="absolute inset-0 bg-liquid-mesh opacity-[0.03] group-hover:opacity-[0.07] transition-opacity -z-10" />
      <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-4")}>
        <div className={cn(
          "rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          compact ? "h-8 w-8" : "h-11 w-11",
          iconBg
        )}>
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", iconColor)} />
        </div>
        {renderTrendIcon()}
      </div>
      <div className={cn(
        "font-black text-foreground tabular-nums drop-shadow-sm",
        compact ? "text-xl mb-0.5" : "text-3xl mb-1.5"
      )}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-black uppercase tracking-[0.1em] text-muted-foreground/60",
          compact ? "text-[8px]" : "text-[10px]"
        )}>{label}</span>
        {renderTrendBadge()}
      </div>
    </Card>
  );
});
