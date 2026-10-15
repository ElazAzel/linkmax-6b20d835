import FileText from 'lucide-react/dist/esm/icons/file-text';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Plus from 'lucide-react/dist/esm/icons/plus';
import BriefcaseBusiness from 'lucide-react/dist/esm/icons/briefcase-business';
import Settings from 'lucide-react/dist/esm/icons/settings';
import { LINKMAX_UI_V2 } from '@/lib/ui-v2';

export const PAGE_V2_TABS = [
  { id: 'editor', icon: FileText, labelKey: 'pageV2.navigation.page', defaultLabel: 'Моя страница' },
  { id: 'home', icon: BarChart3, labelKey: 'pageV2.navigation.overview', defaultLabel: 'Обзор' },
  { id: 'add', icon: Plus, labelKey: 'pageV2.navigation.add', defaultLabel: 'Добавить' },
  { id: 'business', icon: BriefcaseBusiness, labelKey: 'pageV2.navigation.business', defaultLabel: 'Бизнес' },
  { id: 'settings', icon: Settings, labelKey: 'dashboard.nav.settings', defaultLabel: 'Настройки' },
];

export const BUSINESS_TAB_IDS = ['business', 'clients', 'calendar', 'offers', 'activity', 'finance', 'monetize', 'leads', 'events', 'team'];

export function pageV2TabHref(tab: string): string {
  return `/dashboard/home?tab=${encodeURIComponent(tab)}`;
}

export function getPageV2Tab(search: string, pathname: string, allowed: readonly string[]): string {
  const tab = new URLSearchParams(search).get('tab');
  if (tab && allowed.includes(tab)) return tab;
  const last = pathname.split('/').filter(Boolean).at(-1);
  return last && last !== 'home' && allowed.includes(last) ? last : LINKMAX_UI_V2 ? 'editor' : 'home';
}
