/**
 * Sites hooks — React Query wrappers for the sites service.
 * Sprint 1: Multi-Page Foundation.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMySite,
  ensureSiteForUser,
  listSitePages,
  updateSite,
  createSubPage,
  deleteSubPage,
  setPagePublished,
  updateSubPage,
  getSitePagesStats,
  applySiteTemplate,
  getPageSettings,
  updatePageSettings,
  type PageSettingsPayload,
} from '@/services/sites';
import type { Site } from '@/types/site';

export const siteKeys = {
  mySite: (userId: string) => ['site', 'my', userId] as const,
  pages: (siteId: string) => ['site', 'pages', siteId] as const,
};

export function useMySite(userId: string | undefined) {
  return useQuery({
    queryKey: siteKeys.mySite(userId || ''),
    queryFn: () => (userId ? ensureSiteForUser(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSitePages(siteId: string | undefined) {
  return useQuery({
    queryKey: siteKeys.pages(siteId || ''),
    queryFn: () => (siteId ? listSitePages(siteId) : Promise.resolve([])),
    enabled: !!siteId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateSite(siteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateSite>[1]) => {
      if (!siteId) throw new Error('siteId required');
      return updateSite(siteId, patch);
    },
    onSuccess: (site: Site | null) => {
      if (site) qc.invalidateQueries({ queryKey: ['site', 'my', site.user_id] });
    },
  });
}

export function useCreateSubPage(siteId: string | undefined, userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { pagePath: string; title: string; seedBlocks?: Parameters<typeof createSubPage>[0]['seedBlocks'] }) => {
      if (!siteId || !userId) throw new Error('siteId and userId required');
      return createSubPage({ siteId, userId, ...input });
    },
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: siteKeys.pages(siteId) });
    },
  });
}

export function useDeleteSubPage(siteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) => deleteSubPage(pageId),
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: siteKeys.pages(siteId) });
    },
  });
}

export function useSetPagePublished(siteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { pageId: string; isPublished: boolean }) =>
      setPagePublished(input.pageId, input.isPublished),
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: siteKeys.pages(siteId) });
    },
  });
}

export function useUpdateSubPage(siteId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { pageId: string; title?: string; pagePath?: string }) =>
      updateSubPage(input.pageId, { title: input.title, pagePath: input.pagePath }),
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: siteKeys.pages(siteId) });
    },
  });
}

// Re-export for direct use
export { getMySite } from '@/services/sites';

export const sitePagesStatsKey = (siteId: string, days: number) =>
  ['site', 'pages-stats', siteId, days] as const;

export function useSitePagesStats(siteId: string | undefined, days = 30) {
  return useQuery({
    queryKey: sitePagesStatsKey(siteId || '', days),
    queryFn: () => (siteId ? getSitePagesStats(siteId, days) : Promise.resolve({})),
    enabled: !!siteId,
    staleTime: 60 * 1000,
  });
}

export function useApplySiteTemplate(siteId: string | undefined, userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pages: Parameters<typeof applySiteTemplate>[0]['pages']) => {
      if (!siteId || !userId) throw new Error('siteId and userId required');
      return applySiteTemplate({ siteId, userId, pages });
    },
    onSuccess: () => {
      if (siteId) qc.invalidateQueries({ queryKey: siteKeys.pages(siteId) });
    },
  });
}
