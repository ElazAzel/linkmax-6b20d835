/**
 * useActivationChecklist v2.0 - Outcome-based activation tracking
 * 4 steps focused on real value delivery, not UI actions
 */
import { useMemo, useCallback, useState } from 'react';
import { storage } from '@/lib/storage';
import type { PageData } from '@/types/page';

const STORAGE_KEY = 'activation_checklist_dismissed';
const CELEBRATION_KEY = 'activation_celebration_shown';

export interface ActivationStep {
  id: string;
  labelKey: string;
  completed: boolean;
  action?: () => void;
  ctaKey: string;
}

interface UseActivationChecklistOptions {
  pageData: PageData | null;
  onOpenEditor: () => void;
  onShare: () => void;
  leadsCount?: number;
}

export function useActivationChecklist({
  pageData,
  onOpenEditor,
  onShare,
  leadsCount = 0,
}: UseActivationChecklistOptions) {
  const [celebrationDismissed, setCelebrationDismissed] = useState(
    () => !!storage.get(CELEBRATION_KEY)
  );

  const steps = useMemo((): ActivationStep[] => {
    if (!pageData) return [];

    const hasPage = !!pageData.id;
    const hasContentBlock = pageData.blocks.some(block => block.type !== 'profile');
    const isPublished = pageData.isPublished || false;
    const hasFirstLead = leadsCount >= 1;

    return [
      {
        id: 'create-page',
        labelKey: 'activation.steps.createPage',
        completed: hasPage,
        action: onOpenEditor,
        ctaKey: 'activation.cta.openEditor',
      },
      {
        id: 'add-block',
        labelKey: 'activation.steps.addBlock',
        completed: hasContentBlock,
        action: onOpenEditor,
        ctaKey: 'activation.cta.addBlock',
      },
      {
        id: 'publish',
        labelKey: 'activation.steps.publish',
        completed: isPublished,
        action: onShare,
        ctaKey: 'activation.cta.publish',
      },
      {
        id: 'first-lead',
        labelKey: 'activation.steps.firstLead',
        completed: hasFirstLead,
        action: onOpenEditor,
        ctaKey: 'activation.cta.promotePage',
      },
    ];
  }, [pageData, leadsCount, onOpenEditor, onShare]);

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
