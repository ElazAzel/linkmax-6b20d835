import type { ReactNode, ComponentType } from 'react';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  className?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  action?: { label: string; onClick?: () => void };
}

export function EmptyState({
  title,
  description,
  icon,
  className,
  ctaLabel,
  onCtaClick,
  action,
}: EmptyStateProps) {
  const resolvedAction = action || (ctaLabel && onCtaClick ? { label: ctaLabel, onClick: onCtaClick } : null);

  // Render icon: if it's a component (function), instantiate it; otherwise render as ReactNode
  const renderIcon = () => {
    if (!icon) return <Inbox className="h-6 w-6 text-muted-foreground" />;
    if (typeof icon === 'function') {
      const IconComponent = icon as ComponentType<{ className?: string }>;
      return <IconComponent className="h-6 w-6 text-muted-foreground" />;
    }
    return icon;
  };

  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card/50 p-8 text-center', className)}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {resolvedAction ? (
        <Button className="mt-5" onClick={resolvedAction.onClick}>{resolvedAction.label}</Button>
      ) : null}
    </div>
  );
}
