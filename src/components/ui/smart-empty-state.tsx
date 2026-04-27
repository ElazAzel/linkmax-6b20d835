import type { ComponentType, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

export interface SmartCta {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  icon?: ComponentType<{ className?: string }>;
}

export interface SmartChecklistItem {
  label: string;
  done?: boolean;
  hint?: string;
}

export interface SmartEmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  iconBg?: string; // tailwind class
  eyebrow?: string;
  title: string;
  description?: string;
  primaryCta?: SmartCta;
  secondaryCta?: SmartCta;
  checklist?: SmartChecklistItem[];
  footer?: ReactNode;
  className?: string;
  /** Compact variant fits inside small cards */
  compact?: boolean;
}

/**
 * Smart Empty State — opinionated empty screens that guide users to the
 * next step in activation (publish a page, share link, configure form...).
 *
 * Use across Leads, Pages, Analytics for consistent UX.
 */
export function SmartEmptyState({
  icon: Icon,
  iconBg = 'bg-gradient-to-br from-primary/15 to-primary/5',
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  checklist,
  footer,
  className,
  compact = false,
}: SmartEmptyStateProps) {
  const renderCtaButton = (cta: SmartCta, isPrimary: boolean) => {
    const CtaIcon = cta.icon;
    const inner = (
      <>
        {CtaIcon && <CtaIcon className="h-4 w-4 mr-2" />}
        {cta.label}
        {isPrimary && !CtaIcon && <ArrowRight className="h-4 w-4 ml-2" />}
      </>
    );
    const variant = cta.variant ?? (isPrimary ? 'default' : 'outline');

    if (cta.href) {
      return (
        <Button asChild variant={variant} size={compact ? 'sm' : 'default'} className="rounded-xl">
          <a href={cta.href}>{inner}</a>
        </Button>
      );
    }
    return (
      <Button
        onClick={cta.onClick}
        variant={variant}
        size={compact ? 'sm' : 'default'}
        className="rounded-xl"
      >
        {inner}
      </Button>
    );
  };

  return (
    <Card
      className={cn(
        'border-border/40 bg-card/40 backdrop-blur-sm rounded-3xl text-center',
        compact ? 'p-6' : 'p-8 md:p-10',
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            'mx-auto mb-4 flex items-center justify-center rounded-2xl',
            iconBg,
            compact ? 'h-12 w-12' : 'h-16 w-16',
          )}
        >
          <Icon className={cn('text-primary', compact ? 'h-6 w-6' : 'h-8 w-8')} />
        </div>
      )}

      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          {eyebrow}
        </p>
      )}

      <h3 className={cn('font-bold tracking-tight', compact ? 'text-lg' : 'text-xl md:text-2xl')}>
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'mt-2 mx-auto text-muted-foreground',
            compact ? 'text-sm max-w-sm' : 'text-sm md:text-base max-w-md',
          )}
        >
          {description}
        </p>
      )}

      {checklist && checklist.length > 0 && (
        <ul className="mt-6 mx-auto max-w-sm text-left space-y-2.5">
          {checklist.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    item.done && 'text-muted-foreground line-through',
                  )}
                >
                  {item.label}
                </p>
                {item.hint && !item.done && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{item.hint}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {(primaryCta || secondaryCta) && (
        <div
          className={cn(
            'mt-6 flex flex-col sm:flex-row items-center justify-center gap-2',
          )}
        >
          {primaryCta && renderCtaButton(primaryCta, true)}
          {secondaryCta && renderCtaButton(secondaryCta, false)}
        </div>
      )}

      {footer && <div className="mt-6 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
