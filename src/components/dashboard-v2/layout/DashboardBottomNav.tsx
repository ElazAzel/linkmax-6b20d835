/**
 * DashboardBottomNav - Mobile bottom navigation (5 tabs max)
 * iOS-style with haptic feedback
 * Last tab is "More" which opens a sheet with zone tabs + settings
 */
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Home from 'lucide-react/dist/esm/icons/home';
import PenTool from 'lucide-react/dist/esm/icons/pen-tool';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Contact from 'lucide-react/dist/esm/icons/contact';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import { cn } from '@/lib/utils/utils';
import { useHapticFeedback } from '@/hooks/ui/useHapticFeedback';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  defaultLabel: string;
  path: string;
  badge?: number;
}

interface DashboardBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  activityBadge?: number;
}

const TABS: NavTab[] = [
  {
    id: 'home',
    icon: Home,
    labelKey: 'dashboard.nav.home',
    defaultLabel: 'Главная',
    path: '/dashboard/home',
  },
  {
    id: 'editor',
    icon: PenTool,
    labelKey: 'dashboard.nav.editor',
    defaultLabel: 'Редактор',
    path: '/dashboard/home?tab=editor',
  },
  {
    id: 'activity',
    icon: Inbox,
    labelKey: 'dashboard.nav.activity',
    defaultLabel: 'Входящие',
    path: '/dashboard/activity',
  },
  {
    id: 'insights',
    icon: BarChart3,
    labelKey: 'dashboard.nav.insights',
    defaultLabel: 'Аналитика',
    path: '/dashboard/insights',
  },
];

const MORE_ITEMS: NavTab[] = [
  { id: 'pages', icon: FileText, labelKey: 'dashboard.nav.pages', defaultLabel: 'Страницы', path: '' },
  { id: 'zone-deals', icon: Contact, labelKey: 'zones.nav.deals', defaultLabel: 'Сделки', path: '' },
  { id: 'zone-tasks', icon: Calendar, labelKey: 'zones.nav.tasks', defaultLabel: 'Задачи', path: '' },
  { id: 'zone-invoices', icon: FileText, labelKey: 'zones.nav.invoices', defaultLabel: 'Финансы', path: '' },
  { id: 'settings', icon: Settings, labelKey: 'dashboard.nav.settings', defaultLabel: 'Настройки', path: '' },
];

// Tabs that count as "more" active
const MORE_TAB_IDS = MORE_ITEMS.map(i => i.id);

export const DashboardBottomNav = memo(function DashboardBottomNav({
  activeTab,
  onTabChange,
  activityBadge,
}: DashboardBottomNavProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_TAB_IDS.includes(activeTab);

  const handleTabClick = useCallback((tab: NavTab) => {
    haptic.lightTap();
    onTabChange(tab.id);
  }, [onTabChange, haptic]);

  const handleMoreItemClick = useCallback((item: NavTab) => {
    haptic.lightTap();
    setMoreOpen(false);
    onTabChange(item.id);
  }, [onTabChange, haptic]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 safe-area-bottom md:hidden pt-3 pointer-events-none">
        <div className="qb-glass overflow-hidden pointer-events-auto rounded-card">
          <div className="grid grid-cols-5 h-[4.25rem]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const badge = tab.id === 'activity' ? activityBadge : undefined;

              const label = t(tab.labelKey, tab.defaultLabel);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95 min-w-0 h-full",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  data-testid={`${tab.id}-tab`}
                >
                  <div className="relative">
                    <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform", isActive && "scale-110")} />
                    {badge && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium border-2 border-background">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={cn("text-[11px] leading-none max-w-full px-0.5 truncate", isActive ? "font-medium" : "font-normal")}>
                    {label}
                  </span>
                </button>
              );
            })}

            {/* More button */}
            <button
              onClick={() => { haptic.lightTap(); setMoreOpen(true); }}
              aria-label={t('dashboard.nav.more', 'Ещё')}
              aria-expanded={moreOpen}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95 min-w-0 h-full",
                isMoreActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className={cn("h-[18px] w-[18px] shrink-0 transition-transform", isMoreActive && "scale-110")} />
              <span className={cn("text-[11px] leading-none max-w-full px-0.5 truncate", isMoreActive ? "font-medium" : "font-normal")}>
                {t('dashboard.nav.more', 'Ещё')}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader>
            <SheetTitle className="text-left">{t('dashboard.nav.more', 'Ещё')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {MORE_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMoreItemClick(item)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  data-testid={`${item.id}-tab`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center whitespace-normal break-words text-wrap leading-tight max-w-[5.5rem]">
                    {t(item.labelKey, item.defaultLabel)}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});
