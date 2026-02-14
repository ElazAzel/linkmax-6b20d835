import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';


const STORAGE_KEY = 'block_hints_shown';

export function useBlockHints() {
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());
  const [activeHint, setActiveHint] = useState<{ blockType: string; blockId: string } | null>(null);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = storage.get<string[]>(STORAGE_KEY);
      if (stored) {
        setShownHints(new Set(stored));
      }
    } catch (error) {
      logger.error('Failed to load block hints from storage:', error, { context: 'useBlockHints' });
    }
  }, []);

  // Save to storage on change
  const saveToStorage = (hints: Set<string>) => {
    try {
      storage.set(STORAGE_KEY, Array.from(hints));
    } catch (error) {
      logger.error('Failed to save block hints to storage:', error, { context: 'useBlockHints' });
    }
  };

  const shouldShowHint = (blockType: string): boolean => {
    return !shownHints.has(blockType);
  };

  const markHintAsShown = (blockType: string) => {
    const newShownHints = new Set<string>(shownHints);
    newShownHints.add(blockType);
    setShownHints(newShownHints);
    saveToStorage(newShownHints);
  };

  const showHint = (blockType: string, blockId: string) => {
    if (shouldShowHint(blockType)) {
      setActiveHint({ blockType, blockId });
    }
  };

  const dismissHint = () => {
    if (activeHint) {
      markHintAsShown(activeHint.blockType);
      setActiveHint(null);
    }
  };

  const resetAllHints = () => {
    setShownHints(new Set());
    storage.remove(STORAGE_KEY);
  };

  return {
    shouldShowHint,
    activeHint,
    showHint,
    dismissHint,
    resetAllHints,
  };
}
