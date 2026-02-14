import { useState, useCallback, useRef } from 'react';
import type { GridLayoutData } from '@/types/page';

interface DragState {
  blockId: string | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's' | null;
}

interface UseGridDragDropOptions {
  columns: number;
  cellWidth: number;
  cellHeight: number;
  gapSize: number;
  onMove: (blockId: string, newLayout: GridLayoutData) => void;
  onResize: (blockId: string, newLayout: GridLayoutData) => void;
  isPositionValid: (blockId: string, position: {
    column: number;
    row: number;
    width: number;
    height: number;
  }) => boolean;
}

/**
 * Hook for handling drag-and-drop in grid mode
 */
export function useGridDragDrop({
  columns,
  cellWidth,
  cellHeight,
  gapSize,
  onMove,
  onResize,
  isPositionValid,
}: UseGridDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    blockId: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
  });
  
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  const [isValidDrop, setIsValidDrop] = useState(true);
  const originalLayoutRef = useRef<GridLayoutData | null>(null);

  // Convert pixel coordinates to grid cell
  const pixelToCell = useCallback((x: number, y: number): { col: number; row: number } => {
    const cellWithGap = cellWidth + gapSize;
    const rowWithGap = cellHeight + gapSize;
    
    return {
      col: Math.max(1, Math.min(columns, Math.floor(x / cellWithGap) + 1)),
      row: Math.max(1, Math.floor(y / rowWithGap) + 1),
    };
  }, [cellWidth, cellHeight, gapSize, columns]);

  // Start dragging a block
  const onDragStart = useCallback((
    blockId: string,
    event: React.MouseEvent | React.TouchEvent,
    currentLayout: GridLayoutData
  ) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    originalLayoutRef.current = currentLayout;
    
    setDragState({
      blockId,
      startPosition: { x: clientX, y: clientY },
      currentPosition: { x: clientX, y: clientY },
      isDragging: true,
      isResizing: false,
      resizeHandle: null,
    });
  }, []);

  // Handle drag movement
  const onDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.blockId) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    setDragState(prev => ({
      ...prev,
      currentPosition: { x: clientX, y: clientY },
    }));
    
    // Calculate target cell from the relative position
    const gridElement = document.querySelector('[data-grid-container]');
    if (!gridElement) return;
    
    const rect = gridElement.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    const cell = pixelToCell(relativeX, relativeY);
    setHoveredCell(cell);
    
    // Check if the new position is valid
    const original = originalLayoutRef.current;
    if (original) {
      const valid = isPositionValid(dragState.blockId, {
        column: cell.col,
        row: cell.row,
        width: original.gridWidth || 1,
        height: original.gridHeight || 1,
      });
      setIsValidDrop(valid);
    }
  }, [dragState, pixelToCell, isPositionValid]);

  // End dragging
  const onDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.blockId || !hoveredCell) {
      setDragState({
        blockId: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
      });
      setHoveredCell(null);
      return;
    }
    
    const original = originalLayoutRef.current;
    if (original && isValidDrop) {
      onMove(dragState.blockId, {
        ...original,
        gridColumn: hoveredCell.col,
        gridRow: hoveredCell.row,
      });
    }
    
    setDragState({
      blockId: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
    });
    setHoveredCell(null);
    originalLayoutRef.current = null;
  }, [dragState, hoveredCell, isValidDrop, onMove]);

  // Start resizing a block
  const onResizeStart = useCallback((
    blockId: string,
    handle: DragState['resizeHandle'],
    event: React.MouseEvent | React.TouchEvent,
    currentLayout: GridLayoutData
  ) => {
    event.stopPropagation();
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    originalLayoutRef.current = currentLayout;
    
    setDragState({
      blockId,
      startPosition: { x: clientX, y: clientY },
      currentPosition: { x: clientX, y: clientY },
      isDragging: false,
      isResizing: true,
      resizeHandle: handle,
    });
  }, []);

  // Handle resize movement
  const onResizeMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isResizing || !dragState.blockId || !dragState.resizeHandle) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const deltaX = clientX - dragState.startPosition.x;
    const deltaY = clientY - dragState.startPosition.y;
    
    const cellWithGap = cellWidth + gapSize;
    const rowWithGap = cellHeight + gapSize;
    
    const deltaCols = Math.round(deltaX / cellWithGap);
    const deltaRows = Math.round(deltaY / rowWithGap);
    
    const original = originalLayoutRef.current;
    if (!original) return;
    
    let newWidth = original.gridWidth || 1;
    let newHeight = original.gridHeight || 1;
    
    const handle = dragState.resizeHandle;
    
    // Calculate new dimensions based on handle
    if (handle.includes('e')) {
      newWidth = Math.max(1, Math.min(4, (original.gridWidth || 1) + deltaCols));
    }
    if (handle.includes('w')) {
      newWidth = Math.max(1, Math.min(4, (original.gridWidth || 1) - deltaCols));
    }
    if (handle.includes('s')) {
      newHeight = Math.max(1, Math.min(4, (original.gridHeight || 1) + deltaRows));
    }
    if (handle.includes('n')) {
      newHeight = Math.max(1, Math.min(4, (original.gridHeight || 1) - deltaRows));
    }
    
    // Check if new size is valid
    const valid = isPositionValid(dragState.blockId, {
      column: original.gridColumn || 1,
      row: original.gridRow || 1,
      width: newWidth,
      height: newHeight,
    });
    setIsValidDrop(valid);
    
    setDragState(prev => ({
      ...prev,
      currentPosition: { x: clientX, y: clientY },
    }));
  }, [dragState, cellWidth, cellHeight, gapSize, isPositionValid]);

  // End resizing
  const onResizeEnd = useCallback(() => {
    if (!dragState.isResizing || !dragState.blockId) {
      setDragState({
        blockId: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
      });
      return;
    }
    
    const deltaX = dragState.currentPosition.x - dragState.startPosition.x;
    const deltaY = dragState.currentPosition.y - dragState.startPosition.y;
    
    const cellWithGap = cellWidth + gapSize;
    const rowWithGap = cellHeight + gapSize;
    
    const deltaCols = Math.round(deltaX / cellWithGap);
    const deltaRows = Math.round(deltaY / rowWithGap);
    
    const original = originalLayoutRef.current;
    if (!original) return;
    
    let newWidth = original.gridWidth || 1;
    let newHeight = original.gridHeight || 1;
    
    const handle = dragState.resizeHandle;
    
    if (handle?.includes('e')) {
      newWidth = Math.max(1, Math.min(4, (original.gridWidth || 1) + deltaCols));
    }
    if (handle?.includes('s')) {
      newHeight = Math.max(1, Math.min(4, (original.gridHeight || 1) + deltaRows));
    }
    
    if (isValidDrop) {
      onResize(dragState.blockId, {
        ...original,
        gridWidth: newWidth,
        gridHeight: newHeight,
      });
    }
    
    setDragState({
      blockId: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
    });
    originalLayoutRef.current = null;
  }, [dragState, cellWidth, cellHeight, gapSize, isValidDrop, onResize]);

  return {
    dragState,
    hoveredCell,
    isValidDrop,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
  };
}
