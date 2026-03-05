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
import Kanban from 'lucide-react/dist/esm/icons/kanban';
import Contact from 'lucide-react/dist/esm/icons/contact';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import ListTodo from 'lucide-react/dist/esm/icons/list-todo';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Users from 'lucide-react/dist/esm/icons/users';
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
  { id: 'zone-dashboard', icon: BarChart3, labelKey: 'dashboard.sidebar.zoneDashboard', defaultLabel: 'Аналитика', path: '' },
  { id: 'zone-deals', icon: Kanban, labelKey: 'dashboard.sidebar.zonePipeline', defaultLabel: 'Сделки', path: '' },
  { id: 'zone-contacts', icon: Contact, labelKey: 'dashboard.sidebar.zoneContacts', defaultLabel: 'Контакты', path: '' },
  { id: 'zone-calendar', icon: Calendar, labelKey: 'dashboard.sidebar.zoneCalendar', defaultLabel: 'Календарь', path: '' },
  { id: 'zone-events', icon: Calendar, labelKey: 'dashboard.sidebar.zoneEvents', defaultLabel: 'Ивенты', path: '' },
  { id: 'zone-inbox', icon: MessageCircle, labelKey: 'dashboard.sidebar.zoneInbox', defaultLabel: 'Входящие', path: '' },
  { id: 'zone-tasks', icon: ListTodo, labelKey: 'dashboard.sidebar.zoneTasks', defaultLabel: 'Задачи', path: '' },
  { id: 'zone-automations', icon: Zap, labelKey: 'dashboard.sidebar.zoneAutomations', defaultLabel: 'Автоматизации', path: '' },
  { id: 'zone-invoices', icon: Receipt, labelKey: 'dashboard.sidebar.zoneInvoices', defaultLabel: 'Инвойсы', path: '' },
  { id: 'zone-products', icon: Package, labelKey: 'dashboard.sidebar.zoneProducts', defaultLabel: 'Продукты', path: '' },
  { id: 'zone-settings', icon: Building2, labelKey: 'dashboard.sidebar.zoneSettings', defaultLabel: 'Зона', path: '' },
  { id: 'events', icon: Calendar, labelKey: 'dashboard.nav.events', defaultLabel: 'События', path: '' },
  { id: 'team', icon: Users, labelKey: 'dashboard.sidebar.team', defaultLabel: 'Команда', path: '' },
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 safe-area-bottom md:hidden bg-gradient-to-t from-background via-background/80 to-transparent pt-6 pointer-events-none">
        <div className="bg-liquid-mesh glass-strong border border-white/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden pointer-events-auto">
          <div className="grid grid-cols-5 h-16">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const badge = tab.id === 'activity' ? activityBadge : undefined;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active:scale-90 min-w-0 h-full",
                    isActive ? "text-primary scale-110" : "text-muted-foreground/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-1 w-8 h-1 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    />
                  )}
                  <div className="relative">
                    <Icon className={cn("h-5 w-5 shrink-0 transition-transform", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")} />
                    {badge && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-black border-2 border-background">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={cn("text-[8px] font-black leading-none truncate max-w-full px-0.5 tracking-tighter uppercase", isActive && "text-primary")}>
                    {t(tab.labelKey, tab.defaultLabel)}
                  </span>
                </button>
              );
            })}

            {/* More button */}
            <button
              onClick={() => { haptic.lightTap(); setMoreOpen(true); }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active:scale-90 min-w-0 h-full",
                isMoreActive ? "text-primary scale-110" : "text-muted-foreground/60"
              )}
            >
              {isMoreActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 w-8 h-1 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
              )}
              <MoreHorizontal className={cn("h-5 w-5 shrink-0", isMoreActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")} />
              <span className={cn("text-[8px] font-black leading-none truncate max-w-full px-0.5 tracking-tighter uppercase", isMoreActive && "text-primary")}>
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
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{t(item.labelKey, item.defaultLabel)}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});
