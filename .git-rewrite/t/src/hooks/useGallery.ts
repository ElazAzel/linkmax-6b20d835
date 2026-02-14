import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  getGalleryPages, 
  getNicheCounts,
  toggleGalleryStatus, 
  likeGalleryPage,
  unlikeGalleryPage,
  getMyGalleryStatus,
  type GalleryPage 
} from '@/services/gallery';
import type { Niche } from '@/lib/niches';

export function useGallery() {
  const { t } = useTranslation();
  const [pages, setPages] = useState<GalleryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [nicheCounts, setNicheCounts] = useState<Record<string, number>>({});

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesData, countsData] = await Promise.all([
        getGalleryPages(selectedNiche),
        getNicheCounts(),
      ]);
      
      setPages(pagesData);
      setNicheCounts(countsData);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedNiche]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const likePage = useCallback(async (pageId: string) => {
    try {
      await likeGalleryPage(pageId);
      setPages(prev => 
        prev.map(p => 
          p.id === pageId ? { ...p, gallery_likes: p.gallery_likes + 1 } : p
        )
      );
    } catch {
      toast.error(t('toasts.gallery.likeError'));
    }
  }, [t]);

  const unlikePage = useCallback(async (pageId: string) => {
    try {
      await unlikeGalleryPage(pageId);
      setPages(prev => 
        prev.map(p => 
          p.id === pageId ? { ...p, gallery_likes: Math.max(0, p.gallery_likes - 1) } : p
        )
      );
    } catch {
      toast.error(t('toasts.gallery.unlikeError'));
    }
  }, [t]);

  return { 
    pages, 
    loading, 
    likePage,
    unlikePage,
    refetch: fetchPages,
    selectedNiche,
    setSelectedNiche,
    nicheCounts,
  };
}

export function useGalleryStatus(userId: string | undefined) {
  const { t } = useTranslation();
  const [isInGallery, setIsInGallery] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getMyGalleryStatus(userId).then(setIsInGallery);
  }, [userId]);

  const toggle = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const newStatus = await toggleGalleryStatus(userId);
      setIsInGallery(newStatus);
      toast.success(
        newStatus 
          ? t('toasts.gallery.addedToGallery')
          : t('toasts.gallery.removedFromGallery')
      );
    } catch {
      toast.error(t('toasts.gallery.updateError'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  return { isInGallery, loading, toggle };
}
