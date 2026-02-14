import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useUserPage, useSavePageMutation, usePublishPageMutation, pageQueryKeys } from '@/hooks/usePageCache';
import { updatePageNiche } from '@/services/pages';
import type { PageData, Block, EditorMode } from '@/types/page';
import type { Niche } from '@/lib/niches';
import { toast } from 'sonner';
import type { SaveStatus } from '@/components/editor/AutoSaveIndicator';

export function useCloudPageState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [chatbotContext, setChatbotContext] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const autoSaveAndPublish = useCallback((data: PageData, context: string) => {
    if (!user) return;
    
    // Set pending status immediately
    setSaveStatus('pending');
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Debounce auto-save and publish with longer delay for stability
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        
        // Save first with retry logic
        let retries = 2;
        let lastError: any = null;
        
        while (retries > 0) {
          try {
            await savePageMutation.mutateAsync({ 
              pageData: data, 
              chatbotContext: context 
            });
            break;
          } catch (err) {
            lastError = err;
            retries--;
            if (retries > 0) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
        }
        
        if (retries === 0 && lastError) {
          throw lastError;
        }
        
        // Then auto-publish
        await publishPageMutation.mutateAsync();
        
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save/publish error:', error);
        setSaveStatus('error');
        // Reset to idle after error display
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 2000);
  }, [user, savePageMutation, publishPageMutation]);

  const save = useCallback(async () => {
    if (!user || !pageData) return;
    
    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    try {
      setSaveStatus('saving');
      await savePageMutation.mutateAsync({ 
        pageData, 
        chatbotContext 
      });
      await publishPageMutation.mutateAsync();
      setSaveStatus('saved');
      toast.success('Changes saved and published!');
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [user, pageData, chatbotContext, savePageMutation, publishPageMutation]);

  const publish = useCallback(async () => {
    if (!user || !pageData) return null;
    
    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    try {
      setSaveStatus('saving');
      await savePageMutation.mutateAsync({ 
        pageData, 
        chatbotContext 
      });
      const slug = await publishPageMutation.mutateAsync();
      setSaveStatus('saved');
      return slug;
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [user, pageData, chatbotContext, savePageMutation, publishPageMutation]);

  const addBlock = useCallback((block: Block, position?: number) => {
    if (!pageData) return;
    
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
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    if (!pageData) return;
    const newPageData = {
      ...pageData,
      blocks: pageData.blocks.map(block =>
        block.id === id ? { ...block, ...updates } as Block : block
      ),
    };
    setPageData(newPageData);
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const deleteBlock = useCallback((id: string) => {
    if (!pageData) return;
    const newPageData = {
      ...pageData,
      blocks: pageData.blocks.filter(block => block.id !== id),
    };
    setPageData(newPageData);
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const reorderBlocks = useCallback((blocks: Block[]) => {
    if (!pageData) return;
    const newPageData = {
      ...pageData,
      blocks,
    };
    setPageData(newPageData);
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateTheme = useCallback((theme: Partial<PageData['theme']>) => {
    if (!pageData) return;
    const newPageData = {
      ...pageData,
      theme: { ...pageData.theme, ...theme },
    };
    setPageData(newPageData);
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateEditorMode = useCallback((newMode: EditorMode, newBlocks?: Block[]) => {
    if (!pageData) return;
    const newPageData: PageData = {
      ...pageData,
      editorMode: newMode,
      blocks: newBlocks || pageData.blocks,
    };
    setPageData(newPageData);
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updatePageDataPartial = useCallback((updates: Partial<PageData>) => {
    if (!pageData) return;
    const newPageData: PageData = {
      ...pageData,
      ...updates,
    };
    setPageData(newPageData);
    
    // Auto-save and publish
    autoSaveAndPublish(newPageData, chatbotContext);
  }, [pageData, chatbotContext, autoSaveAndPublish]);

  const updateNiche = useCallback(async (niche: Niche) => {
    if (!user || !pageData) return;
    
    // Update local state immediately
    const newPageData = { ...pageData, niche };
    setPageData(newPageData);
    
    // Save to database
    const { error } = await updatePageNiche(user.id, niche);
    if (error) {
      toast.error('Failed to update category');
      // Revert on error
      setPageData(pageData);
    }
  }, [user, pageData]);

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
    saveStatus,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    updateTheme,
    updateEditorMode,
    updatePageDataPartial,
    updateNiche,
    refresh,
  };
}
