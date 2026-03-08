/**
 * useActivationChecklist - Tracks user activation progress
 * Computes step completion from current page/profile state
 */
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@/lib/storage';
import type { PageData, ProfileBlock } from '@/types/page';

const STORAGE_KEY = 'activation_checklist_dismissed';

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
}

export function useActivationChecklist({
  pageData,
  onOpenEditor,
  onShare,
}: UseActivationChecklistOptions) {
  const { t } = useTranslation();

  const steps = useMemo((): ActivationStep[] => {
    if (!pageData) return [];

    const profileBlock = pageData.blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
    const hasAvatar = !!(profileBlock?.avatar);
    const hasContentBlock = pageData.blocks.some(b => b.type !== 'profile');
    const isPublished = pageData.isPublished || false;
    const hasShared = !!storage.get('has_shared_page');

    return [
      {
        id: 'register',
        labelKey: 'activation.steps.register',
        completed: true, // always done
      },
      {
        id: 'avatar',
        labelKey: 'activation.steps.avatar',
        completed: hasAvatar,
        action: onOpenEditor,
      },
      {
        id: 'first-block',
        labelKey: 'activation.steps.firstBlock',
        completed: hasContentBlock,
        action: onOpenEditor,
      },
      {
        id: 'publish',
        labelKey: 'activation.steps.publish',
        completed: isPublished,
        action: onShare,
      },
      {
        id: 'share',
        labelKey: 'activation.steps.share',
        completed: hasShared,
        action: onShare,
      },
    ];
  }, [pageData, onOpenEditor, onShare]);

  const completedCount = useMemo(() => steps.filter(s => s.completed).length, [steps]);
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount;
  const isDismissed = !!storage.get(STORAGE_KEY);

  const dismiss = useCallback(() => {
    storage.set(STORAGE_KEY, 'true');
  }, []);

  // Visible only if not all done and not dismissed
  const isVisible = totalCount > 0 && !isComplete && !isDismissed;

  return {
    steps,
    completedCount,
    totalCount,
    progress,
    isComplete,
    isVisible,
    dismiss,
  };
}
