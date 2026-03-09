/**
 * useFrictionRecovery - Hook that manages friction detection for editor sessions
 * P5: Friction Recovery Layer
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EditorEventBuffer,
  type EditorEventType,
  type FrictionSignal,
} from '@/lib/editor/friction-detector';
import { trackEditorAction } from '@/lib/editor/editor-analytics';

export function useFrictionRecovery() {
  const bufferRef = useRef(new EditorEventBuffer());
  const [signal, setSignal] = useState<FrictionSignal | null>(null);

  const pushEvent = useCallback((type: EditorEventType, blockType?: string, blockId?: string) => {
    const buf = bufferRef.current;
    buf.push({ type, timestamp: Date.now(), blockType, blockId });
    const detected = buf.detect();
    if (detected) {
      setSignal(detected);
      trackEditorAction('friction_detected', { source: 'grid', blockType: detected.type });
    }
  }, []);

  const dismiss = useCallback(() => {
    if (signal) {
      bufferRef.current.dismiss(signal.type);
      trackEditorAction('friction_suggestion_dismissed', { source: 'grid', blockType: signal.type });
      setSignal(null);
    }
  }, [signal]);

  const accept = useCallback(() => {
    if (signal) {
      trackEditorAction('friction_suggestion_accepted', { source: 'grid', blockType: signal.type });
      setSignal(null);
    }
  }, [signal]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      bufferRef.current.clear();
    };
  }, []);

  return { signal, pushEvent, dismiss, accept };
}
