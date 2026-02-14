/**
 * EmptyState - Consistent empty state component with optional CTA
 */
import { memo, ReactNode, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon | ReactNode;
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
  const { t } = useTranslation();

  // Check if icon is a React element or a component
  const renderIcon = () => {
    // If it's already a valid React element, render it directly
    if (isValidElement(Icon)) {
      return Icon;
    }
    
    // If it's a component (function or forwardRef object with $$typeof)
    if (typeof Icon === 'function' || (Icon && typeof Icon === 'object' && '$$typeof' in Icon)) {
      const IconComponent = Icon as LucideIcon;
      return <IconComponent className="h-10 w-10 text-muted-foreground/50" />;
    }
    
    // Fallback: just render as-is (might be null or undefined)
    return null;
  };

  return (
    <div className={cn("text-center py-16 px-6", className)}>
      <div className="h-20 w-20 rounded-[28px] bg-muted/50 flex items-center justify-center mx-auto mb-5">
        {renderIcon()}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          size="lg"
          className="h-12 px-6 rounded-2xl font-bold"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
});
