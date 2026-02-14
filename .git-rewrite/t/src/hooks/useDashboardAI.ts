import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Block } from '@/types/page';
import { createBlock } from '@/lib/block-factory';

export type AIGeneratorType = 'magic-title' | 'sales-copy' | 'seo' | 'ai-builder';

interface AIBuilderResult {
  profile?: {
    name: string;
    bio: string;
  };
  blocks: Array<{
    type: string;
    [key: string]: any;
  }>;
}

interface UseDashboardAIOptions {
  onUpdateProfile: (updates: { name: string; bio: string }) => void;
  onAddBlock: (block: Block) => void;
  onReplaceBlocks?: (blocks: Block[]) => void;
  onQuestComplete?: (questKey: string) => void;
}

/**
 * Normalizes socials block data from AI format to expected format
 */
function normalizeSocialsBlock(blockData: Record<string, any>): Record<string, any> {
  if (blockData.type !== 'socials' || !Array.isArray(blockData.platforms)) {
    return blockData;
  }
  
  // Normalize platforms array - AI may use 'platform' instead of 'icon'
  const normalizedPlatforms = blockData.platforms
    .filter((p: any) => p && typeof p === 'object')
    .map((p: any) => ({
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
 * Normalizes any block data from AI to match expected structure
 */
function normalizeBlockData(blockData: Record<string, any>): Record<string, any> {
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
function createBlockFromAI(blockData: { type: string; [key: string]: any }, index: number): Block | null {
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
    console.warn(`Unknown block type from AI: ${blockData.type}`, error);
    return null;
  }
}

/**
 * Hook to manage AI generator state and handlers
 */
export function useDashboardAI({ onUpdateProfile, onAddBlock, onReplaceBlocks, onQuestComplete }: UseDashboardAIOptions) {
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
          toast.success(`✨ Создано ${validBlocks.length} блоков с помощью AI`);
        } else {
          // Fallback: add blocks one by one
          validBlocks.forEach((block) => {
            onAddBlock(block);
          });
          toast.success(`Добавлено ${validBlocks.length} блоков`);
        }
      }
    },
    [aiGeneratorType, onUpdateProfile, onAddBlock, onReplaceBlocks, onQuestComplete]
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
