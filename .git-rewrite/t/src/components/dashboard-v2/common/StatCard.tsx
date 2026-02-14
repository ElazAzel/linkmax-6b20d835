/**
 * StatCard - KPI/metric card component
 */
import { memo } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  value: string | number;
  label: string;
  change?: number;
  className?: string;
}

export const StatCard = memo(function StatCard({
  icon: Icon,
  iconBg = 'bg-primary/15',
  iconColor = 'text-primary',
  value,
  label,
  change,
  className,
}: StatCardProps) {
  const renderTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const renderTrendBadge = () => {
    if (change === undefined) return null;
    const isPositive = change > 0;
    const displayChange = Math.abs(change) > 100 ? '>100' : Math.round(change);
    
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-bold border-0",
          isPositive
            ? "bg-emerald-500/15 text-emerald-600"
            : change < 0
            ? "bg-red-500/15 text-red-600"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isPositive && '+'}
        {displayChange}%
      </Badge>
    );
  };

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {renderTrendIcon()}
      </div>
      <div className="text-3xl font-black mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {renderTrendBadge()}
      </div>
    </Card>
  );
});
