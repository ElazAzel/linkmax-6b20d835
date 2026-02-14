import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';
import { createBlock } from '@/lib/block-factory';
import logger from '@/lib/logger';

export type AIGeneratorType = 'magic-title' | 'sales-copy' | 'seo' | 'ai-builder';

/** AI-generated block structure before normalization */
interface AIBlockData {
  type: string;
  platforms?: AIBlockPlatform[];
  targetDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

interface AIBlockPlatform {
  name?: string;
  url?: string;
  icon?: string;
  platform?: string;
}

interface AIBuilderResult {
  profile?: {
    name: string;
    bio: string;
  };
  blocks: AIBlockData[];
}

interface UseDashboardAIOptions {
  onUpdateProfile: (updates: { name: string; bio: string }) => void;
  onAddBlock: (block: Block) => void;
  onReplaceBlocks?: (blocks: Block[]) => void;
  onQuestComplete?: (questKey: string) => void;
  onClaimAIToken?: () => Promise<boolean>;
}

/**
 * Normalizes socials block data from AI format to expected format
 */
function normalizeSocialsBlock(blockData: AIBlockData): AIBlockData {
  if (blockData.type !== 'socials' || !Array.isArray(blockData.platforms)) {
    return blockData;
  }
  
  // Normalize platforms array - AI may use 'platform' instead of 'icon'
  const normalizedPlatforms = blockData.platforms
    .filter((p): p is AIBlockPlatform => p != null && typeof p === 'object')
    .map((p) => ({
      name: p.name || p.platform || p.icon || 'Link',
      url: p.url || '',
      icon: p.icon || p.platform || 'globe',
    }));
  
  return {
    ...blockData,
    platforms: normalizedPlatforms,
  };
}

/**
 * Normalizes block data from AI to match expected structure
 */
function normalizeBlockData(blockData: AIBlockData): AIBlockData {
  // Normalize socials blocks
  if (blockData.type === 'socials') {
    return normalizeSocialsBlock(blockData);
  }
  
  // Normalize countdown blocks - AI may use 'endDate' instead of 'targetDate'
  if (blockData.type === 'countdown') {
    return {
      ...blockData,
      targetDate: blockData.targetDate || blockData.endDate,
    };
  }
  
  return blockData;
}

/**
 * Creates a proper block from AI-generated data by merging with factory defaults
 */
function createBlockFromAI(blockData: AIBlockData, index: number): Block | null {
  try {
    // Normalize block data first
    const normalizedData = normalizeBlockData(blockData);
    
    // Create base block from factory
    const baseBlock = createBlock(normalizedData.type);
    
    // Generate unique ID
    const id = `${normalizedData.type}-${Date.now()}-${index}`;
    
    // Merge AI data with base block, AI data takes precedence
    const mergedBlock = {
      ...baseBlock,
      ...normalizedData,
      id,
    };
    
    return mergedBlock as Block;
  } catch (error) {
    logger.warn(`Unknown block type from AI: ${blockData.type}`, { context: 'AI', data: error });
    return null;
  }
}

/**
 * Hook to manage AI generator state and handlers
 */
export function useDashboardAI({ onUpdateProfile, onAddBlock, onReplaceBlocks, onQuestComplete, onClaimAIToken }: UseDashboardAIOptions) {
  const { t } = useTranslation();
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiGeneratorType, setAiGeneratorType] = useState<AIGeneratorType>('ai-builder');

  const openAIBuilder = useCallback(() => {
    setAiGeneratorType('ai-builder');
    setAiGeneratorOpen(true);
  }, []);

  const openSEOGenerator = useCallback(() => {
    setAiGeneratorType('seo');
    setAiGeneratorOpen(true);
  }, []);

  const openMagicTitle = useCallback(() => {
    setAiGeneratorType('magic-title');
    setAiGeneratorOpen(true);
  }, []);

  const openSalesCopy = useCallback(() => {
    setAiGeneratorType('sales-copy');
    setAiGeneratorOpen(true);
  }, []);

  const closeAIGenerator = useCallback(() => {
    setAiGeneratorOpen(false);
  }, []);

  const handleAIResult = useCallback(
    (result: AIBuilderResult) => {
      // Mark AI as used for achievements
      localStorage.setItem('linkmax_ai_used', 'true');
      
      // Trigger use_ai quest on any AI result
      onQuestComplete?.('use_ai');
      
      // Claim token reward for using AI
      onClaimAIToken?.();
      
      if (aiGeneratorType === 'ai-builder') {
        const { profile, blocks } = result;

        // Update profile if provided
        if (profile) {
          onUpdateProfile(profile);
        }

        // Convert AI blocks to proper Block objects
        const validBlocks: Block[] = [];
        
        blocks.forEach((blockData, index) => {
          const block = createBlockFromAI(blockData, index);
          if (block) {
            validBlocks.push(block);
          }
        });

        // If we have onReplaceBlocks, use it to replace all blocks at once
        // This is better UX than adding one by one
        if (onReplaceBlocks && validBlocks.length > 0) {
          onReplaceBlocks(validBlocks);
          toast.success(t('dashboard.aiBlocksCreated', '✨ Создано {{count}} блоков с помощью AI', {
            count: validBlocks.length,
          }));
        } else {
          // Fallback: add blocks one by one
          validBlocks.forEach((block) => {
            onAddBlock(block);
          });
          toast.success(t('dashboard.blocksAdded', 'Добавлено {{count}} блоков', {
            count: validBlocks.length,
          }));
        }
      }
    },
    [aiGeneratorType, onUpdateProfile, onAddBlock, onReplaceBlocks, onQuestComplete, onClaimAIToken, t]
  );

  return {
    aiGeneratorOpen,
    aiGeneratorType,
    openAIBuilder,
    openSEOGenerator,
    openMagicTitle,
    openSalesCopy,
    closeAIGenerator,
    handleAIResult,
  };
}
