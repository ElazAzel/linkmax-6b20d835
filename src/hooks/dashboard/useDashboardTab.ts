import { useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import type { TabId } from '@/components/dashboard-v2/dashboard-tabs';
import { ALL_TABS } from '@/components/dashboard-v2/dashboard-tabs';

export function useDashboardTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = useMemo((): TabId => {
    if (location.pathname.startsWith('/dashboard/events')) {
      return 'events';
    }
    const tabParam = searchParams.get('tab') as TabId;
    if (tabParam && ALL_TABS.includes(tabParam)) {
      return tabParam;
    }
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (ALL_TABS.includes(lastPart as TabId)) {
      return lastPart as TabId;
    }
    return 'editor';
  }, [searchParams, location.pathname]);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'home') {
      navigate('/dashboard/home');
    } else if (tabId === 'editor') {
      navigate('/dashboard/home?tab=editor');
    } else {
      navigate(`/dashboard/${tabId}`);
    }
  }, [navigate]);

  return { currentTab, handleTabChange, searchParams, setSearchParams };
}
