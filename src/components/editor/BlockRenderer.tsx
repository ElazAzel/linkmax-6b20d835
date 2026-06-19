import { Suspense, useCallback, useMemo, useEffect } from 'react';
import type { Block } from '@/types/page';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { getBlockStyles } from '@/lib/blocks/block-styling';
import { cn } from '@/lib/utils/utils';
import { useAnalytics } from '@/hooks/analytics/useAnalyticsTracking';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { useTranslation } from 'react-i18next';
import { PaidBlockWrapper } from '@/components/blocks/PaidBlockWrapper';
import { BlockErrorBoundary } from '@/components/editor/BlockErrorBoundary';
import { BLOCK_MANIFEST } from '@/lib/blocks/block-manifest';
import type { BlockType } from '@/types/blocks/base';
import { useRenderContext } from '@/contexts/RenderContext';

// Helper function to check if block should be visible based on schedule
function isBlockVisible(block: Block): boolean {
  if (!block.schedule) return true;
  const now = new Date();
  const { startDate, endDate } = block.schedule;
  if (startDate && now < new Date(startDate)) return false;
  if (endDate && now > new Date(endDate)) return false;
  return true;
}

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
}

const BlockSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-24 w-full rounded-lg" />
  </div>
);

/**
 * Get block title for analytics - type-safe extraction
 */
function getBlockTitle(block: Block, lang: SupportedLanguage): string {
  if (!block || typeof block !== 'object' || !('type' in block)) return 'unknown';

  let rawTitle: string | { ru?: string; en?: string; kk?: string } | undefined;

  switch (block.type) {
    case 'profile':
    case 'product':
    case 'avatar':
      rawTitle = (block as any)?.name;
      break;
    case 'text':
      rawTitle = (block as any)?.content;
      break;
    case 'shoutout':
      rawTitle = (block as any)?.displayName || (block as any)?.username;
      break;
    case 'image':
      rawTitle = (block as any)?.alt;
      break;
    case 'map':
      rawTitle = (block as any)?.address;
      break;
    case 'separator':
      rawTitle = 'separator';
      break;
    default:
      rawTitle = (block as any)?.title;
      break;
  }

  if (!rawTitle) return block.type;
  return typeof rawTitle === 'object' ? getI18nText(rawTitle, lang) : String(rawTitle);
}

export function BlockRenderer({ block, isPreview, pageOwnerId, pageId, isOwnerPremium, ownerTier }: BlockRendererProps) {
  const renderContext = useRenderContext();
  const isEditorMode = renderContext === 'editor';
  const { onBlockClick, onBlockView } = useAnalytics();
  const { i18n } = useTranslation();

  // Track impression on mount (only for public pages).
  // Previously this only fired for experiment blocks, which made regular
  // block-level analytics (views/CTR) nearly empty.
  useEffect(() => {
    const isTrackable = BLOCK_MANIFEST[block.type as BlockType]?.renderMode === 'trackable';
    if (!isPreview && !isEditorMode && isTrackable) {
      const title = getBlockTitle(block, i18n.language as SupportedLanguage);
      onBlockView(block.id, block.type, title, block.experimentId, block.variantLabel);
    }
  }, [block.id, block.type, block.experimentId, block.variantLabel, isPreview, isEditorMode, onBlockView, i18n.language]);

  const handleClick = useCallback(() => {
    if (!isPreview) {
      const title = getBlockTitle(block, i18n.language as SupportedLanguage);
      onBlockClick(block.id, block.type, title, block.experimentId, block.variantLabel);
    }
  }, [block, isPreview, onBlockClick, i18n.language]);

  if (!isPreview && !isBlockVisible(block)) {
    return null;
  }

  const manifest = BLOCK_MANIFEST[block.type as BlockType];
  if (!manifest) return null;

  const animationClass = getAnimationClass(block.blockStyle);
  const animationStyle = getAnimationStyle(block.blockStyle);
  const { style: bsStyle, className: bsClass } = getBlockStyles(block.blockStyle);
  const wrapperStyle = { ...animationStyle, ...bsStyle };
  const wrapperClass = cn(animationClass, bsClass);
  const RendererComponent = manifest.renderer;

  // Build props for the renderer
  const rendererProps: Record<string, any> = {
    block,
    isPreview,
    pageOwnerId,
    pageId,
    isOwnerPremium,
    ownerTier,
  };

  // Map rendererPropsKeys to actual handlers
  if (manifest.rendererPropsKeys) {
    for (const key of manifest.rendererPropsKeys) {
      if (key === 'onClick' || key === 'onPlatformClick') {
        rendererProps[key] = handleClick;
      }
    }
  }

  const inner = (
    <Suspense fallback={<BlockSkeleton />}>
      <RendererComponent {...rendererProps} />
    </Suspense>
  );

  if (manifest.renderMode === 'trackable') {
    return (
      <PaidBlockWrapper
        blockId={block.id}
        blockStyle={block.blockStyle}
        pageOwnerId={pageOwnerId}
        isPreview={isPreview}
      >
        <div className={animationClass} style={animationStyle} data-testid="block-renderer-wrapper">
          <BlockErrorBoundary>
            {inner}
          </BlockErrorBoundary>
        </div>
      </PaidBlockWrapper>
    );
  }

  // Simple render mode
  return (
    <BlockErrorBoundary>
      <div className={animationClass} style={animationStyle} data-testid="block-renderer-wrapper">
        {inner}
      </div>
    </BlockErrorBoundary>
  );
}
