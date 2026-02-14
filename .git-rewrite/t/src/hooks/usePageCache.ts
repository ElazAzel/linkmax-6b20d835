import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadPageBySlug, loadUserPage, savePage, publishPage } from '@/lib/database';
import type { PageData } from '@/types/page';
import { toast } from 'sonner';

// Query keys for cache management
export const pageQueryKeys = {
  publicPage: (slug: string) => ['page', 'public', slug] as const,
  userPage: (userId: string) => ['page', 'user', userId] as const,
  allPages: ['page'] as const,
};

// Hook for loading public pages with caching
export function usePublicPage(slug: string | undefined) {
  return useQuery({
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

// Hook for loading user's page with caching
export function useUserPage(userId: string | undefined) {
  return useQuery({
    queryKey: pageQueryKeys.userPage(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const { data, chatbotContext, error } = await loadUserPage(userId);
      if (error) throw error;
      return { pageData: data, chatbotContext };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Hook for saving user's page with cache update (not invalidation)
export function useSavePageMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      pageData, 
      chatbotContext 
    }: { 
      pageData: PageData; 
      chatbotContext?: string;
    }) => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await savePage(pageData, userId, chatbotContext);
      if (error) throw error;
      return { dbPage: data, pageData, chatbotContext };
    },
    onSuccess: ({ dbPage, pageData, chatbotContext }) => {
      // Update cache directly instead of invalidating to preserve local state
      if (userId) {
        queryClient.setQueryData(
          pageQueryKeys.userPage(userId),
          { pageData, chatbotContext }
        );
      }
      // Invalidate public page cache if published
      if (dbPage?.slug && dbPage?.is_published) {
        queryClient.invalidateQueries({ 
          queryKey: pageQueryKeys.publicPage(dbPage.slug) 
        });
      }
    },
    onError: (error: any) => {
      console.error('Error saving page:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    },
  });
}

// Hook for publishing page with cache update
export function usePublishPageMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { slug, error } = await publishPage(userId);
      if (error) throw error;
      return slug;
    },
    onSuccess: (slug) => {
      // Don't invalidate user cache to preserve local state
      // Only invalidate public page cache
      if (slug) {
        queryClient.invalidateQueries({ 
          queryKey: pageQueryKeys.publicPage(slug) 
        });
      }
    },
    onError: (error) => {
      console.error('Error publishing page:', error);
      toast.error('Failed to publish page');
    },
  });
}

// Utility to prefetch public page (useful for link hovers)
export function usePrefetchPublicPage() {
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
