/**
 * Friction Detector - Detects stuck users via event patterns
 * P5: Friction Recovery Layer
 * 
 * Pure heuristics. No AI. No tokens.
 * Uses a ring buffer of recent editor events + threshold rules.
 */

export type EditorEventType =
  | 'undo' | 'redo'
  | 'block_added' | 'block_deleted'
  | 'block_reordered'
  | 'editor_opened' | 'editor_closed_no_save'
  | 'palette_opened' | 'palette_closed_no_insert'
  | 'inline_edit_started' | 'inline_edit_saved'
  | 'block_selected';

export interface EditorEvent {
  type: EditorEventType;
  timestamp: number;
  blockType?: string;
  blockId?: string;
}

export interface FrictionSignal {
  type: 'undo_loop' | 'insert_delete_cycle' | 'reorder_chaos' | 'edit_abandon' | 'palette_indecision';
  confidence: number; // 0-1
  suggestedAction: string;
  suggestedActionKey: string;
}

// Detection thresholds
const UNDO_LOOP_COUNT = 3;
const UNDO_LOOP_WINDOW_MS = 30_000;
const INSERT_DELETE_COUNT = 2;
const INSERT_DELETE_WINDOW_MS = 60_000;
const EDIT_ABANDON_COUNT = 3;
const EDIT_ABANDON_WINDOW_MS = 60_000;
const PALETTE_INDECISION_COUNT = 3;
const PALETTE_INDECISION_WINDOW_MS = 45_000;
const REORDER_CHAOS_COUNT = 4;
const REORDER_CHAOS_WINDOW_MS = 30_000;

const COOLDOWN_MS = 120_000;
const BUFFER_SIZE = 50;

/**
 * Ring buffer for recent editor events
 */
export class EditorEventBuffer {
  private buffer: EditorEvent[] = [];
  private lastSignalTime = 0;
  private dismissedTypes = new Set<string>();

  push(event: EditorEvent) {
    this.buffer.push(event);
    if (this.buffer.length > BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  /**
   * Detect friction from recent events.
   * Returns null if no friction or in cooldown.
   */
  detect(): FrictionSignal | null {
    const now = Date.now();
    if (now - this.lastSignalTime < COOLDOWN_MS) return null;

    const signal =
      this.detectUndoLoop(now) ??
      this.detectInsertDeleteCycle(now) ??
      this.detectEditAbandon(now) ??
      this.detectPaletteIndecision(now) ??
      this.detectReorderChaos(now);

    if (signal && !this.dismissedTypes.has(signal.type)) {
      this.lastSignalTime = now;
      return signal;
    }

    return null;
  }

  dismiss(type: string) {
    this.dismissedTypes.add(type);
  }

  resetDismissals() {
    this.dismissedTypes.clear();
  }

  clear() {
    this.buffer = [];
    this.lastSignalTime = 0;
  }

  private getRecentEvents(windowMs: number, now: number): EditorEvent[] {
    const cutoff = now - windowMs;
    return this.buffer.filter(e => e.timestamp >= cutoff);
  }

  private detectUndoLoop(now: number): FrictionSignal | null {
    const recent = this.getRecentEvents(UNDO_LOOP_WINDOW_MS, now);
    const undos = recent.filter(e => e.type === 'undo').length;
    if (undos >= UNDO_LOOP_COUNT) {
      return {
        type: 'undo_loop',
        confidence: Math.min(undos / 5, 1),
        suggestedAction: 'Try review mode to see problematic blocks',
        suggestedActionKey: 'review_mode',
      };
    }
    return null;
  }

  private detectInsertDeleteCycle(now: number): FrictionSignal | null {
    const recent = this.getRecentEvents(INSERT_DELETE_WINDOW_MS, now);
    const types = new Map<string, { adds: number; deletes: number }>();

    for (const e of recent) {
      if (e.blockType && (e.type === 'block_added' || e.type === 'block_deleted')) {
        if (!types.has(e.blockType)) types.set(e.blockType, { adds: 0, deletes: 0 });
        const entry = types.get(e.blockType)!;
        if (e.type === 'block_added') entry.adds++;
        else entry.deletes++;
      }
    }

    for (const [, counts] of types) {
      if (counts.adds >= INSERT_DELETE_COUNT && counts.deletes >= INSERT_DELETE_COUNT) {
        return {
          type: 'insert_delete_cycle',
          confidence: 0.7,
          suggestedAction: 'Try a preset instead of building from scratch',
          suggestedActionKey: 'use_preset',
        };
      }
    }
    return null;
  }

  private detectEditAbandon(now: number): FrictionSignal | null {
    const recent = this.getRecentEvents(EDIT_ABANDON_WINDOW_MS, now);
    const abandons = recent.filter(e => e.type === 'editor_closed_no_save').length;
    if (abandons >= EDIT_ABANDON_COUNT) {
      return {
        type: 'edit_abandon',
        confidence: Math.min(abandons / 5, 1),
        suggestedAction: 'Use inline edit for quick text changes',
        suggestedActionKey: 'use_inline_edit',
      };
    }
    return null;
  }

  private detectPaletteIndecision(now: number): FrictionSignal | null {
    const recent = this.getRecentEvents(PALETTE_INDECISION_WINDOW_MS, now);
    const opens = recent.filter(e => e.type === 'palette_closed_no_insert').length;
    if (opens >= PALETTE_INDECISION_COUNT) {
      return {
        type: 'palette_indecision',
        confidence: 0.6,
        suggestedAction: 'Check recommended blocks for your page',
        suggestedActionKey: 'show_recommendations',
      };
    }
    return null;
  }

  private detectReorderChaos(now: number): FrictionSignal | null {
    const recent = this.getRecentEvents(REORDER_CHAOS_WINDOW_MS, now);
    const reorders = recent.filter(e => e.type === 'block_reordered').length;
    if (reorders >= REORDER_CHAOS_COUNT) {
      return {
        type: 'reorder_chaos',
        confidence: Math.min(reorders / 6, 1),
        suggestedAction: 'Use structure view for easier reordering',
        suggestedActionKey: 'open_structure_view',
      };
    }
    return null;
  }
}

/** Singleton buffer for the editor session */
let _buffer: EditorEventBuffer | null = null;

export function getEditorEventBuffer(): EditorEventBuffer {
  if (!_buffer) {
    _buffer = new EditorEventBuffer();
  }
  return _buffer;
}

export function resetEditorEventBuffer(): void {
  _buffer?.clear();
  _buffer = null;
}
