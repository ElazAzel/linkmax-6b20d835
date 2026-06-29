import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils/utils';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Variant = 'card' | 'quiet' | 'plain';

interface BlockShellProps {
  variant?: Variant;
  padding?: Padding;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children: ReactNode;
  as?: 'div' | 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const variantMap: Record<Variant, string> = {
  card: 'qb-card',
  quiet: 'qb-card-quiet',
  plain: '',
};

/**
 * BlockShell — единая обёртка Quiet Bento для всех публичных блоков.
 * Без backdrop-blur, единый радиус (rounded-card) и тень (shadow-soft).
 */
export const BlockShell = forwardRef<HTMLElement, BlockShellProps>(function BlockShell(
  {
    variant = 'card',
    padding = 'md',
    interactive = false,
    className,
    style,
    onClick,
    children,
    as = 'div',
    href,
    target,
    rel,
    ariaLabel,
  },
  ref,
) {
  const classes = cn(
    'block w-full text-left',
    variantMap[variant],
    paddingMap[padding],
    interactive && 'qb-card-hover cursor-pointer active:scale-[0.99] transition-transform',
    className,
  );

  if (as === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        onClick={onClick}
        className={classes}
        style={style}
      >
        {children}
      </a>
    );
  }
  if (as === 'button') {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={classes}
        style={style}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      onClick={onClick}
      onKeyDown={onClick ? () => onClick() : undefined}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      className={classes}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
});

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  className?: string;
}

export function SectionHeader({ icon, title, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2.5 px-1 mb-3', className)}>
      {icon && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-control bg-primary/10 text-primary">
          {icon}
        </span>
      )}
      <h3 className="text-sm font-medium tracking-tight text-foreground">{title}</h3>
    </div>
  );
}
