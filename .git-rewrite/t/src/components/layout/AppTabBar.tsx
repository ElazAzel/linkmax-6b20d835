/**
 * AppTabBar - Main mobile navigation component (iOS-style)
 * Fixed bottom tab bar with: Projects, Editor, CRM, Analytics, Gallery, Settings
 * Enhanced with haptic feedback and smooth animations
 */
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  PenTool, 
  Users, 
  BarChart3, 
  ImageIcon, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface TabItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
}

interface AppTabBarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  crmBadge?: number;
}

export const AppTabBar = memo(function AppTabBar({ 
  activeTab,
  onTabChange,
  crmBadge 
}: AppTabBarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();

  const tabs: TabItem[] = [
    {
      id: 'projects',
      icon: FolderOpen,
      label: t('tabbar.projects', 'Проекты'),
      path: '/dashboard',
    },
    {
      id: 'editor',
      icon: PenTool,
      label: t('tabbar.editor', 'Редактор'),
      path: '/dashboard?tab=editor',
    },
    {
      id: 'crm',
      icon: Users,
      label: t('tabbar.crm', 'CRM'),
      path: '/dashboard?tab=crm',
      badge: crmBadge,
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: t('tabbar.analytics', 'Аналитика'),
      path: '/dashboard?tab=analytics',
    },
    {
      id: 'gallery',
      icon: ImageIcon,
      label: t('tabbar.gallery', 'Галерея'),
      path: '/gallery',
    },
    {
      id: 'settings',
      icon: Settings,
      label: t('tabbar.settings', 'Настройки'),
      path: '/dashboard?tab=settings',
    },
  ];

  // Determine active tab from URL or prop
  const currentTab = activeTab || (() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) return tab;
    if (location.pathname === '/gallery') return 'gallery';
    if (location.pathname === '/dashboard') return 'projects';
    return 'projects';
  })();

  const handleTabClick = useCallback((tab: TabItem) => {
    // Haptic feedback on tab change
    haptic.lightTap();
    
    if (onTabChange) {
      onTabChange(tab.id);
    } else {
      navigate(tab.path);
    }
  }, [onTabChange, navigate, haptic]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom md:hidden">
      {/* Glass background */}
      <div className="mx-2 mb-2 bg-card/90 backdrop-blur-2xl border border-border/20 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden">
        <div className="grid grid-cols-6 h-16">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 min-w-0",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                )}
                
                {/* Icon with badge */}
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 shrink-0"
                  )} />
                  
                  {/* Badge */}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                
                {/* Label - truncated */}
                <span className={cn(
                  "text-[9px] font-medium leading-none truncate max-w-full px-0.5",
                  isActive && "font-semibold"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
