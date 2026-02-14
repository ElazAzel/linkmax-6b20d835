import { useState, useEffect } from 'react';
import type { PageData, Block } from '@/types/page';

const STORAGE_KEY = 'linkmax_page_data';
const USER_ID_KEY = 'linkmax_user_id';

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

function getInitialPageData(): PageData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored page data');
    }
  }

  return {
    id: getUserId(),
    blocks: [
      {
        id: 'profile-1',
        type: 'profile',
        name: 'Your Name',
        bio: 'Your bio goes here',
      },
    ],
    theme: {
      backgroundColor: 'hsl(var(--background))',
      textColor: 'hsl(var(--foreground))',
      buttonStyle: 'rounded',
      fontFamily: 'sans',
    },
    seo: {
      title: 'My LinkMAX Page',
      description: 'Check out my links',
      keywords: [],
    },
  };
}

export function usePageState() {
  const [pageData, setPageData] = useState<PageData>(getInitialPageData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pageData));
  }, [pageData]);

  const addBlock = (block: Block) => {
    setPageData(prev => ({
      ...prev,
      blocks: [...prev.blocks, block],
    }));
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === id ? { ...block, ...updates } as Block : block
      ),
    }));
  };

  const deleteBlock = (id: string) => {
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== id),
    }));
  };

  const reorderBlocks = (blocks: Block[]) => {
    setPageData(prev => ({
      ...prev,
      blocks,
    }));
  };

  const updateTheme = (theme: Partial<PageData['theme']>) => {
    setPageData(prev => ({
      ...prev,
      theme: { ...prev.theme, ...theme },
    }));
  };

  const updateSEO = (seo: Partial<PageData['seo']>) => {
    setPageData(prev => ({
      ...prev,
      seo: { ...prev.seo, ...seo },
    }));
  };

  return {
    pageData,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    updateTheme,
    updateSEO,
    setPageData,
  };
}
