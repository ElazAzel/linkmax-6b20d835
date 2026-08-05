import { memo, ReactNode, isValidElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!Icon) return null;

    if (isValidElement(Icon)) {
      return Icon;
    }

    if (typeof Icon === 'function' || (Icon && typeof Icon === 'object' && '$$typeof' in Icon)) {
      const IconComponent = Icon as LucideIcon;
      return <IconComponent className="h-10 w-10 text-muted-foreground/60" />;
    }

    return null;
  };

  return (
    <div className={cn('text-center py-16 px-6', className)}>
      {Icon ? (
        <div className="h-20 w-20 rounded-[28px] bg-muted/50 flex items-center justify-center mx-auto mb-5">
          {renderIcon()}
        </div>
      ) : null}
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      {description ? <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{description}</p> : null}
      {action ? (
        <Button size="lg" className="h-12 px-6 rounded-2xl font-bold" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
});
