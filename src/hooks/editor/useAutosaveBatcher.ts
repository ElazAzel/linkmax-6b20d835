/**
 * useAutosaveBatcher - Hook wrapping AutosaveBatcher for editor save flow
 * P5: Smart Autosave Batching
 */
import { useEffect, useRef, useCallback } from 'react';
import { AutosaveBatcher, type MutationType } from '@/lib/editor/autosave-batcher';

export function useAutosaveBatcher(onSave: () => Promise<void>) {
  const batcherRef = useRef<AutosaveBatcher | null>(null);

  useEffect(() => {
    batcherRef.current = new AutosaveBatcher(onSave);
    return () => {
      batcherRef.current?.destroy();
      batcherRef.current = null;
    };
  }, [onSave]);

  const enqueue = useCallback((type: MutationType) => {
    batcherRef.current?.enqueue(type);
  }, []);

  const flush = useCallback(async () => {
    await batcherRef.current?.flush();
  }, []);

  const hasPending = useCallback(() => {
    return batcherRef.current?.hasPending ?? false;
  }, []);

  return { enqueue, flush, hasPending };
}
