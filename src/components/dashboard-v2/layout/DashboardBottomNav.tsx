import { LINKMAX_UI_V2 } from '@/lib/ui-v2';
import { LegacyBottomNav } from './LegacyBottomNav';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';
import { useHapticFeedback } from '@/hooks/ui/useHapticFeedback';
import { PAGE_V2_TABS, BUSINESS_TAB_IDS } from './page-v2-navigation';

interface DashboardBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  activityBadge?: number;
  isPremium?: boolean;
  isBusinessTier?: boolean;
}

export const DashboardBottomNav = memo(function DashboardBottomNav({ activeTab, onTabChange, activityBadge }: DashboardBottomNavProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  if (!LINKMAX_UI_V2) return <LegacyBottomNav activeTab={activeTab} onTabChange={onTabChange} activityBadge={activityBadge} />;
  return <nav aria-label={t('pageV2.navigation.label', 'Навигация кабинета')} className="fixed bottom-0 inset-x-0 z-50 px-2 pb-2 safe-area-bottom md:hidden pointer-events-none">
    <div className="app-bottom-nav mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 overflow-hidden rounded-3xl border border-border bg-card shadow-lg pointer-events-auto">
      {PAGE_V2_TABS.map(tab => {
        const Icon = tab.icon;
        const active = tab.id === activeTab || (tab.id === 'business' && (BUSINESS_TAB_IDS.includes(activeTab) || activeTab.startsWith('zone-')));
        const label = t(tab.labelKey, tab.defaultLabel);
        return <button key={tab.id} type="button" onClick={() => { haptic.lightTap(); onTabChange(tab.id); }} aria-label={label} aria-current={active ? 'page' : undefined} data-testid={tab.id + '-tab'} className={cn('relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary', active ? 'text-primary font-semibold' : 'text-muted-foreground')}>
          <span className={cn('relative flex h-8 w-8 items-center justify-center', tab.id === 'add' && 'rounded-full bg-primary text-primary-foreground')}><Icon className="h-[19px] w-[19px]" aria-hidden="true" />
            {tab.id === 'business' && Boolean(activityBadge && activityBadge > 0) && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary" />}
          </span>
          <span className="w-full truncate text-center text-[10px] leading-tight">{label}</span>
        </button>;
      })}
    </div>
  </nav>;
});
