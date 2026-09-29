import React from 'react';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { Badge } from '@/components/ui/badge';
import type { FreeTier } from '@/hooks/user/useFreemiumLimits';

interface TierBadgeProps {
  tier: FreeTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
  const tierConfig: Record<FreeTier | 'free', {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }> = {
    free: {
      label: 'BASIC',
      icon: Zap,
      className: 'bg-muted text-muted-foreground border-border',
    },
    starter: {
      label: 'STARTER',
      icon: Zap,
      className: 'bg-success/12 text-success border-success/30',
    },
    identity: {
      label: 'BASIC',
      icon: Zap,
      className: 'bg-muted text-muted-foreground border-border',
    },
    pro: {
      label: 'PRO',
      icon: Crown,
      className: 'bg-primary/12 text-primary border-primary/30',
    },
    business: {
      label: 'BUSINESS',
      icon: Crown,
      className: 'bg-warning/12 text-warning border-warning/30',
    },
  };

  const config = tierConfig[tier] || tierConfig.identity;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
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
  if (tier === 'identity') return null;

  const config = {
    label: 'PRO',
    icon: Crown,
    className: 'text-primary',
  };

  const Icon = config.icon;

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${config.className}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-bold">{config.label}</span>
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
