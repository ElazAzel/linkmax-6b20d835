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

  // Block types that render as ambient layers (no card chrome)
  const TRANSPARENT_BLOCKS = new Set(['separator', 'socials', 'spacer']);
  // Block types that naturally need full width when size isn't explicitly set
  const NATURALLY_WIDE = new Set([
    'profile', 'heading', 'text', 'video', 'embed', 'faq',
    'testimonials', 'reviews', 'form', 'newsletter', 'contacts',
    'services', 'service', 'events', 'event', 'gallery', 'carousel',
    'pricing', 'map', 'countdown', 'cta', 'share',
  ]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Block — always full bleed */}
      {profileBlock && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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

      {/* Bento grid */}
      {contentBlocks.length > 0 && (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 grid-flow-row-dense auto-rows-[minmax(0,auto)]"
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0.04 },
            },
          }}
        >
          {contentBlocks.map((block) => {
            // Resolve span: explicit blockSize wins; otherwise infer from block type
            const explicitSize = block.blockSize;
            const dimensions = explicitSize
              ? BLOCK_SIZE_DIMENSIONS[explicitSize] || BLOCK_SIZE_DIMENSIONS['small']
              : NATURALLY_WIDE.has(block.type)
                ? BLOCK_SIZE_DIMENSIONS['wide']
                : BLOCK_SIZE_DIMENSIONS['small'];

            const colSpanClass = dimensions.gridCols === 2 ? 'col-span-2' : 'col-span-1';
            const rowSpanClass = dimensions.gridRows === 2 ? 'row-span-2' : 'row-span-1';

            const contentAlignment = block.blockStyle?.contentAlignment || 'center';
            const alignmentClass =
              contentAlignment === 'top' ? 'items-start'
                : contentAlignment === 'bottom' ? 'items-end'
                  : 'items-center';

            const isTransparent = TRANSPARENT_BLOCKS.has(block.type);
            const isSquare = dimensions.gridCols === 1 && dimensions.gridRows === 1;
            const isTall = dimensions.gridCols === 1 && dimensions.gridRows === 2;

            return (
              <motion.div
                key={block.id}
                className={cn(
                  'group relative flex overflow-hidden',
                  alignmentClass,
                  colSpanClass,
                  rowSpanClass,
                  // Unified BlockShell via Quiet Bento tokens
                  !isTransparent && 'qb-card qb-card-hover',
                  isTransparent && 'bg-transparent',
                  // Square tiles get an aspect lock so they feel intentional in bento rhythm
                  !isTransparent && isSquare && 'aspect-square',
                  !isTransparent && isTall && 'min-h-[280px]',
                  !isTransparent && !isSquare && !isTall && 'min-h-[120px]',
                )}
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.99 },
                  show: {
                    opacity: 1, y: 0, scale: 1,
                    transition: { type: 'spring', stiffness: 260, damping: 26 },
                  },
                }}
              >
                {/* Ambient hover sheen */}
                {!isTransparent && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(120%_80%_at_0%_0%,hsl(var(--primary)/0.05),transparent_60%)]"
                  />
                )}
                <div className="relative w-full h-full">
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
