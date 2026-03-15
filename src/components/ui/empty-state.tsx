import type { ReactNode } from 'react';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  className,
  ctaLabel,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card/50 p-8 text-center', className)}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {icon ?? <Inbox className="h-6 w-6 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {ctaLabel && onCtaClick ? (
        <Button className="mt-5" onClick={onCtaClick}>{ctaLabel}</Button>
      ) : null}
    </div>
  );
}
