import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { loadPageBySlug, loadPageByCustomDomain, loadUserPage } from '@/services/database';
import type { PageData } from '@/types/page';
import { loadPageDraft, savePageDraft, publishPageDraft, draftError, type PageDraft } from '@/services/page-drafts';
import { loadDraft } from '@/pwa/offlineDraftCache';
import { pageDraftCacheKey, type LocalPageDraft } from '@/lib/page-draft-cache';
import { ensureBlockIds } from '@/lib/blocks/block-ids';
// Query keys for cache management
export const pageQueryKeys = {
  publicPage: (slug: string) => ['page', 'public', slug] as const,
  publicPageByDomain: (domain: string) => ['page', 'public', 'domain', domain] as const,
  // Prefix ['page','user',userId] still matches every page of the user for invalidation
  userPage: (userId: string, pageId?: string | null) => ['page', 'user', userId, pageId ?? 'primary'] as const,
  allPages: ['page'] as const,
};

// Hook for loading public pages by slug with caching
export function usePublicPage(slug: string | undefined, placeholder?: PageData) {
  return useQuery({
    // Server snapshot: render it immediately, still fetch the live page.
    placeholderData: placeholder,
    queryKey: pageQueryKeys.publicPage(slug || ''),
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await loadPageBySlug(slug);
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  });
}

// Hook for loading public pages by custom domain with caching
export function usePublicPageByDomain(domain: string | undefined) {
  return useQuery({
    queryKey: pageQueryKeys.publicPageByDomain(domain || ''),
    queryFn: async () => {
      if (!domain) return null;
      const { data, error } = await loadPageByCustomDomain(domain);
      if (error) throw error;
      return data;
    },
    enabled: !!domain,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Drafts copied from published rows inherit their missing block ids.
function withBlockIds<T extends { blocks?: PageData['blocks'] }>(page: T): T {
  return Array.isArray(page?.blocks) ? { ...page, blocks: ensureBlockIds(page.blocks) } : page;
}

type UserPageResult = { pageData: PageData | null; chatbotContext?: string | null; draft: PageDraft | null; draftError: ReturnType<typeof draftError> | null };

/** The private draft of one page, with the local copy or published row as fallbacks. */
async function loadSelectedPage(userId: string, pageId: string): Promise<UserPageResult> {
  try {
    const draft = await loadPageDraft(pageId);
    return { pageData: withBlockIds(draft.snapshot), chatbotContext: draft.chatbot_context, draft, draftError: null };
  } catch (error) {
    const problem = draftError(error);
    if (problem.kind === 'access') throw problem;
    const local = loadDraft<LocalPageDraft>(pageDraftCacheKey(userId, pageId))?.data;
    if (local?.pageData?.id === pageId) return { pageData: local.pageData, chatbotContext: local.chatbotContext, draft: null, draftError: problem };
    const { data, chatbotContext, error: loadError } = await loadUserPage(userId, pageId);
    if (loadError) throw loadError;
    // Published content is a read-only seed for a usable local draft.
    return { pageData: data, chatbotContext, draft: null, draftError: problem };
  }
}

// Hook for loading user's page with caching
export function useUserPage(userId: string | undefined, pageId?: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: pageQueryKeys.userPage(userId || '', pageId),
    queryFn: async (): Promise<UserPageResult | null> => {
      if (!userId) return null;
      if (pageId) return loadSelectedPage(userId, pageId);
      const { data, chatbotContext, error } = await loadUserPage(userId, pageId);
      if (error) throw error;
      if (!data?.id) return { pageData: data, chatbotContext, draft: null, draftError: null };
      // The page list usually selects this page by id while this query runs.
      // Go through that query so both share one draft request.
      return queryClient.fetchQuery({
        queryKey: pageQueryKeys.userPage(userId, data.id),
        queryFn: () => loadSelectedPage(userId, data.id),
        staleTime: 2 * 60 * 1000,
      });
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

type CachedUserPage = UserPageResult;
export function synchronizeDraftCache(queryClient: QueryClient, userId: string, draft: PageDraft) {
  queryClient.setQueriesData<CachedUserPage>({ queryKey: ['page', 'user', userId] }, old => {
    if (old?.pageData?.id !== draft.page_id) return old;
    if (old.draft && (old.draft.revision > draft.revision || (old.draft.revision === draft.revision && old.draft.base_published_revision > draft.base_published_revision))) return old;
    return { pageData: draft.snapshot, chatbotContext: draft.chatbot_context, draft, draftError: null };
  });
}

export function useSavePageMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageData, chatbotContext, revision, basePublishedRevision }: {
      pageData: PageData; chatbotContext?: string; revision: number; basePublishedRevision: number;
    }) => {
      if (!userId) throw new Error('User ID is required');
      const draft = await savePageDraft(pageData, revision, basePublishedRevision, chatbotContext);
      synchronizeDraftCache(queryClient, userId, draft);
      return { draft, dbPage: { id: draft.page_id, slug: pageData.slug, is_published: pageData.isPublished }, pageData, chatbotContext };
    },
  });
}

export function usePublishPageMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, revision, basePublishedRevision }: { pageId: string; revision: number; basePublishedRevision: number }): Promise<PageDraft> => {
      if (!userId) throw new Error('User ID is required');
      return publishPageDraft(pageId, revision, basePublishedRevision);
    },
    onSuccess: (draft) => {
      if (userId) synchronizeDraftCache(queryClient, userId, draft);
      void queryClient.invalidateQueries({ queryKey: ['page', 'public'] });
    },
  });
}
// Utility to prefetch public page (useful for link hovers)
function usePrefetchPublicPage() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: pageQueryKeys.publicPage(slug),
      queryFn: async () => {
        const { data, error } = await loadPageBySlug(slug);
        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}
