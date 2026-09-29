import { useCallback, useEffect, useRef, useState } from 'react';

import { buildRevertPatch, mergeBlockDraft } from '@/lib/editor/block-draft';
import type { Block } from '@/types/page';

/**
 * Draft for the block inspector. Every change is applied to the page (and so
 * to the canvas) shortly after it happens, instead of after a 2 s autosave or
 * on "Save". A snapshot taken when the block is opened lets the owner discard
 * everything they changed in this session.
 */
export function useLiveBlockDraft(
  block: Block | null,
  onCommit: (id: string, updates: Partial<Block>) => void,
  delayMs = 150,
) {
  const [draft, setDraft] = useState<Partial<Block>>(() => (block ? { ...block } : {}));
  const [dirty, setDirty] = useState(false);
  const draftRef = useRef<Partial<Block>>(block ? { ...block } : {});
  const snapshotRef = useRef<Partial<Block>>(block ? { ...block } : {});
  const blockIdRef = useRef<string | null>(block?.id ?? null);
  const pendingRef = useRef<Partial<Block> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    const id = blockIdRef.current;
    pendingRef.current = null;
    if (pending && id) commitRef.current(id, pending);
  }, []);

  // A different block opened: finish the previous one, start a new session.
  useEffect(() => {
    const nextId = block?.id ?? null;
    if (nextId === blockIdRef.current) return;
    flush();
    const next = block ? { ...block } : {};
    blockIdRef.current = nextId;
    snapshotRef.current = next;
    draftRef.current = next;
    setDraft(next);
    setDirty(false);
  }, [block, flush]);

  useEffect(() => () => flush(), [flush]);

  const change = useCallback((updates: Partial<Block>) => {
    const next = mergeBlockDraft(draftRef.current, updates);
    draftRef.current = next;
    pendingRef.current = next;
    setDraft(next);
    setDirty(true);
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        flush();
      }, delayMs);
    }
  }, [delayMs, flush]);

  const discard = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
    const id = blockIdRef.current;
    if (id) commitRef.current(id, buildRevertPatch(snapshotRef.current, draftRef.current));
    draftRef.current = { ...snapshotRef.current };
    setDraft(draftRef.current);
    setDirty(false);
  }, []);

  return { draft, dirty, change, flush, discard };
}
