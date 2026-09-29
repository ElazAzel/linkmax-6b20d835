import { memo, isValidElement, type ComponentType, type ReactNode } from 'react';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

type IconProp = ReactNode | ComponentType<{ className?: string }>;

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Lucide icon component or a ready element. Defaults to an inbox. */
  icon?: IconProp;
  action?: { label: string; onClick?: () => void };
  /** @deprecated use `action` */
  ctaLabel?: string;
  /** @deprecated use `action` */
  onCtaClick?: () => void;
  /** `plain` sits inside an existing card; `card` draws its own surface. */
  variant?: 'plain' | 'card';
  className?: string;
  children?: ReactNode;
}

function renderStateIcon(icon: IconProp | undefined, fallback: ComponentType<{ className?: string }>, className: string) {
  if (icon && isValidElement(icon)) return icon;
  const isComponent =
    typeof icon === 'function' || (icon !== null && typeof icon === 'object' && ('$$typeof' in icon || 'render' in icon));
  const Icon = (isComponent ? icon : fallback) as ComponentType<{ className?: string }>;
  return <Icon className={className} aria-hidden="true" />;
}

/** DESIGN.md → Состояния: icon, short title, one line of context, one action. */
export const EmptyState = memo(function EmptyState({
  title,
  description,
  icon,
  action,
  ctaLabel,
  onCtaClick,
  variant = 'plain',
  className,
  children,
}: EmptyStateProps) {
  const resolvedAction = action ?? (ctaLabel && onCtaClick ? { label: ctaLabel, onClick: onCtaClick } : null);

  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-12 text-center',
        variant === 'card' && 'rounded-card border border-border bg-card',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {renderStateIcon(icon, Inbox, 'h-6 w-6')}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {children}
      {resolvedAction ? (
        <Button className="mt-5" onClick={resolvedAction.onClick}>
          {resolvedAction.label}
        </Button>
      ) : null}
    </div>
  );
});
