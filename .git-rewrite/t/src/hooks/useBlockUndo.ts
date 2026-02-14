import { useState, useCallback, useRef } from 'react';
import type { Block } from '@/types/page';

interface DeletedBlock {
  block: Block;
  position: number;
  timestamp: number;
}

const UNDO_TIMEOUT = 5000; // 5 seconds to undo

export function useBlockUndo() {
  const [deletedBlocks, setDeletedBlocks] = useState<DeletedBlock[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addToUndo = useCallback((block: Block, position: number) => {
    const deletedBlock: DeletedBlock = {
      block,
      position,
      timestamp: Date.now(),
    };

    setDeletedBlocks(prev => [...prev, deletedBlock]);

    // Auto-remove after timeout
    const timeoutId = setTimeout(() => {
      setDeletedBlocks(prev => prev.filter(db => db.block.id !== block.id));
      timeoutRefs.current.delete(block.id);
    }, UNDO_TIMEOUT);

    timeoutRefs.current.set(block.id, timeoutId);
  }, []);

  const undo = useCallback((blockId: string): DeletedBlock | null => {
    const deletedBlock = deletedBlocks.find(db => db.block.id === blockId);
    
    if (!deletedBlock) return null;

    // Clear timeout
    const timeoutId = timeoutRefs.current.get(blockId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(blockId);
    }

    // Remove from deleted blocks
    setDeletedBlocks(prev => prev.filter(db => db.block.id !== blockId));

    return deletedBlock;
  }, [deletedBlocks]);

  const getLatestDeleted = useCallback((): DeletedBlock | null => {
    if (deletedBlocks.length === 0) return null;
    return deletedBlocks[deletedBlocks.length - 1];
  }, [deletedBlocks]);

  const clearUndo = useCallback((blockId: string) => {
    const timeoutId = timeoutRefs.current.get(blockId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(blockId);
    }
    setDeletedBlocks(prev => prev.filter(db => db.block.id !== blockId));
  }, []);

  const clearAll = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setDeletedBlocks([]);
  }, []);

  return {
    deletedBlocks,
    addToUndo,
    undo,
    getLatestDeleted,
    clearUndo,
    clearAll,
    hasUndo: deletedBlocks.length > 0,
  };
}
