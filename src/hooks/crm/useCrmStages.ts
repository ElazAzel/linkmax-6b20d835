import { useSyncExternalStore, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeadStatus } from './useLeads';
import {
  getCustomStageLabels,
  setCustomStageLabels,
  resetCustomStageLabels,
  resolveStageLabel,
  subscribeStageLabels,
  type CrmStageLabels,
} from '@/lib/crm/crm-lite';

let cachedRaw = '';
let cachedSnapshot: Partial<CrmStageLabels> = {};

function getSnapshot(): Partial<CrmStageLabels> {
  if (typeof window === 'undefined') return cachedSnapshot;
  try {
    const raw = window.localStorage.getItem('lm_crm_lite_stages_v1') || '';
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedSnapshot = getCustomStageLabels();
    }
  } catch {
    // ignore
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: Partial<CrmStageLabels> = {};
function getServerSnapshot(): Partial<CrmStageLabels> {
  return SERVER_SNAPSHOT;
}

export function useCrmStages() {
  const { i18n } = useTranslation();
  const customLabels = useSyncExternalStore(subscribeStageLabels, getSnapshot, getServerSnapshot);

  const getStageLabel = useCallback(
    (status: LeadStatus) => resolveStageLabel(status, customLabels, i18n.language),
    [customLabels, i18n.language],
  );

  const saveStageLabels = useCallback((next: Partial<CrmStageLabels>) => {
    setCustomStageLabels(next);
  }, []);

  const resetStageLabels = useCallback(() => {
    resetCustomStageLabels();
  }, []);

  return {
    customLabels,
    getStageLabel,
    saveStageLabels,
    resetStageLabels,
  };
}
