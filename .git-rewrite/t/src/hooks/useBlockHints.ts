import { useState, useEffect } from 'react';

const STORAGE_KEY = 'linkmax_block_hints_shown';

export function useBlockHints() {
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());
  const [activeHint, setActiveHint] = useState<{ blockType: string; blockId: string } | null>(null);

  // Загружаем из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setShownHints(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load block hints from storage:', error);
    }
  }, []);

  // Сохраняем в localStorage при изменении
  const saveToStorage = (hints: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(hints)));
    } catch (error) {
      console.error('Failed to save block hints to storage:', error);
    }
  };

  const shouldShowHint = (blockType: string): boolean => {
    return !shownHints.has(blockType);
  };

  const markHintAsShown = (blockType: string) => {
    const newShownHints = new Set(shownHints);
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
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    shouldShowHint,
    activeHint,
    showHint,
    dismissHint,
    resetAllHints,
  };
}
