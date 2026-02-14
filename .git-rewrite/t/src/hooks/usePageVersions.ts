/**
 * usePageVersions - Hook for managing page version history
 * Saves up to 5 versions when publishing, allows restoring previous versions
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Block, PageTheme } from '@/types/page';
import type { Json } from '@/platform/supabase/types';

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
      const { data, error } = await supabase
        .from('page_snapshots')
        .select('*')
        .eq('page_id', pageId)
        .order('published_at', { ascending: false })
        .limit(MAX_VERSIONS);

      if (error) throw error;

      const mapped: PageVersion[] = (data || []).map((row) => ({
        id: row.id,
        versionId: row.version_id,
        publishedAt: row.published_at,
        blocks: row.blocks_json as unknown as Block[],
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

  const saveVersion = useCallback(async (
    pageId: string,
    blocks: Block[],
    theme?: PageTheme,
    seo?: object
  ): Promise<boolean> => {
    if (!pageId) return false;

    try {
      // Generate content hash for deduplication
      const contentHash = btoa(JSON.stringify(blocks).slice(0, 100));
      const versionId = `v-${Date.now()}`;

      // Insert new version
      const { error: insertError } = await supabase
        .from('page_snapshots')
        .insert({
          page_id: pageId,
          version_id: versionId,
          blocks_json: JSON.parse(JSON.stringify(blocks)) as Json,
          theme_json: theme ? (JSON.parse(JSON.stringify(theme)) as Json) : null,
          seo_json: seo ? (JSON.parse(JSON.stringify(seo)) as Json) : null,
          content_hash: contentHash,
          published_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Clean up old versions (keep only MAX_VERSIONS)
      const { data: allVersions } = await supabase
        .from('page_snapshots')
        .select('id, published_at')
        .eq('page_id', pageId)
        .order('published_at', { ascending: false });

      if (allVersions && allVersions.length > MAX_VERSIONS) {
        const toDelete = allVersions.slice(MAX_VERSIONS).map((v) => v.id);
        await supabase
          .from('page_snapshots')
          .delete()
          .in('id', toDelete);
      }

      // Refresh versions list
      await fetchVersions(pageId);

      return true;
    } catch (err) {
      logger.error('Failed to save version', err, { context: 'usePageVersions' });
      return false;
    }
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
