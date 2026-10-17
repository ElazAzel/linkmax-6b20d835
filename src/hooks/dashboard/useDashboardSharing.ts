import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getPublicPageUrl, copyToClipboard } from '@/lib/utils/url-helpers';
import { incrementChallengeProgress, recordActivity } from '@/services/social';

import { storage } from '@/lib/storage';

const STORAGE_KEYS = {
  INSTALL_PROMPT_SHOWN: 'install_prompt_shown',
  SHARE_DIALOG_COUNT: 'share_dialog_count',
  PUBLISHED: 'published'
} as const;

interface UseDashboardSharingOptions {
  onPublish: () => Promise<string | null>;
  onSave: () => Promise<void>;
  onPreview?: () => void;
  publishedSlug?: string;
  onQuestComplete?: (questKey: string) => void;
  onSaveVersion?: () => Promise<void>;
}

/**
 * Hook to manage sharing, preview, referral dialog, and install prompt logic
 */
export function useDashboardSharing({ onPublish, onPreview, publishedSlug, onQuestComplete, onSaveVersion }: UseDashboardSharingOptions) {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');

  const handlePublish = useCallback(async () => {
    const slug = await onPublish();
    if (!slug) return;

    // Save version snapshot on publish
    await onSaveVersion?.();

    // Mark page as published for achievements
    storage.set(STORAGE_KEYS.PUBLISHED, true);

    const url = getPublicPageUrl(slug);
    setPublishedUrl(url);

    const copied = await copyToClipboard(url);

    if (copied) {
      toast.success(t('toasts.sharing.linkCopied'));
      // Trigger share_page quest
      onQuestComplete?.('share_page');
      // Track challenge progress
      incrementChallengeProgress('share_page');
      // Record activity for friends feed
      recordActivity('page_published', { slug });
    } else {
      toast.error(t('toasts.sharing.copyError'));
    }

    // Show share/referral dialog periodically (every 3 publishes)
    const shareCount = storage.get<number>(STORAGE_KEYS.SHARE_DIALOG_COUNT) || 0;
    const newCount = shareCount + 1;
    storage.set(STORAGE_KEYS.SHARE_DIALOG_COUNT, newCount);

    // Show on first publish and every 3rd publish
    if (newCount === 1 || newCount % 3 === 0) {
      setTimeout(() => setShowShareDialog(true), 500);
    }

    // The install prompt used to open 2 s later on top of the share dialog;
    // it no longer piggybacks on publishing.
  }, [onPublish, onQuestComplete, onSaveVersion, t]);

  const handleShare = useCallback(async () => {
    if (!publishedSlug) {
      toast.info(t('pageV2.draft.publishFirst', 'Сначала опубликуйте страницу.'));
      return;
    }
    const url = getPublicPageUrl(publishedSlug);
    setPublishedUrl(url);
    // Sharing an already published page is a plain share, not the
    // "Опубликовано!" celebration with confetti it used to open every time.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches) {
      try {
        await navigator.share({ url });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }
    const copied = await copyToClipboard(url);
    if (copied) toast.success(t('toasts.sharing.linkCopied'));
    else toast.error(t('toasts.sharing.copyError'));
  }, [publishedSlug, t]);

  const handlePreview = useCallback(async () => { onPreview?.(); }, [onPreview]);

  const closeInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  const closeShareDialog = useCallback(() => {
    setShowShareDialog(false);
  }, []);

  return {
    showInstallPrompt,
    showShareDialog,
    publishedUrl,
    handleShare,
    handlePublish,
    handlePreview,
    closeInstallPrompt,
    closeShareDialog,
  };
}
