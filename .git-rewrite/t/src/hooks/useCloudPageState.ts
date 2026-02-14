import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useUserPage, useSavePageMutation, usePublishPageMutation, pageQueryKeys } from '@/hooks/usePageCache';
import type { PageData, Block } from '@/types/page';
import { toast } from 'sonner';

export function useCloudPageState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [chatbotContext, setChatbotContext] = useState<string>('');

  // Use React Query for cached page loading
  const { data: userData, isLoading: loading, refetch } = useUserPage(user?.id);
  const savePageMutation = useSavePageMutation(user?.id);
  const publishPageMutation = usePublishPageMutation(user?.id);

  // Update local state when cached data loads
  useEffect(() => {
    if (userData) {
      setPageData(userData.pageData);
      setChatbotContext(userData.chatbotContext || '');
    }
  }, [userData]);

  const save = useCallback(async () => {
    if (!user || !pageData) return;
    
    await savePageMutation.mutateAsync({ 
      pageData, 
      chatbotContext 
    });
    
    toast.success('Changes saved!');
  }, [user, pageData, chatbotContext, savePageMutation]);

  const publish = useCallback(async () => {
    if (!user || !pageData) return null;
    
    // Save first
    await savePageMutation.mutateAsync({ 
      pageData, 
      chatbotContext 
    });
    
    // Then publish
    const slug = await publishPageMutation.mutateAsync();
    return slug;
  }, [user, pageData, chatbotContext, savePageMutation, publishPageMutation]);

  const addBlock = useCallback((block: Block, position?: number) => {
    if (!pageData || !user) return;
    
    let newBlocks: Block[];
    if (typeof position === 'number') {
      // Find the profile block index (always at position 0)
      const profileIndex = pageData.blocks.findIndex(b => b.type === 'profile');
      // Calculate actual insertion index (after profile + position in content blocks)
      const insertIndex = profileIndex >= 0 ? profileIndex + 1 + position : position;
      newBlocks = [
        ...pageData.blocks.slice(0, insertIndex),
        block,
        ...pageData.blocks.slice(insertIndex),
      ];
    } else {
      newBlocks = [...pageData.blocks, block];
    }
    
    const newPageData = {
      ...pageData,
      blocks: newBlocks,
    };
    setPageData(newPageData);
    // Auto-save after adding block
    setTimeout(() => {
      savePageMutation.mutate({ 
        pageData: newPageData, 
        chatbotContext 
      });
    }, 500);
  }, [pageData, user, chatbotContext, savePageMutation]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    if (!pageData || !user) return;
    const newPageData = {
      ...pageData,
      blocks: pageData.blocks.map(block =>
        block.id === id ? { ...block, ...updates } as Block : block
      ),
    };
    setPageData(newPageData);
    // Auto-save after updating block
    setTimeout(() => {
      savePageMutation.mutate({ 
        pageData: newPageData, 
        chatbotContext 
      });
    }, 1000);
  }, [pageData, user, chatbotContext, savePageMutation]);

  const deleteBlock = useCallback((id: string) => {
    if (!pageData || !user) return;
    const newPageData = {
      ...pageData,
      blocks: pageData.blocks.filter(block => block.id !== id),
    };
    setPageData(newPageData);
    // Auto-save after deleting block
    setTimeout(() => {
      savePageMutation.mutate({ 
        pageData: newPageData, 
        chatbotContext 
      });
    }, 500);
  }, [pageData, user, chatbotContext, savePageMutation]);

  const reorderBlocks = useCallback((blocks: Block[]) => {
    if (!pageData) return;
    setPageData({
      ...pageData,
      blocks,
    });
  }, [pageData]);

  const updateTheme = useCallback((theme: Partial<PageData['theme']>) => {
    if (!pageData || !user) return;
    const newPageData = {
      ...pageData,
      theme: { ...pageData.theme, ...theme },
    };
    setPageData(newPageData);
    // Auto-save after updating theme
    setTimeout(() => {
      savePageMutation.mutate({ 
        pageData: newPageData, 
        chatbotContext 
      });
    }, 1000);
  }, [pageData, user, chatbotContext, savePageMutation]);

  const refresh = useCallback(async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ 
        queryKey: pageQueryKeys.userPage(user.id) 
      });
      await refetch();
    }
  }, [user?.id, queryClient, refetch]);

  return {
    pageData,
    chatbotContext,
    setChatbotContext,
    loading,
    saving: savePageMutation.isPending || publishPageMutation.isPending,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    updateTheme,
    refresh,
  };
}
