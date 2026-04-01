/**
 * DashboardHeader - Screen header with context actions
 * Includes optional page switcher for page-context screens
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Menu from 'lucide-react/dist/esm/icons/menu';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { cn } from '@/lib/utils/utils';

export interface DashboardHeaderProps {
  onMenuClick?: () => void;
  activeTab?: string;
  pageSwitcher?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export const DashboardHeader = memo(function DashboardHeader({
  onMenuClick,
  activeTab,
  pageSwitcher,
  title,
  subtitle,
  actions,
  showBack,
  onBack,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-16 md:h-24 pt-[env(safe-area-inset-top)] bg-background border-b border-border/10 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 translate-z-0">
      <div className="flex items-center gap-3 md:gap-5 min-w-0">
        {showBack && onBack ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl hover:bg-white/10 transition-all active:scale-95 shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : onMenuClick ? (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 rounded-xl hover:bg-white/10 transition-all active:scale-95 shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
        <div className="flex flex-col min-w-0">
          {title && (
            <h1 className="text-base md:text-lg font-black tracking-tight text-foreground flex items-center gap-2 truncate">
              <span className="truncate">{title}</span>
              {activeTab && <span className="opacity-20 text-xs md:text-sm font-medium shrink-0">/ {activeTab}</span>}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground opacity-50 truncate">
              {subtitle}
            </p>
          )}
          {!title && pageSwitcher}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {actions}
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full bg-card border border-border/10">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
            {t('dashboard.header.live', 'Live Platform')}
          </span>
        </div>
      </div>
    </header>
  );
});
