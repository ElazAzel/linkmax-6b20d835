import { useMemo, useCallback } from 'react';
import type { Block, GridLayoutData, GridConfig } from '@/types/page';

// Default grid configuration
export const DEFAULT_GRID_CONFIG: GridConfig = {
  columnsDesktop: 4,
  columnsMobile: 2,
  gapSize: 16,
  cellHeight: 120,
};

interface GridPosition {
  column: number;
  row: number;
  width: number;
  height: number;
}

interface UseGridLayoutOptions {
  blocks: Block[];
  config?: GridConfig;
  columns: number;
}

/**
 * Hook for managing grid layout logic
 */
export function useGridLayout({ blocks, config = DEFAULT_GRID_CONFIG, columns }: UseGridLayoutOptions) {
  // Calculate grid positions for all blocks
  const gridPositions = useMemo(() => {
    const positions = new Map<string, GridPosition>();
    
    blocks.forEach((block, index) => {
      const layout = block.gridLayout;
      
      if (layout?.gridColumn && layout?.gridRow) {
        // Use existing grid position
        positions.set(block.id, {
          column: Math.min(layout.gridColumn, columns),
          row: layout.gridRow,
          width: Math.min(layout.gridWidth || 1, columns),
          height: layout.gridHeight || 1,
        });
      } else {
        // Auto-position based on index
        const col = (index % columns) + 1;
        const row = Math.floor(index / columns) + 1;
        positions.set(block.id, {
          column: col,
          row: row,
          width: 1,
          height: 1,
        });
      }
    });
    
    return positions;
  }, [blocks, columns]);

  // Check if two blocks collide
  const isColliding = useCallback((pos1: GridPosition, pos2: GridPosition): boolean => {
    const left1 = pos1.column;
    const right1 = pos1.column + pos1.width;
    const top1 = pos1.row;
    const bottom1 = pos1.row + pos1.height;
    
    const left2 = pos2.column;
    const right2 = pos2.column + pos2.width;
    const top2 = pos2.row;
    const bottom2 = pos2.row + pos2.height;
    
    return !(right1 <= left2 || left1 >= right2 || bottom1 <= top2 || top1 >= bottom2);
  }, []);

  // Check if a position is valid (no collisions with other blocks)
  const isPositionValid = useCallback((blockId: string, newPos: GridPosition): boolean => {
    // Check bounds
    if (newPos.column < 1 || newPos.column + newPos.width - 1 > columns) return false;
    if (newPos.row < 1) return false;
    if (newPos.width < 1 || newPos.width > 4) return false;
    if (newPos.height < 1 || newPos.height > 4) return false;
    
    // Check collisions with other blocks
    for (const [id, pos] of gridPositions) {
      if (id !== blockId && isColliding(newPos, pos)) {
        return false;
      }
    }
    
    return true;
  }, [gridPositions, columns, isColliding]);

  // Find a free position for a new block
  const findFreePosition = useCallback((width: number = 1, height: number = 1): GridPosition | null => {
    const maxRow = Math.max(...Array.from(gridPositions.values()).map(p => p.row + p.height), 1);
    
    // Try to find a free spot
    for (let row = 1; row <= maxRow + 5; row++) {
      for (let col = 1; col <= columns - width + 1; col++) {
        const testPos = { column: col, row, width, height };
        let hasCollision = false;
        
        for (const pos of gridPositions.values()) {
          if (isColliding(testPos, pos)) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) {
          return testPos;
        }
      }
    }
    
    return null;
  }, [gridPositions, columns, isColliding]);

  // Calculate the total rows needed for the grid
  const totalRows = useMemo(() => {
    let maxRow = 1;
    for (const pos of gridPositions.values()) {
      maxRow = Math.max(maxRow, pos.row + pos.height - 1);
    }
    return maxRow;
  }, [gridPositions]);

  // Get CSS grid styles for a block
  const getBlockStyle = useCallback((blockId: string): React.CSSProperties => {
    const pos = gridPositions.get(blockId);
    if (!pos) return {};
    
    return {
      gridColumn: `${pos.column} / span ${pos.width}`,
      gridRow: `${pos.row} / span ${pos.height}`,
    };
  }, [gridPositions]);

  // Convert grid positions to layout data for saving
  const getLayoutData = useCallback((blockId: string): GridLayoutData | undefined => {
    const pos = gridPositions.get(blockId);
    if (!pos) return undefined;
    
    return {
      gridColumn: pos.column,
      gridRow: pos.row,
      gridWidth: pos.width,
      gridHeight: pos.height,
    };
  }, [gridPositions]);

  return {
    gridPositions,
    isPositionValid,
    findFreePosition,
    totalRows,
    getBlockStyle,
    getLayoutData,
    config,
  };
}
