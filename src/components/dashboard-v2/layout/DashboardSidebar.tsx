import { useNavigate } from 'react-router-dom';
/**
 * DashboardSidebar - Desktop sidebar navigation
 * Collapsible with section groups, powered by Framer Motion
 */
import { memo, lazy, Suspense } from 'react';
import { OrganizationSwitcher } from '../organizations/OrganizationSwitcher';
import { useTranslation } from 'react-i18next';

const ZoneSwitcherSlot = lazy(() => import('@/components/zones/ZoneSwitcherSlot'));

import Home from 'lucide-react/dist/esm/icons/home';
import PenTool from 'lucide-react/dist/esm/icons/pen-tool';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Crown from 'lucide-react/dist/esm/icons/crown';
import PanelLeftClose from 'lucide-react/dist/esm/icons/panel-left-close';
import PanelLeft from 'lucide-react/dist/esm/icons/panel-left';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Search from 'lucide-react/dist/esm/icons/search';
import Contact from 'lucide-react/dist/esm/icons/contact';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  isBusinessTier?: boolean;
  onSignOut: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const MAIN_ITEMS: SidebarItem[] = [
  { id: 'editor', icon: PenTool, labelKey: 'dashboard.nav.editor', defaultLabel: 'Редактор' },
  { id: 'activity', icon: Inbox, labelKey: 'dashboard.nav.activity', defaultLabel: 'Входящие', badgeVariant: 'default' },
  { id: 'insights', icon: BarChart3, labelKey: 'dashboard.nav.insights', defaultLabel: 'Аналитика' },
];

const SECTIONS: SidebarSection[] = [
  {
    id: 'pages',
    titleKey: 'dashboard.sidebar.design',
    defaultTitle: 'Страницы',
    items: [
      { id: 'pages', icon: FileText, labelKey: 'dashboard.nav.pages', defaultLabel: 'Мои страницы' },
      { id: 'templates', icon: LayoutTemplate, labelKey: 'dashboard.sidebar.templates', defaultLabel: 'Шаблоны' },
    ],
  },
  {
    id: 'business-tools',
    titleKey: 'dashboard.sidebar.zone',
    defaultTitle: 'Бизнес-инструменты',
    items: [
      { id: 'leads', icon: Contact, labelKey: 'dashboard.nav.leads', defaultLabel: 'Лиды' },
      { id: 'events', icon: Calendar, labelKey: 'dashboard.nav.events', defaultLabel: 'События' },
    ],
  },
  {
    id: 'account',
    titleKey: 'dashboard.sidebar.account',
    defaultTitle: 'Аккаунт',
    items: [
      { id: 'home', icon: Home, labelKey: 'dashboard.nav.home', defaultLabel: 'Обзор' },
      { id: 'settings', icon: Settings, labelKey: 'dashboard.nav.settings', defaultLabel: 'Настройки' },
    ],
  },
];

import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Kanban from 'lucide-react/dist/esm/icons/kanban';
import CheckSquare from 'lucide-react/dist/esm/icons/check-square';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Package from 'lucide-react/dist/esm/icons/package';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Mail from 'lucide-react/dist/esm/icons/mail';

const BUSINESS_SECTION: SidebarSection = {
  id: 'business-zone',
  titleKey: 'dashboard.sidebar.business_zone',
  defaultTitle: 'Бизнес-зона',
  items: [
    { id: 'zone-dashboard', icon: LayoutDashboard, labelKey: 'zones.nav.dashboard', defaultLabel: 'Дашборд' },
    { id: 'zone-deals', icon: Kanban, labelKey: 'zones.nav.deals', defaultLabel: 'Сделки' },
    { id: 'zone-contacts', icon: Contact, labelKey: 'zones.nav.contacts', defaultLabel: 'Контакты' },
    { id: 'zone-tasks', icon: CheckSquare, labelKey: 'zones.nav.tasks', defaultLabel: 'Задачи' },
    { id: 'zone-inbox', icon: Mail, labelKey: 'zones.nav.inbox', defaultLabel: 'Сообщения' },
    { id: 'zone-calendar', icon: Calendar, labelKey: 'zones.nav.calendar', defaultLabel: 'Календарь' },
    { id: 'zone-invoices', icon: Receipt, labelKey: 'zones.nav.invoices', defaultLabel: 'Финансы' },
    { id: 'zone-products', icon: Package, labelKey: 'zones.nav.products', defaultLabel: 'Продукты' },
    { id: 'zone-automations', icon: Zap, labelKey: 'zones.nav.automations', defaultLabel: 'Автоматизации' },
    { id: 'zone-settings', icon: Settings2, labelKey: 'zones.nav.settings', defaultLabel: 'Настройки зоны' },
  ],
};

export const DashboardSidebar = memo(function DashboardSidebar({
  activeTab,
  onTabChange,
  activityBadge,
  isPremium,
  isBusinessTier = false,
  onSignOut,
  collapsed = false,
  onCollapsedChange,
}: DashboardSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const ZONE_ITEM_IDS = ['zone-dashboard', 'zone-analytics', 'zone-deals', 'zone-contacts', 'zone-inbox', 'zone-tasks', 'zone-automations', 'zone-invoices', 'zone-documents', 'zone-calendar', 'zone-events', 'zone-products', 'zone-settings', 'zone-resources'];

  const handleItemClick = (itemId: string) => {
    const canUseBusinessZone = isPremium || isBusinessTier;
    if (ZONE_ITEM_IDS.includes(itemId) && !canUseBusinessZone) {
      navigate('/pricing');
      return;
    }
    if (itemId === 'templates' || itemId === 'marketplace' || itemId === 'tokens' || itemId === 'achievements') {
      window.dispatchEvent(new CustomEvent(`open${itemId.charAt(0).toUpperCase() + itemId.slice(1)}`));
    } else {
      onTabChange(itemId);
    }
  };

  const renderItem = (item: SidebarItem) => {
    const isActive = activeTab === item.id;
    const isZoneLocked = ZONE_ITEM_IDS.includes(item.id) && !isPremium && !isBusinessTier;
    const Icon = item.icon;
    const badge = item.id === 'activity' ? activityBadge : item.badge;

    const button = (
      <motion.button
        key={item.id}
        onClick={() => handleItemClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-control transition-colors relative group",
          "hover:bg-white/[0.07]",
          isActive
            ? "bg-white/[0.10] text-white font-semibold"
            : "text-white/60 hover:text-white",
          isZoneLocked && "opacity-50",
          collapsed && "justify-center px-0.5"
        )}
        data-testid={`${item.id}-tab`}
        whileTap={{ scale: 0.98 }}
        layout
      >
        {isActive && (
          <motion.span
            layoutId="activeTabIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          />
        )}

        <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }}
              className="flex-1 text-left flex items-center justify-between overflow-hidden whitespace-nowrap"
            >
              <span className="text-sm truncate">{t(item.labelKey, item.defaultLabel)}</span>
              {badge !== undefined && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs h-5 px-1.5 ml-2 shrink-0 border-0",
                    item.badgeVariant === 'premium'
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {badge}
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );

    return (
      <Tooltip key={item.id} delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent 
          side="right" 
          className={cn("font-medium", !collapsed && "hidden")}
        >
          {t(item.labelKey, item.defaultLabel)}
        </TooltipContent>
      </Tooltip>
    );
  };

  const sidebarToggleLabel = `${collapsed ? t('common.show', 'Show') : t('common.hide', 'Hide')} ${t('dashboard.sidebar.tools', 'Tools')}`;

  return (
    <TooltipProvider>
    <motion.aside
      className={cn(
        "app-sidebar hidden md:flex flex-col h-screen sticky top-0 border-r border-white/10 z-50",
      )}
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className={cn("p-4 flex items-center h-16", collapsed ? "justify-center" : "justify-between")}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              <span className="brand-wordmark text-lg">
                Link<span className="brand-wordmark-accent">MAX</span>
              </span>
              {isPremium && (
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs px-1.5 py-0 h-5">
                  <Crown className="h-3 w-3 mr-1" />
                  PRO
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-white/55 hover:bg-white/10 hover:text-white"
          onClick={() => onCollapsedChange?.(!collapsed)}
          aria-label={sidebarToggleLabel}
          title={sidebarToggleLabel}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <div className="px-3 pb-2 pt-1">
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between h-10 border-white/10 bg-white/[0.06] text-white/65 hover:border-white/20 hover:bg-white/[0.10] hover:text-white",
            collapsed && "justify-center px-0"
          )}
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {!collapsed && <span>{t('common.search', 'Search')}</span>}
          </div>
          {!collapsed && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/[0.06] px-1.5 font-mono text-xs font-medium text-white/50">
              K
            </kbd>
          )}
        </Button>
      </div>

      <OrganizationSwitcher collapsed={collapsed} />
      <Suspense fallback={null}><ZoneSwitcherSlot collapsed={collapsed} /></Suspense>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        {/* Main navigation */}
        <div className="space-y-1 mb-6 mt-2">
          {MAIN_ITEMS.map((item) => renderItem(item))}
        </div>

        {/* Business Zone section (Pro + Business tier) */}
        {(isPremium || isBusinessTier) && (
          <div className="mb-6">
            <div className="mx-2 mb-4 h-px bg-white/10" />
            {!collapsed && (
              <div className="text-[11px] font-medium text-white/40 px-3 mb-2 flex items-center justify-between">
                <span>{t(BUSINESS_SECTION.titleKey, BUSINESS_SECTION.defaultTitle)}</span>
              </div>
            )}
            <div className="space-y-1">
              {BUSINESS_SECTION.items.map((item) => renderItem(item))}
            </div>
          </div>
        )}

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.id} className="mb-6">
            {/* Divider before section (except maybe the first one if preferred) */}
            <div className="mx-2 mb-4 h-px bg-white/10" />
            
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="text-[11px] font-medium text-white/40 px-3 mb-2 flex items-center justify-between">
                    <span>{t(section.titleKey, section.defaultTitle)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {section.items.map((item) => renderItem(item))}
            </div>

            {/* Divider when collapsed to separate sections visually */}
            {collapsed && <div className="my-2 h-px bg-white/10 mx-2" />}
          </div>
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-transparent">
        <AnimatePresence>
          {!isPremium && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <Button
                className="w-full h-10 rounded-control bg-primary text-primary-foreground font-bold shadow-[0_12px_28px_-14px_hsl(var(--primary)/0.8)] hover:bg-primary/90"
                onClick={() => navigate('/pricing')}
              >
                <Crown className="h-4 w-4 mr-2" />
                {t('dashboard.sidebar.upgrade', 'Upgrade')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={onSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-white/55 hover:text-destructive hover:bg-destructive/10 transition-all",
            collapsed && "justify-center px-0.5"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm overflow-hidden whitespace-nowrap"
              >
                {t('dashboard.sidebar.signOut', 'Выйти')}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
    </TooltipProvider>
  );
});
