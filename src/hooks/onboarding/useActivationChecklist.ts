/**
 * useActivationChecklist v2.0 - Outcome-based activation tracking
 * 4 steps focused on real value delivery, not UI actions
 */
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { storage } from '@/lib/storage';
import { trackActivationEvent } from '@/lib/activation-events';
import type { PageData } from '@/types/page';
import { useBusinessFeatures } from '@/lib/features';

const STORAGE_KEY = 'activation_checklist_dismissed';
const CELEBRATION_KEY = 'activation_celebration_shown';

export interface ActivationStep {
  id: string;
  labelKey: string;
  completed: boolean;
  href: string;
  action?: () => void;
  ctaKey: string;
}

interface UseActivationChecklistOptions {
  pageData: PageData | null;
  onOpenEditor: () => void;
  onShare: () => void;
  /** Publishes the page; the publish step used to only copy the link. */
  onPublish?: () => void;
  pageId?: string;
  leadsCount?: number;
  telegramChatId?: string;
  onNavigate?: (tabId: string) => void;
}

export function useActivationChecklist({
  pageData,
  onOpenEditor,
  onShare,
  onPublish,
  pageId,
  leadsCount = 0,
  telegramChatId,
  onNavigate,
}: UseActivationChecklistOptions) {
  const [celebrationDismissed, setCelebrationDismissed] = useState(
    () => !!storage.get(CELEBRATION_KEY)
  );

  const businessEnabled = useBusinessFeatures();

  const steps = useMemo((): ActivationStep[] => {
    if (!pageData) return [];

    const hasPage = !!pageData.id;
    const hasContentBlock = pageData.blocks.some(block => block.type !== 'profile');
    const isPublished = pageData.isPublished || false;
    const hasFirstLead = leadsCount >= 1;
    const isTelegramConnected = !!telegramChatId;

    // Blocks are flat ({ type, items, url }); this used to read b.content.*,
    // so these two steps never completed.
    const field = (b: unknown, key: string): unknown => {
      const rec = b as Record<string, unknown>;
      const content = rec.content as Record<string, unknown> | undefined;
      return rec[key] ?? content?.[key];
    };
    const hasPricingWithItems = pageData.blocks.some((b) =>
      (b.type === 'pricing' || b.type === 'catalog') && Array.isArray(field(b, 'items')) && (field(b, 'items') as unknown[]).length > 0
    ) || pageData.blocks.some((b) => b.type === 'product' && !!field(b, 'name'));
    const CONTACT_URL = /(wa\.me|whatsapp|t\.me|telegram|instagram|tel:|mailto:)/;
    const hasContactChannel = pageData.blocks.some((b) => {
      if (b.type === 'socials') {
        const platforms = field(b, 'platforms');
        return Array.isArray(platforms) && platforms.some((p) => !!(p as { url?: string })?.url);
      }
      if (b.type === 'messenger') {
        const messengers = field(b, 'messengers');
        return Array.isArray(messengers) && messengers.some((m) => !!(m as { username?: string })?.username);
      }
      if (b.type === 'link' || b.type === 'button') {
        return CONTACT_URL.test(String(field(b, 'url') || '').toLowerCase());
      }
      return b.type === 'form';
    });

    const items: ActivationStep[] = [
      {
        id: 'create-page',
        labelKey: 'activation.steps.createPage',
        completed: hasPage,
        action: onOpenEditor,
        ctaKey: 'activation.cta.openEditor',
        href: '/dashboard/pages?action=create',
      },
      {
        id: 'add-block',
        labelKey: 'activation.steps.addBlock',
        completed: hasContentBlock,
        action: onOpenEditor,
        ctaKey: 'activation.cta.addBlock',
        href: '/dashboard/home?tab=editor&action=add-block',
      },
      ...(businessEnabled ? [{
        id: 'add-services',
        labelKey: 'activation.steps.addServices',
        completed: hasPricingWithItems,
        action: onOpenEditor,
        ctaKey: 'activation.cta.addServices',
        href: '/dashboard/home?tab=editor&action=add-pricing',
      }] : []),
      {
        id: 'add-contact',
        labelKey: 'activation.steps.addContact',
        completed: hasContactChannel,
        action: onOpenEditor,
        ctaKey: 'activation.cta.addContact',
        href: '/dashboard/home?tab=editor&action=add-socials',
      },
      {
        id: 'publish',
        labelKey: 'activation.steps.publish',
        completed: isPublished,
        action: onPublish ?? onShare,
        ctaKey: 'activation.cta.publish',
        href: '/dashboard/home?tab=editor&action=publish',
      },
    ];

    // Add connect telegram for experts
    if (pageData.niche === 'expert') {
      items.push({
        id: 'connect-telegram',
        labelKey: 'activation.steps.connectTelegram',
        completed: isTelegramConnected,
        action: () => onNavigate?.('settings'),
        ctaKey: 'activation.cta.connectTelegram',
        href: '/dashboard/settings?action=connect-telegram',
      });
    }

    items.push({
      id: 'first-lead',
      labelKey: 'activation.steps.firstLead',
      completed: hasFirstLead,
      action: onShare,
      ctaKey: 'activation.cta.promotePage',
      href: '/dashboard/activity?action=first-lead',
    });

    return items;
  }, [pageData, leadsCount, telegramChatId, onOpenEditor, onShare, onPublish, onNavigate, businessEnabled]);

  const completedCount = useMemo(() => steps.filter(s => s.completed).length, [steps]);
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount;

  // Published = step 3 done → can dismiss after that
  const isPublished = steps.find(s => s.id === 'publish')?.completed || false;
  const isDismissed = !!storage.get(STORAGE_KEY);

  const dismiss = useCallback(() => {
    storage.set(STORAGE_KEY, 'true');
  }, []);

  const dismissCelebration = useCallback(() => {
    storage.set(CELEBRATION_KEY, 'true');
    setCelebrationDismissed(true);
  }, []);


  const completedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!pageId || steps.length === 0) return;
    steps.forEach((step) => {
      const wasCompleted = completedRef.current[step.id] || false;
      if (!wasCompleted && step.completed) {
        trackActivationEvent(pageId, 'activation_checklist_step_completed', {
          stepId: step.id,
          href: step.href,
        });
      }
      completedRef.current[step.id] = step.completed;
    });
  }, [pageId, steps]);

  const handleStepClick = useCallback((step: ActivationStep) => {
    if (!pageId || step.completed) return;
    trackActivationEvent(pageId, 'activation_checklist_step_clicked', {
      stepId: step.id,
      href: step.href,
    });
  }, [pageId]);

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
    handleStepClick,
  };
}
