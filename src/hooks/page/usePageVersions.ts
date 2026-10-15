/**
 * usePageVersions - Hook for managing page version history
 * Saves up to 5 versions when publishing, allows restoring previous versions
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import type { Block, PageTheme } from '@/types/page';


export interface PageVersion {
  id: string;
  versionId: string;
  publishedAt: string;
  blocks: Block[];
  theme?: PageTheme;
  seo?: { title?: string; description?: string };
}

interface UsePageVersionsResult {
  versions: PageVersion[];
  loading: boolean;
  fetchVersions: (pageId: string) => Promise<void>;
  saveVersion: (pageId: string, blocks: Block[], theme?: PageTheme, seo?: object) => Promise<boolean>;
  restoreVersion: (version: PageVersion) => void;
}

const MAX_VERSIONS = 5;

export function usePageVersions(onRestore?: (blocks: Block[], theme?: PageTheme, seo?: object) => void): UsePageVersionsResult {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async (pageId: string) => {
    if (!pageId) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('page_snapshots')
        .select('*')
        .eq('page_id', pageId)
        .order('published_at', { ascending: false })
        .limit(MAX_VERSIONS);

      if (error) throw error;

      const mapped: PageVersion[] = (data || []).map((row: any) => ({
        id: row.id,
        versionId: row.version_id,
        publishedAt: row.published_at,
        blocks: (row.blocks_json || []).map((block: Block & { content?: Block }) => block.content && typeof block.content === 'object' && 'type' in block.content ? block.content : block) as Block[],
        theme: row.theme_json as unknown as PageTheme | undefined,
        seo: row.seo_json as unknown as { title?: string; description?: string } | undefined,
      }));

      setVersions(mapped);
    } catch (err) {
      logger.error('Failed to fetch versions', err, { context: 'usePageVersions' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Compatibility with the existing onPublish callback: publication already
  // created history in its transaction. Never insert or prune history here.
  const saveVersion = useCallback(async (pageId: string): Promise<boolean> => {
    if (!pageId) return false;
    await fetchVersions(pageId);
    return true;
  }, [fetchVersions]);
  const restoreVersion = useCallback((version: PageVersion) => {
    if (onRestore) {
      onRestore(version.blocks, version.theme, version.seo);
      toast.success('Версия восстановлена');
    }
  }, [onRestore]);

  return {
    versions,
    loading,
    fetchVersions,
    saveVersion,
    restoreVersion,
  };
}
