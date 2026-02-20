/**
 * DashboardBottomNav - Mobile bottom navigation (5 tabs max)
 * iOS-style with haptic feedback
 */
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, PenTool, Inbox, Calendar, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useHapticFeedback } from '@/hooks/ui/useHapticFeedback';
import { motion } from 'framer-motion';

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
    id: 'events',
    icon: Calendar,
    labelKey: 'dashboard.nav.events',
    defaultLabel: 'События',
    path: '/dashboard/events',
  },
  {
    id: 'insights',
    icon: BarChart3,
    labelKey: 'dashboard.nav.insights',
    defaultLabel: 'Аналитика',
    path: '/dashboard/insights',
  },
  {
    id: 'leads',
    icon: Inbox,
    labelKey: 'dashboard.nav.leads',
    defaultLabel: 'Лиды',
    path: '/dashboard/leads',
  },
  {
    id: 'settings',
    icon: Settings,
    labelKey: 'dashboard.nav.settings',
    defaultLabel: 'Настройки',
    path: '/dashboard/settings',
  },
];

export const DashboardBottomNav = memo(function DashboardBottomNav({
  activeTab,
  onTabChange,
  activityBadge,
}: DashboardBottomNavProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();

  const handleTabClick = useCallback((tab: NavTab) => {
    haptic.lightTap();
    onTabChange(tab.id);
  }, [onTabChange, haptic]);

  return (
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
                {/* Active indicator - Liquid drop style */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                )}

                {/* Icon with badge */}
                <div className="relative">
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-black border-2 border-background">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[8px] font-black leading-none truncate max-w-full px-0.5 tracking-tighter uppercase",
                    isActive && "text-primary"
                  )}
                >
                  {t(tab.labelKey, tab.defaultLabel)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
