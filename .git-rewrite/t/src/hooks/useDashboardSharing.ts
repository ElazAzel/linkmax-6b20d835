import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getPublicPageUrl, copyToClipboard } from '@/lib/url-helpers';
import { incrementChallengeProgress, recordActivity } from '@/services/social';

const STORAGE_KEYS = {
  INSTALL_PROMPT_SHOWN: 'linkmax_install_prompt_shown',
  SHARE_DIALOG_COUNT: 'linkmax_share_dialog_count',
} as const;

interface UseDashboardSharingOptions {
  onPublish: () => Promise<string | null>;
  onSave: () => Promise<void>;
  onQuestComplete?: (questKey: string) => void;
  onSaveVersion?: () => Promise<void>;
}

/**
 * Hook to manage sharing, preview, referral dialog, and install prompt logic
 */
export function useDashboardSharing({ onPublish, onSave, onQuestComplete, onSaveVersion }: UseDashboardSharingOptions) {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');

  const handleShare = useCallback(async () => {
    const slug = await onPublish();
    if (!slug) return;

    // Save version snapshot on publish
    await onSaveVersion?.();

    // Mark page as published for achievements
    localStorage.setItem('linkmax_published', 'true');

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
    const shareCount = parseInt(localStorage.getItem(STORAGE_KEYS.SHARE_DIALOG_COUNT) || '0', 10);
    const newCount = shareCount + 1;
    localStorage.setItem(STORAGE_KEYS.SHARE_DIALOG_COUNT, newCount.toString());
    
    // Show on first publish and every 3rd publish
    if (newCount === 1 || newCount % 3 === 0) {
      setTimeout(() => setShowShareDialog(true), 500);
    }

    // Show install prompt for first-time publishers
    const hasSeenInstallPrompt = localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_SHOWN);
    if (!hasSeenInstallPrompt && newCount === 1) {
      setTimeout(() => setShowInstallPrompt(true), 2000);
      localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_SHOWN, 'true');
    }
  }, [onPublish, onQuestComplete, onSaveVersion, t]);

  const handlePreview = useCallback(async () => {
    await onSave();
    const slug = await onPublish();
    if (slug) {
      window.open(`/${slug}`, '_blank');
    }
  }, [onSave, onPublish]);

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
    handlePreview,
    closeInstallPrompt,
    closeShareDialog,
  };
}
