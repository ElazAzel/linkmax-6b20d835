/**
 * DashboardSidebar - Desktop sidebar navigation
 * Collapsible with section groups
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  PenTool,
  FileText,
  Inbox,
  BarChart3,
  Settings,
  Crown,
  PanelLeftClose,
  PanelLeft,
  LayoutTemplate,
  Store,
  Trophy,
  Coins,
  LogOut,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  defaultLabel: string;
  badge?: number | string;
  badgeVariant?: 'default' | 'premium';
}

interface SidebarSection {
  id: string;
  titleKey: string;
  defaultTitle: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  activityBadge?: number;
  isPremium: boolean;
  onSignOut: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const MAIN_ITEMS: SidebarItem[] = [
  { id: 'home', icon: Home, labelKey: 'dashboard.nav.home', defaultLabel: 'Главная' },
  { id: 'editor', icon: PenTool, labelKey: 'dashboard.nav.editor', defaultLabel: 'Редактор' },
  { id: 'pages', icon: FileText, labelKey: 'dashboard.nav.pages', defaultLabel: 'Страницы' },
  { id: 'events', icon: Calendar, labelKey: 'dashboard.nav.events', defaultLabel: 'События' },
  { id: 'activity', icon: Inbox, labelKey: 'dashboard.nav.activity', defaultLabel: 'Входящие' },
  { id: 'insights', icon: BarChart3, labelKey: 'dashboard.nav.insights', defaultLabel: 'Аналитика' },
];

const SECTIONS: SidebarSection[] = [
  {
    id: 'tools',
    titleKey: 'dashboard.sidebar.tools',
    defaultTitle: 'Инструменты',
    items: [
      { id: 'templates', icon: LayoutTemplate, labelKey: 'dashboard.sidebar.templates', defaultLabel: 'Шаблоны' },
      { id: 'marketplace', icon: Store, labelKey: 'dashboard.sidebar.marketplace', defaultLabel: 'Маркетплейс' },
    ],
  },
  {
    id: 'account',
    titleKey: 'dashboard.sidebar.account',
    defaultTitle: 'Аккаунт',
    items: [
      { id: 'tokens', icon: Coins, labelKey: 'dashboard.sidebar.tokens', defaultLabel: 'Токены' },
      { id: 'achievements', icon: Trophy, labelKey: 'dashboard.sidebar.achievements', defaultLabel: 'Достижения' },
      { id: 'settings', icon: Settings, labelKey: 'dashboard.nav.settings', defaultLabel: 'Настройки' },
    ],
  },
];

export const DashboardSidebar = memo(function DashboardSidebar({
  activeTab,
  onTabChange,
  activityBadge,
  isPremium,
  onSignOut,
  collapsed = false,
  onCollapsedChange,
}: DashboardSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleItemClick = (itemId: string) => {
    if (itemId === 'templates' || itemId === 'marketplace' || itemId === 'tokens' || itemId === 'achievements') {
      // These open modals, emit custom event
      window.dispatchEvent(new CustomEvent(`open${itemId.charAt(0).toUpperCase() + itemId.slice(1)}`));
    } else {
      onTabChange(itemId);
    }
  };

  const renderItem = (item: SidebarItem, isMain = false) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    const badge = item.id === 'activity' ? activityBadge : item.badge;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
          "hover:bg-muted/50 active:bg-muted",
          isActive && "bg-primary/10 text-primary font-semibold",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm">{t(item.labelKey, item.defaultLabel)}</span>
            {badge !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs h-5 px-1.5",
                  item.badgeVariant === 'premium'
                    ? "bg-amber-500/20 text-amber-600 border-amber-500/30"
                    : "bg-primary/20 text-primary border-primary/30"
                )}
              >
                {badge}
              </Badge>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-card/50 backdrop-blur-xl border-r border-border/30 transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("p-4 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-black">lnkmx</span>
            {isPremium && (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        {/* Main navigation */}
        <div className="space-y-1 mb-6">
          {MAIN_ITEMS.map((item) => renderItem(item, true))}
        </div>

        {/* Sections */}
        {!collapsed &&
          SECTIONS.map((section) => (
            <div key={section.id} className="mb-6">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {t(section.titleKey, section.defaultTitle)}
              </div>
              <div className="space-y-1">{section.items.map((item) => renderItem(item))}</div>
            </div>
          ))}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/30">
        {!isPremium && !collapsed && (
          <Button
            className="w-full mb-3 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="h-4 w-4 mr-2" />
            {t('dashboard.sidebar.upgrade', 'Upgrade')}
          </Button>
        )}
        <button
          onClick={onSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm">{t('dashboard.sidebar.signOut', 'Выйти')}</span>}
        </button>
      </div>
    </aside>
  );
});
