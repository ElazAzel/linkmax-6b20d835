import { memo } from 'react';
import { BlockRenderer } from '@/components/BlockRenderer';
import { cn } from '@/lib/utils';
import { createRowKey } from '@/lib/block-utils';
import type { Block, BlockSizePreset } from '@/types/page';
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

// Check if block is full width (with fallback for legacy sizes)
function isFullWidthBlock(blockSize?: BlockSizePreset): boolean {
  if (!blockSize) return true; // Default to full width
  
  // Handle legacy sizes - convert to new format
  if (blockSize.startsWith('full')) return true;
  if (blockSize.startsWith('half')) return false;
  
  return true; // Default fallback
}

// Organize blocks into rows based on their size (max 2 per row)
interface BlockRow {
  blocks: Block[];
  hasEmptySlot: boolean;
}

function organizeBlocksIntoRows(blocks: Block[]): BlockRow[] {
  const rows: BlockRow[] = [];
  let currentRow: Block[] = [];
  let currentRowCols = 0;

  for (const block of blocks) {
    // Profile blocks are always rendered separately
    if (block.type === 'profile') {
      if (currentRow.length > 0) {
        rows.push({ blocks: currentRow, hasEmptySlot: currentRowCols === 1 });
        currentRow = [];
        currentRowCols = 0;
      }
      rows.push({ blocks: [block], hasEmptySlot: false });
      continue;
    }

    const isFullWidth = isFullWidthBlock(block.blockSize);
    const blockCols = isFullWidth ? 2 : 1;

    // If this block would overflow, start a new row
    if (currentRowCols + blockCols > 2) {
      if (currentRow.length > 0) {
        rows.push({ blocks: currentRow, hasEmptySlot: currentRowCols === 1 });
      }
      currentRow = [block];
      currentRowCols = blockCols;
    } else {
      currentRow.push(block);
      currentRowCols += blockCols;
    }

    // If row is full, push it
    if (currentRowCols === 2) {
      rows.push({ blocks: currentRow, hasEmptySlot: false });
      currentRow = [];
      currentRowCols = 0;
    }
  }

  // Push remaining blocks
  if (currentRow.length > 0) {
    rows.push({ blocks: currentRow, hasEmptySlot: currentRowCols === 1 });
  }

  return rows;
}

/**
 * Renders blocks in a responsive 2-column grid layout.
 * Used in both editor preview and public page for consistent layout.
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
  const rows = organizeBlocksIntoRows(blocks);

  return (
    <div className={cn('space-y-3', className)}>
      {rows.map((row) => {
        // Use stable key based on block IDs in row
        const rowKey = createRowKey(row.blocks);
        
        // Check if this is a profile row (single profile block)
        const isProfileRow = row.blocks.length === 1 && row.blocks[0].type === 'profile';
        
        if (isProfileRow) {
          return (
            <div key={rowKey} className="w-full">
              <BlockRenderer 
                block={row.blocks[0]} 
                isPreview={isPreview}
                pageOwnerId={pageOwnerId}
                pageId={pageId}
                isOwnerPremium={isOwnerPremium}
                ownerTier={ownerTier}
              />
            </div>
          );
        }

        return (
          <div key={rowKey} className="grid grid-cols-2 gap-3">
            {row.blocks.map((block) => {
              const isFullWidth = isFullWidthBlock(block.blockSize);
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
                    'rounded-xl overflow-hidden flex',
                    alignmentClass,
                    isFullWidth ? 'col-span-2' : 'col-span-1'
                  )}
                >
                  <div className="w-full">
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
        );
      })}
    </div>
  );
});
