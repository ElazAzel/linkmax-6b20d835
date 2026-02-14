/**
 * DashboardBottomNav - Mobile bottom navigation (5 tabs max)
 * iOS-style with haptic feedback
 */
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PenTool, Inbox, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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
  const navigate = useNavigate();
  const haptic = useHapticFeedback();

  const handleTabClick = useCallback((tab: NavTab) => {
    haptic.lightTap();
    onTabChange(tab.id);
  }, [onTabChange, haptic]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom md:hidden">
      <div className="mx-2 mb-2 bg-card/90 backdrop-blur-2xl border border-border/20 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden">
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
                  "relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 min-w-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                )}

                {/* Icon with badge */}
                <div className="relative">
                  <Icon className="h-5 w-5 shrink-0" />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[9px] font-medium leading-none truncate max-w-full px-0.5",
                    isActive && "font-semibold"
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
