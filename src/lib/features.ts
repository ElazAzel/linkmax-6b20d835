/**
 * Business features (sales blocks, CRM, bookings, finance, team, zones).
 *
 * Off by default so the cabinet is a focused page builder. Turn them on for a
 * whole build with VITE_LINKMAX_BUSINESS=true, or per browser from
 * Settings → «Бизнес-инструменты» (stored locally). Nothing is deleted: pages
 * that already contain business blocks keep rendering them.
 */
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'lm-business-features';
const CHANGE_EVENT = 'lm-business-features-change';

export const BUSINESS_FEATURES_DEFAULT = import.meta.env.VITE_LINKMAX_BUSINESS === 'true';

/** Block types offered in the insert sheet only when business features are on. */
export const BUSINESS_BLOCK_TYPES: ReadonlySet<string> = new Set([
  'product', 'catalog', 'pricing', 'booking', 'event', 'community', 'newsletter', 'shoutout', 'scratch',
]);

/** Dashboard tabs that belong to the business area. */
export const BUSINESS_DASHBOARD_TABS: ReadonlySet<string> = new Set([
  'business', 'clients', 'calendar', 'offers', 'activity', 'finance', 'monetize', 'leads', 'events', 'team',
]);

export function isBusinessFeaturesEnabled(): boolean {
  if (BUSINESS_FEATURES_DEFAULT || typeof window === 'undefined') return BUSINESS_FEATURES_DEFAULT;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'on') return true;
    if (stored === 'off') return false;
  } catch {
    // Storage blocked: fall back to the build default.
  }
  return BUSINESS_FEATURES_DEFAULT;
}

export function setBusinessFeaturesEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage blocked: the change lasts for this tab only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) onChange(); };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useBusinessFeatures(): boolean {
  return useSyncExternalStore(subscribe, isBusinessFeaturesEnabled, () => BUSINESS_FEATURES_DEFAULT);
}

export function isBusinessDashboardTab(tab: string): boolean {
  return BUSINESS_DASHBOARD_TABS.has(tab) || tab.startsWith('zone-');
}
