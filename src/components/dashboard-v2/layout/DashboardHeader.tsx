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
  activeTab: string;
  pageSwitcher?: React.ReactNode;
}

export const DashboardHeader = memo(function DashboardHeader({
  onMenuClick,
  activeTab,
  pageSwitcher,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-16 md:h-20 glass-subtle backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 shadow-glass-sm translate-z-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-xl hover:bg-white/10 transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="hidden md:block">
          {pageSwitcher}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle border border-white/5 shadow-inner">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
            {t('dashboard.header.live', 'Live')}
          </span>
        </div>
      </div>
    </header>
  );
});
