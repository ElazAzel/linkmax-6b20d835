import { memo } from 'react';
import { motion } from 'framer-motion';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { cn } from '@/lib/utils/utils';
import { Block, BLOCK_SIZE_DIMENSIONS } from '@/types/page';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';

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
      {/* Profile Block (Always full width, outside grid) */}
      {profileBlock && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "out" }}
        >
          <BlockRenderer
            block={profileBlock}
            isPreview={isPreview}
            pageOwnerId={pageOwnerId}
            pageId={pageId}
            isOwnerPremium={isOwnerPremium}
            ownerTier={ownerTier}
          />
        </motion.div>
      )}

      {/* Main Grid Content */}
      {/* Main Grid Content */}
      {contentBlocks.length > 0 && (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 grid-flow-row-dense"
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
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

            // Blocks that shouldn't have the default card background/borders
            const TRANSPARENT_BLOCKS = ['separator', 'socials', 'spacer'];
            const isTransparent = TRANSPARENT_BLOCKS.includes(block.type);

            return (
              <motion.div
                key={block.id}
                className={cn(
                  'overflow-hidden flex transition-all duration-300 rounded-xl',
                  !isTransparent && 'bg-card border-0 hover:scale-[1.01]',
                  isTransparent && 'bg-transparent border-0 hover:scale-[1.01]',
                  alignmentClass,
                  colSpanClass,
                  rowSpanClass,
                  !isTransparent && 'min-h-[140px]',
                  !isTransparent && dimensions.gridRows === 2 && 'min-h-[296px]'
                )}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
                }}
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
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
});
