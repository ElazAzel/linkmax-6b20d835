import { memo } from 'react';
import { BlockRenderer } from '@/components/BlockRenderer';
import { cn } from '@/lib/utils';
import { Block, BLOCK_SIZE_DIMENSIONS } from '@/types/page';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

interface GridBlocksRendererProps {
  blocks: Block[];
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
  isPreview?: boolean;
  className?: string;
}

/**
 * Renders blocks in a responsive 2-column grid layout.
 * Used in both editor preview and public page for consistent layout.
 * Matches GridEditor.tsx behavior using grid-flow-row-dense.
 */
export const GridBlocksRenderer = memo(function GridBlocksRenderer({
  blocks,
  pageOwnerId,
  pageId,
  isOwnerPremium,
  ownerTier,
  isPreview = false,
  className,
}: GridBlocksRendererProps) {
  // Guard against undefined/null blocks
  const validBlocks = (blocks || []).filter((b): b is Block => b != null && typeof b === 'object' && 'type' in b);

  const profileBlock = validBlocks.find(b => b.type === 'profile');
  const contentBlocks = validBlocks.filter(b => b.type !== 'profile');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Profile Block (Always full width, outside grid) */}
      {profileBlock && (
        <div className="w-full">
          <BlockRenderer
            block={profileBlock}
            isPreview={isPreview}
            pageOwnerId={pageOwnerId}
            pageId={pageId}
            isOwnerPremium={isOwnerPremium}
            ownerTier={ownerTier}
          />
        </div>
      )}

      {/* Main Grid Content */}
      {contentBlocks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 grid-flow-row-dense">
          {contentBlocks.map((block) => {
            // Determine grid span based on block size
            const blockSize = block.blockSize || 'small';
            // Use type assertion or direct import if simple import fails, but BLOCK_SIZE_DIMENSIONS should be available
            // Fallback to small if not found
            const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];

            // Map dimensions to Tailwind classes
            const colSpanClass = dimensions.gridCols === 2 ? 'col-span-2' : 'col-span-1';
            const rowSpanClass = dimensions.gridRows === 2 ? 'row-span-2' : 'row-span-1';

            const contentAlignment = block.blockStyle?.contentAlignment || 'center';
            const alignmentClass = contentAlignment === 'top'
              ? 'items-start'
              : contentAlignment === 'bottom'
                ? 'items-end'
                : 'items-center';

            return (
              <div
                key={block.id}
                className={cn(
                  'rounded-xl overflow-hidden flex bg-card border border-border/50 shadow-sm transition-all',
                  alignmentClass,
                  colSpanClass,
                  rowSpanClass,
                  // Min height handling to match editor
                  'min-h-[140px]',
                  dimensions.gridRows === 2 && 'min-h-[296px]' // 140*2 + 16gap (approx)
                )}
              >
                <div className="w-full h-full">
                  <BlockRenderer
                    block={block}
                    isPreview={isPreview}
                    pageOwnerId={pageOwnerId}
                    pageId={pageId}
                    isOwnerPremium={isOwnerPremium}
                    ownerTier={ownerTier}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
