import React from 'react';
import { Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FreeTier } from '@/hooks/useFreemiumLimits';

interface TierBadgeProps {
  tier: FreeTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
  const tierConfig = {
    free: {
      label: 'BASIC',
      icon: Zap,
      className: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
    },
    pro: {
      label: 'PRO',
      icon: Crown,
      className: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
    },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizeClasses[size]} font-semibold gap-1`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

// Component to show required tier for a feature
interface RequiredTierProps {
  tier: FreeTier;
  inline?: boolean;
}

export function RequiredTier({ tier, inline = false }: RequiredTierProps) {
  if (tier === 'free') return null;

  const config = {
    label: 'PRO',
    icon: Crown,
    className: 'text-violet-500',
  };

  const Icon = config.icon;

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${config.className}`}>
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-bold">{config.label}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
}