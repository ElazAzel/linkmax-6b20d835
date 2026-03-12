/**
 * DashboardHeader - Screen header with context actions
 * Includes optional page switcher for page-context screens
 */
/**
 * DashboardHeader - Screen header with context actions
 * Includes optional page switcher for page-context screens
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Menu from 'lucide-react/dist/esm/icons/menu';
import { cn } from '@/lib/utils/utils';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  activeTab?: string;
  pageSwitcher?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardHeader = memo(function DashboardHeader({
  onMenuClick,
  activeTab,
  pageSwitcher,
  title,
  subtitle,
  actions,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-20 md:h-24 glass-subtle backdrop-blur-3xl border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-5 md:px-8 shadow-glass translate-z-0">
      <div className="flex items-center gap-5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-12 w-12 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex flex-col">
          {title && (
            <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              {title}
              {activeTab && <span className="opacity-20 text-sm font-medium">/ {activeTab}</span>}
            </h1>
          )}
          {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">{subtitle}</p>}
          {!title && pageSwitcher}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions}
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full glass-subtle border border-white/5 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
            {t('dashboard.header.live', 'Live Platform')}
          </span>
        </div>
      </div>
    </header>
  );
});
