/**
 * useActivationChecklist v2.0 - Outcome-based activation tracking
 * 4 steps focused on real value delivery, not UI actions
 */
import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@/lib/storage';
import type { PageData } from '@/types/page';

const STORAGE_KEY = 'activation_checklist_dismissed';
const CELEBRATION_KEY = 'activation_celebration_shown';

export interface ActivationStep {
  id: string;
  labelKey: string;
  completed: boolean;
  action?: () => void;
}

interface UseActivationChecklistOptions {
  pageData: PageData | null;
  onOpenEditor: () => void;
  onShare: () => void;
  viewCount?: number;
  leadsCount?: number;
  bookingsCount?: number;
}

export function useActivationChecklist({
  pageData,
  onOpenEditor,
  onShare,
  viewCount = 0,
  leadsCount = 0,
  bookingsCount = 0,
}: UseActivationChecklistOptions) {
  const { t } = useTranslation();
  const [celebrationDismissed, setCelebrationDismissed] = useState(
    () => !!storage.get(CELEBRATION_KEY)
  );

  const steps = useMemo((): ActivationStep[] => {
    if (!pageData) return [];

    const hasPage = pageData.blocks.length > 0;
    const isPublished = pageData.isPublished || false;
    const hasFirstView = (pageData.viewCount || viewCount) >= 1;
    const hasFirstConversion = leadsCount >= 1 || bookingsCount >= 1;
    const hasFirstBooking = bookingsCount >= 1;

    return [
      {
        id: 'create-page',
        labelKey: 'activation.steps.createPage',
        completed: hasPage,
        action: onOpenEditor,
      },
      {
        id: 'publish',
        labelKey: 'activation.steps.publish',
        completed: isPublished,
        action: onShare,
      },
      {
        id: 'first-visitor',
        labelKey: 'activation.steps.firstVisitor',
        completed: hasFirstView,
        action: onShare,
      },
      {
        id: 'first-conversion',
        labelKey: 'activation.steps.firstConversion',
        completed: hasFirstConversion,
        action: onOpenEditor,
      },
      {
        id: 'first-booking',
        labelKey: 'activation.steps.firstBooking',
        completed: hasFirstBooking,
        action: onOpenEditor,
      },
    ];
  }, [pageData, viewCount, leadsCount, bookingsCount, onOpenEditor, onShare]);

  const completedCount = useMemo(() => steps.filter(s => s.completed).length, [steps]);
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount;

  // Published = step 2 done → can dismiss after that
  const isPublished = steps.find(s => s.id === 'publish')?.completed || false;
  const isDismissed = !!storage.get(STORAGE_KEY);

  const dismiss = useCallback(() => {
    storage.set(STORAGE_KEY, 'true');
  }, []);

  const dismissCelebration = useCallback(() => {
    storage.set(CELEBRATION_KEY, 'true');
    setCelebrationDismissed(true);
  }, []);

  // Show celebration when all complete and not yet dismissed
  const showCelebration = isComplete && !celebrationDismissed;

  // Visible: has steps, not all done, and either not dismissed or not yet published
  const isVisible = totalCount > 0 && !isComplete && (!isDismissed || !isPublished);

  // Can dismiss only after publish
  const canDismiss = isPublished;

  return {
    steps,
    completedCount,
    totalCount,
    progress,
    isComplete,
    isVisible,
    showCelebration,
    canDismiss,
    dismiss,
    dismissCelebration,
  };
}
