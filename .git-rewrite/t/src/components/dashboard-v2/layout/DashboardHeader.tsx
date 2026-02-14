/**
 * DashboardHeader - Screen header with context actions
 * Includes optional page switcher for page-context screens
 */
import { memo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  rightElement?: ReactNode;
  leftElement?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export const DashboardHeader = memo(function DashboardHeader({
  title,
  subtitle,
  showBack,
  onBack,
  actions,
  rightElement,
  leftElement,
  sticky = true,
  className,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "z-40 px-5 py-4",
        sticky && "sticky top-0 glass-nav",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {leftElement}
          {!leftElement && (
            <div className="min-w-0">
              <h1 className="text-2xl font-black truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {(actions || rightElement) && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
});
